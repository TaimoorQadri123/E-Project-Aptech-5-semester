import MealModel from "../models/MealModel.js";
import WorkoutModel from "../models/WorkoutModel.js";
import ProgressEntryModel from "../models/ProgressEntryModel.js";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function startOfWeekMonday(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export async function getDashboard(req, res) {
  try {
    const userId = req.user.id;
    const today = todayStr();
    const weekStart = startOfWeekMonday(today);

    const todayMeals = await MealModel.find({ user: userId, date: today });
    const todayTotals = todayMeals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.totals?.calories || 0),
        proteinG: acc.proteinG + (m.totals?.proteinG || 0),
        carbsG: acc.carbsG + (m.totals?.carbsG || 0),
        fatG: acc.fatG + (m.totals?.fatG || 0),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );

    const workoutsThisWeek = await WorkoutModel.countDocuments({
      user: userId,
      date: { $gte: weekStart, $lte: today },
    });

    const lastWorkouts = await WorkoutModel.find({ user: userId }).sort({ date: -1 }).limit(5);
    const lastMeals = await MealModel.find({ user: userId }).sort({ date: -1, createdAt: -1 }).limit(5);

    const weightEntries = await ProgressEntryModel.find({ user: userId, metric: "weight" }).sort({ date: 1 });
    let latestWeight = null;
    let weightChange = null;
    if (weightEntries.length) {
      latestWeight = weightEntries[weightEntries.length - 1];
      const first = weightEntries[0];
      weightChange = Number((latestWeight.value - first.value).toFixed(1));
    }

    const caloriesLast7Days = [];
    for (let i = 6; i >= 0; i--) {
      const day = addDays(today, -i);
      const meals = await MealModel.find({ user: userId, date: day });
      const cal = meals.reduce((sum, m) => sum + (m.totals?.calories || 0), 0);
      caloriesLast7Days.push({ date: day, calories: cal });
    }

    return res.status(200).json({
      status: "success",
      data: {
        todayTotals,
        workoutsThisWeek,
        lastWorkouts,
        lastMeals,
        latestWeight,
        weightChange,
        caloriesLast7Days,
      },
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
