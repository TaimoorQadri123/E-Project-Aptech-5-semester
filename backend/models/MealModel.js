import mongoose, { Schema } from "mongoose";

const itemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: String, default: "" },
    calories: { type: Number, default: 0 },
    proteinG: { type: Number, default: 0 },
    carbsG: { type: Number, default: 0 },
    fatG: { type: Number, default: 0 },
  },
  { _id: false }
);

const totalsSchema = new Schema(
  {
    calories: { type: Number, default: 0 },
    proteinG: { type: Number, default: 0 },
    carbsG: { type: Number, default: 0 },
    fatG: { type: Number, default: 0 },
  },
  { _id: false }
);

const mealSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true },
    mealType: { type: String, enum: ["breakfast", "lunch", "dinner", "snack"], required: true },
    items: { type: [itemSchema], default: [] },
    notes: { type: String, default: "" },
    totals: { type: totalsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const MealModel = mongoose.model("Meal", mealSchema);

export function calcMealTotals(items) {
  return items.reduce(
    (acc, item) => ({
      calories: acc.calories + Number(item.calories || 0),
      proteinG: acc.proteinG + Number(item.proteinG || 0),
      carbsG: acc.carbsG + Number(item.carbsG || 0),
      fatG: acc.fatG + Number(item.fatG || 0),
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

export default MealModel;
