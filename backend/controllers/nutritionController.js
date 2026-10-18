import MealModel, { calcMealTotals } from "../models/MealModel.js";

function validateMealBody(body) {
  const date = body.date;
  const mealType = body.mealType;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, message: "Date must be YYYY-MM-DD" };
  }
  if (!["breakfast", "lunch", "dinner", "snack"].includes(mealType)) {
    return { ok: false, message: "Invalid meal type" };
  }
  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return { ok: false, message: "Add at least one food item" };
  }
  const cleanItems = items
    .map((item) => ({
      name: String(item.name || "").trim(),
      quantity: String(item.quantity || ""),
      calories: Number(item.calories) || 0,
      proteinG: Number(item.proteinG) || 0,
      carbsG: Number(item.carbsG) || 0,
      fatG: Number(item.fatG) || 0,
    }))
    .filter((item) => item.name);

  if (cleanItems.length === 0) {
    return { ok: false, message: "Food item name is required" };
  }

  return {
    ok: true,
    data: {
      date,
      mealType,
      items: cleanItems,
      notes: typeof body.notes === "string" ? body.notes.trim() : "",
      totals: calcMealTotals(cleanItems),
    },
  };
}

export async function listMealsByDate(req, res) {
  try {
    const date = req.query.date;
    const { q, mealType, from, to } = req.query;

    const hasDay = date && /^\d{4}-\d{2}-\d{2}$/.test(date);
    const hasRange = from || to;

    if (!hasDay && !hasRange) {
      return res.status(400).json({ status: "error", message: "Use date=YYYY-MM-DD or from/to range" });
    }
    if (hasDay && hasRange) {
      return res.status(400).json({
        status: "error",
        message: "Use either a single day (date) or a from/to range, not both",
      });
    }

    const filter = { user: req.user.id };

    if (hasRange) {
      filter.date = {};
      if (from) filter.date.$gte = from;
      if (to) filter.date.$lte = to;
    } else {
      filter.date = date;
    }

    if (mealType && mealType !== "all") filter.mealType = mealType;

    let meals = await MealModel.find(filter).sort({ mealType: 1, createdAt: -1 });

    if (q) {
      const regex = new RegExp(q.trim(), "i");
      meals = meals.filter((m) => m.items.some((item) => regex.test(item.name)));
    }

    const dayTotals = meals.reduce(
      (acc, m) => ({
        calories: acc.calories + (m.totals?.calories || 0),
        proteinG: acc.proteinG + (m.totals?.proteinG || 0),
        carbsG: acc.carbsG + (m.totals?.carbsG || 0),
        fatG: acc.fatG + (m.totals?.fatG || 0),
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
    );

    return res.status(200).json({ status: "success", data: { meals, dayTotals } });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function createMeal(req, res) {
  try {
    const check = validateMealBody(req.body);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const meal = await MealModel.create({ ...check.data, user: req.user.id });
    return res.status(201).json({ status: "success", data: meal });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function updateMeal(req, res) {
  try {
    const check = validateMealBody(req.body);
    if (!check.ok) return res.status(400).json({ status: "error", message: check.message });

    const meal = await MealModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      check.data,
      { new: true, runValidators: true }
    );
    if (!meal) return res.status(404).json({ status: "error", message: "Meal not found" });
    return res.status(200).json({ status: "success", data: meal });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}

export async function deleteMeal(req, res) {
  try {
    const meal = await MealModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!meal) return res.status(404).json({ status: "error", message: "Meal not found" });
    return res.status(200).json({ status: "success", message: "Meal deleted" });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
}
