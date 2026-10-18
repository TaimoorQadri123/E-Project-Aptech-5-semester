import { useCallback, useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { displayWeight, toStorageWeight, weightLabel } from "../utils/units";

const CATEGORIES = [
  "strength", "cardio", "hiit", "flexibility", "yoga", "sports", "other",
];

const emptyExercise = { name: "", sets: "", reps: "", weightKg: "", notes: "" };

const emptyForm = {
  title: "",
  category: "strength",
  date: new Date().toISOString().slice(0, 10),
  durationMin: "",
  caloriesBurned: "",
  intensity: "medium",
  exercises: [{ ...emptyExercise }],
  tags: "",
  notes: "",
};

export default function Workouts() {
  const { user } = useAuth();
  const units = user?.preferences?.units || "metric";
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [tag, setTag] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState("newest");

  const loadWorkouts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.q = search;
      if (category !== "all") params.category = category;
      if (tag) params.tag = tag;
      if (from) params.from = from;
      if (to) params.to = to;
      if (sort === "oldest") params.sort = "date";
      const res = await client.get("/workouts", { params });
      setList(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load workouts");
    } finally {
      setLoading(false);
    }
  }, [search, category, tag, from, to, sort]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const updateExercise = (index, field, value) => {
    const exercises = [...form.exercises];
    exercises[index] = { ...exercises[index], [field]: value };
    setForm({ ...form, exercises });
  };

  const addExerciseRow = () => {
    setForm({ ...form, exercises: [...form.exercises, { ...emptyExercise }] });
  };

  const removeExerciseRow = (index) => {
    if (form.exercises.length === 1) return;
    setForm({ ...form, exercises: form.exercises.filter((_, i) => i !== index) });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setFormError("");
  };

  const startEdit = (w) => {
    setEditId(w._id);
    setForm({
      title: w.title,
      category: w.category,
      date: w.date,
      durationMin: w.durationMin ?? "",
      caloriesBurned: w.caloriesBurned ?? "",
      intensity: w.intensity || "medium",
      exercises: w.exercises.length
        ? w.exercises.map((ex) => ({
            name: ex.name,
            sets: ex.sets,
            reps: ex.reps,
            weightKg: displayWeight(ex.weightKg, units),
            notes: ex.notes || "",
          }))
        : [{ ...emptyExercise }],
      tags: (w.tags || []).join(", "),
      notes: w.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => ({
    title: form.title,
    category: form.category,
    date: form.date,
    durationMin: Number(form.durationMin) || 0,
    caloriesBurned: form.caloriesBurned === "" ? undefined : Number(form.caloriesBurned),
    intensity: form.intensity,
    exercises: form.exercises.map((ex) => ({
      name: ex.name,
      sets: Number(ex.sets) || 0,
      reps: Number(ex.reps) || 0,
      weightKg: toStorageWeight(ex.weightKg, units) || 0,
      notes: ex.notes,
    })),
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    notes: form.notes,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      const payload = buildPayload();
      if (editId) {
        await client.put(`/workouts/${editId}`, payload);
      } else {
        await client.post("/workouts", payload);
      }
      resetForm();
      loadWorkouts();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save workout");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workout?")) return;
    try {
      await client.delete(`/workouts/${id}`);
      if (editId === id) resetForm();
      loadWorkouts();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete workout");
    }
  };

  return (
    <>
      <h1 className="page-title">Workouts 🏋️</h1>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="full">{editId ? "Edit Workout" : "New Workout"}</h2>
        {formError && <div className="alert full">{formError}</div>}

        <div><label>Title</label><input name="title" value={form.title} onChange={handleChange} required /></div>
        <div>
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div><label>Date</label><input type="date" name="date" value={form.date} onChange={handleChange} required /></div>
        <div><label>Duration (min)</label><input type="number" name="durationMin" value={form.durationMin} onChange={handleChange} /></div>
        <div><label>Calories burned</label><input type="number" name="caloriesBurned" value={form.caloriesBurned} onChange={handleChange} /></div>
        <div>
          <label>Intensity</label>
          <select name="intensity" value={form.intensity} onChange={handleChange}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div className="full"><label>Tags (comma separated)</label><input name="tags" value={form.tags} onChange={handleChange} placeholder="legs, morning" /></div>

        {form.exercises.map((ex, index) => (
          <div key={index} className="exercise-block full form-grid">
            <h3 className="full text-sm font-semibold">Exercise {index + 1}</h3>
            <div><label>Name</label><input value={ex.name} onChange={(e) => updateExercise(index, "name", e.target.value)} required={index === 0} /></div>
            <div><label>Sets</label><input type="number" value={ex.sets} onChange={(e) => updateExercise(index, "sets", e.target.value)} /></div>
            <div><label>Reps</label><input type="number" value={ex.reps} onChange={(e) => updateExercise(index, "reps", e.target.value)} /></div>
            <div><label>Weight ({weightLabel(units)})</label><input type="number" value={ex.weightKg} onChange={(e) => updateExercise(index, "weightKg", e.target.value)} /></div>
            <div className="full"><label>Notes</label><input value={ex.notes} onChange={(e) => updateExercise(index, "notes", e.target.value)} /></div>
            {form.exercises.length > 1 && (
              <div className="full">
                <button type="button" className="btn btn-small btn-danger" onClick={() => removeExerciseRow(index)}>Remove exercise</button>
              </div>
            )}
          </div>
        ))}

        <div className="full flex gap-2">
          <button type="button" className="btn btn-outline btn-small" onClick={addExerciseRow}>+ Add exercise</button>
        </div>
        <div className="full"><label>Workout notes</label><textarea name="notes" rows={2} value={form.notes} onChange={handleChange} /></div>

        <div className="full flex flex-wrap gap-2">
          <button type="submit" className="btn">{editId ? "Update workout" : "Add workout"}</button>
          {editId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel edit</button>}
        </div>
      </form>

      <div className="filter-row card" style={{ marginTop: "1.5rem" }}>
        <div><label>Search</label><input placeholder="Title, notes, tags..." value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div>
          <label>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label>Tag</label><input value={tag} onChange={(e) => setTag(e.target.value)} placeholder="exact tag" /></div>
        <div><label>Sort</label>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && <p className="muted">Loading workouts...</p>}

      <div className="list">
        {!loading && list.length === 0 && (
          <p className="muted center-text card">No workouts yet. Add your first workout above.</p>
        )}
        {list.map((w) => (
          <div className="card item" key={w._id}>
            <div>
              <h3>{w.title} <span className="badge">{w.category}</span></h3>
              <p className="muted">{w.date} • {w.durationMin} min • {w.intensity}</p>
              <ul className="text-sm">
                {w.exercises?.map((ex, i) => (
                  <li key={i}>{ex.name}: {ex.sets}×{ex.reps} @ {ex.weightKg}{weightLabel(units)}</li>
                ))}
              </ul>
              {w.tags?.length > 0 && <p className="muted">Tags: {w.tags.join(", ")}</p>}
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn btn-small btn-outline" onClick={() => startEdit(w)}>Edit</button>
              <button type="button" className="btn btn-small btn-danger" onClick={() => handleDelete(w._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
