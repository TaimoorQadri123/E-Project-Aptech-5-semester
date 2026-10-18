import { useCallback, useEffect, useState } from "react";
import client from "../api/client";

const MEAL_TYPES = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
];

const emptyItem = { name: "", quantity: "", calories: "", proteinG: "", carbsG: "", fatG: "" };

function shiftDate(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function Nutrition() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [meals, setMeals] = useState([]);
  const [dayTotals, setDayTotals] = useState({ calories: 0, proteinG: 0, carbsG: 0, fatG: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [filterMode, setFilterMode] = useState("day");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    mealType: "breakfast",
    items: [{ ...emptyItem }],
    notes: "",
  });
  const [formError, setFormError] = useState("");

  const loadDay = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filterMode === "day") {
        params.date = date;
      } else {
        if (from) params.from = from;
        if (to) params.to = to;
      }
      if (search) params.q = search;
      if (mealTypeFilter !== "all") params.mealType = mealTypeFilter;
      const res = await client.get("/nutrition", { params });
      setMeals(res.data.data.meals);
      setDayTotals(res.data.data.dayTotals);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load meals");
    } finally {
      setLoading(false);
    }
  }, [date, filterMode, search, mealTypeFilter, from, to]);

  useEffect(() => {
    loadDay();
  }, [loadDay]);

  const openAdd = (mealType) => {
    setEditId(null);
    setForm({ mealType, items: [{ ...emptyItem }], notes: "" });
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (meal) => {
    setEditId(meal._id);
    setForm({
      mealType: meal.mealType,
      items: meal.items.map((i) => ({
        name: i.name,
        quantity: i.quantity || "",
        calories: i.calories,
        proteinG: i.proteinG,
        carbsG: i.carbsG,
        fatG: i.fatG,
      })),
      notes: meal.notes || "",
    });
    setFormError("");
    setShowForm(true);
  };

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    setForm({ ...form, items });
  };

  const addItemRow = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });

  const saveMeal = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = {
        date,
        mealType: form.mealType,
        notes: form.notes,
        items: form.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          calories: Number(i.calories) || 0,
          proteinG: Number(i.proteinG) || 0,
          carbsG: Number(i.carbsG) || 0,
          fatG: Number(i.fatG) || 0,
        })),
      };
      if (editId) {
        await client.put(`/nutrition/${editId}`, payload);
      } else {
        await client.post("/nutrition", payload);
      }
      setShowForm(false);
      loadDay();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save meal");
    }
  };

  const deleteMeal = async (id) => {
    if (!window.confirm("Delete this meal?")) return;
    try {
      await client.delete(`/nutrition/${id}`);
      loadDay();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete meal");
    }
  };

  const mealsByType = (type) => meals.filter((m) => m.mealType === type);

  return (
    <>
      <h1 className="page-title">Nutrition 🥗</h1>

      <div className="day-nav card">
        <div className="tab-row" style={{ marginBottom: 0 }}>
          <button type="button" className={`btn btn-small ${filterMode === "day" ? "" : "btn-outline"}`} onClick={() => setFilterMode("day")}>Day</button>
          <button type="button" className={`btn btn-small ${filterMode === "range" ? "" : "btn-outline"}`} onClick={() => setFilterMode("range")}>Range</button>
        </div>
        {filterMode === "day" ? (
          <>
            <button type="button" className="btn btn-outline btn-small" onClick={() => setDate(shiftDate(date, -1))}>← Previous</button>
            <strong>{date}</strong>
            <button type="button" className="btn btn-outline btn-small" onClick={() => setDate(shiftDate(date, 1))}>Next →</button>
          </>
        ) : (
          <p className="muted">Showing meals across the selected date range below.</p>
        )}
      </div>

      <div className="stats">
        <div className="stat"><h3>{dayTotals.calories}</h3><p>Calories</p></div>
        <div className="stat"><h3>{dayTotals.proteinG}g</h3><p>Protein</p></div>
        <div className="stat"><h3>{dayTotals.carbsG}g</h3><p>Carbs</p></div>
        <div className="stat"><h3>{dayTotals.fatG}g</h3><p>Fat</p></div>
      </div>

      <div className="filter-row card">
        <div><label>Search food</label><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Food name" /></div>
        <div>
          <label>Meal type</label>
          <select value={mealTypeFilter} onChange={(e) => setMealTypeFilter(e.target.value)}>
            <option value="all">All</option>
            {MEAL_TYPES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
        </div>
        {filterMode === "range" && (
          <>
            <div><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
            <div><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
          </>
        )}
      </div>

      {showForm && (
        <form className="card form-grid" onSubmit={saveMeal}>
          <h2 className="full">{editId ? "Edit meal" : "Add meal"}</h2>
          {formError && <div className="alert full">{formError}</div>}
          <div>
            <label>Meal type</label>
            <select value={form.mealType} onChange={(e) => setForm({ ...form, mealType: e.target.value })}>
              {MEAL_TYPES.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
            </select>
          </div>
          {form.items.map((item, index) => (
            <div key={index} className="exercise-block full form-grid">
              <div><label>Food</label><input value={item.name} onChange={(e) => updateItem(index, "name", e.target.value)} required /></div>
              <div><label>Quantity</label><input value={item.quantity} onChange={(e) => updateItem(index, "quantity", e.target.value)} placeholder="1 bowl" /></div>
              <div><label>Calories</label><input type="number" value={item.calories} onChange={(e) => updateItem(index, "calories", e.target.value)} /></div>
              <div><label>Protein (g)</label><input type="number" value={item.proteinG} onChange={(e) => updateItem(index, "proteinG", e.target.value)} /></div>
              <div><label>Carbs (g)</label><input type="number" value={item.carbsG} onChange={(e) => updateItem(index, "carbsG", e.target.value)} /></div>
              <div><label>Fat (g)</label><input type="number" value={item.fatG} onChange={(e) => updateItem(index, "fatG", e.target.value)} /></div>
            </div>
          ))}
          <div className="full"><button type="button" className="btn btn-outline btn-small" onClick={addItemRow}>+ Add food item</button></div>
          <div className="full"><label>Notes</label><input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <div className="full flex gap-2">
            <button type="submit" className="btn">Save meal</button>
            <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {error && <div className="alert">{error}</div>}
      {loading && <p className="muted">Loading meals...</p>}

      {!loading && MEAL_TYPES.map((section) => (
        <div key={section.key} className="meal-section">
          <div className="flex items-center justify-between">
            <h2>{section.label}</h2>
            <button type="button" className="btn btn-small" onClick={() => openAdd(section.key)}>+ Add</button>
          </div>
          {mealsByType(section.key).length === 0 && <p className="muted">No {section.label.toLowerCase()} logged.</p>}
          {mealsByType(section.key).map((m) => (
            <div className="card item" key={m._id}>
              <div>
                <p><b>{m.items.map((i) => i.name).join(", ")}</b></p>
                <p className="muted">{m.totals.calories} kcal — P {m.totals.proteinG}g C {m.totals.carbsG}g F {m.totals.fatG}g</p>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn btn-small btn-outline" onClick={() => openEdit(m)}>Edit</button>
                <button type="button" className="btn btn-small btn-danger" onClick={() => deleteMeal(m._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ))}
    </>
  );
}
