import WorkoutModel from "../models/WorkoutModel.js";
import MealModel from "../models/MealModel.js";
import { addDays, daysAgo, todayStr, weekKey } from "../utils/dateHelpers.js";

function parseWorkoutRange(range) {
  const n = Number(range);
  if ([30, 90, 365].includes(n)) return n;
  return 30;
}

function parseNutritionRange(range) {
  const n = Number(range);
  if ([7, 30, 90].includes(n)) return n;
  return 7;
}

export async function getWorkoutAnalytics(req, res) {
  try {
    const days = parseWorkoutRange(req.query.range);
    const from = daysAgo(days - 1);
    const to = todayStr();
    const exerciseName = typeof req.query.exercise === "string" ? req.query.exercise.trim() : "";

    const workouts = await WorkoutModel.find({
      user: req.user.id,
      date: { $gte: from, $lte: to },
    }).sort({ date: 1 });

    const weekCounts = {};
    const weekMinutes = {};
    const categoryCounts = {};

    for (const w of workouts) {
      const wk = weekKey(w.date);
      weekCounts[wk] = (weekCounts[wk] || 0) + 1;
      weekMinutes[wk] = (weekMinutes[wk] || 0) + (w.durationMin || 0);
      categoryCounts[w.category] = (categoryCounts[w.category] || 0) + 1;
    }

    const workoutsPerWeek = Object.keys(weekCounts)
      .sort()
      .map((week) => ({ week, count: weekCounts[week] }));

    const minutesPerWeek = Object.keys(weekMinutes)
      .sort()
      .map((week) => ({ week, minutes: weekMinutes[week] }));

    const workoutsByCategory = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));

    const exerciseHistory = [];
    if (exerciseName) {
      const byDate = {};
      for (const w of workouts) {
        let maxW = 0;
        for (const ex of w.exercises || []) {
          if (ex.name.toLowerCase() === exerciseName.toLowerCase()) {
            maxW = Math.max(maxW, ex.weightKg || 0);
          }
        }
        if (maxW > 0) {
          byDate[w.date] = Math.max(byDate[w.date] || 0, maxW);
        }
      }
      for (const date of Object.keys(byDate).sort()) {
        exerciseHistory.push({ date, maxWeightKg: byDate[date] });
      }
    }

    return res.status(200).json({
      status: "success",
      data: { workoutsPerWeek, minutesPerWeek, workoutsByCategory, exerciseHistory },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function getExerciseNames(req, res) {
  try {
    const workouts = await WorkoutModel.find({ user: req.user.id }).select("exercises");
    const names = new Set();
    for (const w of workouts) {
      for (const ex of w.exercises || []) {
        if (ex.name) names.add(ex.name.trim());
      }
    }
    return res.status(200).json({
      status: "success",
      data: [...names].sort((a, b) => a.localeCompare(b)),
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function getNutritionAnalytics(req, res) {
  try {
    const days = parseNutritionRange(req.query.range);
    const from = daysAgo(days - 1);
    const to = todayStr();

    const meals = await MealModel.find({
      user: req.user.id,
      date: { $gte: from, $lte: to },
    });

    const dailyMap = {};
    let totalCal = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;

    for (const m of meals) {
      const cal = m.totals?.calories || 0;
      const p = m.totals?.proteinG || 0;
      const c = m.totals?.carbsG || 0;
      const f = m.totals?.fatG || 0;
      dailyMap[m.date] = (dailyMap[m.date] || 0) + cal;
      totalCal += cal;
      totalProtein += p;
      totalCarbs += c;
      totalFat += f;
    }

    const dailyCalories = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = addDays(to, -i);
      dailyCalories.push({ date: d, calories: dailyMap[d] || 0 });
    }

    const daysWithData = dailyCalories.filter((d) => d.calories > 0).length || 1;
    const avgDailyCalories = Math.round(totalCal / daysWithData);

    const mealCount = meals.length || 1;
    const avgProteinG = Math.round((totalProtein / mealCount) * 10) / 10;
    const avgCarbsG = Math.round((totalCarbs / mealCount) * 10) / 10;
    const avgFatG = Math.round((totalFat / mealCount) * 10) / 10;

    const proteinCal = totalProtein * 4;
    const carbsCal = totalCarbs * 4;
    const fatCal = totalFat * 9;
    const macroTotal = proteinCal + carbsCal + fatCal || 1;

    const macroSplit = [
      { name: "Protein", percent: Math.round((proteinCal / macroTotal) * 100) },
      { name: "Carbs", percent: Math.round((carbsCal / macroTotal) * 100) },
      { name: "Fat", percent: Math.round((fatCal / macroTotal) * 100) },
    ];

    return res.status(200).json({
      status: "success",
      data: {
        dailyCalories,
        avgDailyCalories,
        avgProteinG,
        avgCarbsG,
        avgFatG,
        macroSplit,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
