import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { displayWeight, toStorageWeight, weightLabel } from "../utils/units";

const METRICS = [
  { value: "weight", label: "Weight (kg)" },
  { value: "bodyFat", label: "Body fat (%)" },
  { value: "waist", label: "Waist (cm)" },
  { value: "chest", label: "Chest (cm)" },
  { value: "hips", label: "Hips (cm)" },
  { value: "arm", label: "Arm (cm)" },
  { value: "thigh", label: "Thigh (cm)" },
  { value: "run5k", label: "5K run (min)" },
  { value: "benchPress", label: "Bench press (kg)" },
  { value: "squat", label: "Squat (kg)" },
  { value: "deadlift", label: "Deadlift (kg)" },
];

const RANGES = { "1M": 30, "3M": 90, "6M": 180, All: null };

export default function Progress() {
  const { user } = useAuth();
  const units = user?.preferences?.units || "metric";
  const [metric, setMetric] = useState("weight");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [range, setRange] = useState("3M");
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ date: "", value: "", note: "" });
  const [formError, setFormError] = useState("");

  const loadProgress = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await client.get("/progress", { params: { metric } });
      setList(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load progress");
    } finally {
      setLoading(false);
    }
  }, [metric]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  const filtered = useMemo(() => {
    const days = RANGES[range];
    if (!days) return list;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutStr = cutoff.toISOString().slice(0, 10);
    return list.filter((e) => e.date >= cutStr);
  }, [list, range]);

  const chartData = filtered.map((e) => ({
    date: e.date,
    value: metric === "weight" && units === "imperial" ? displayWeight(e.value, units) : e.value,
  }));

  const latest = filtered.length ? filtered[filtered.length - 1] : null;
  const change = filtered.length >= 2
    ? Number((filtered[filtered.length - 1].value - filtered[0].value).toFixed(1))
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      let value = Number(form.value);
      if (metric === "weight") value = toStorageWeight(form.value, units);
      const payload = { date: form.date, metric, value, note: form.note };
      if (editId) {
        await client.put(`/progress/${editId}`, payload);
      } else {
        await client.post("/progress", payload);
      }
      setForm({ date: "", value: "", note: "" });
      setEditId(null);
      loadProgress();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save entry");
    }
  };

  const startEdit = (entry) => {
    setEditId(entry._id);
    const val = metric === "weight" ? displayWeight(entry.value, units) : entry.value;
    setForm({ date: entry.date, value: val, note: entry.note || "" });
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this reading?")) return;
    try {
      await client.delete(`/progress/${id}`);
      if (editId === id) setEditId(null);
      loadProgress();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete");
    }
  };

  return (
    <>
      <h1 className="page-title">Progress 📈</h1>

      <div className="card form-grid" style={{ marginBottom: "1rem" }}>
        <div>
          <label>Metric</label>
          <select value={metric} onChange={(e) => { setMetric(e.target.value); setEditId(null); }}>
            {METRICS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <label>Chart range</label>
          <select value={range} onChange={(e) => setRange(e.target.value)}>
            {Object.keys(RANGES).map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        {latest && (
          <div className="full muted">
            Latest: <b>{latest.value}</b>
            {change != null && <> • Change since first in range: <b>{change > 0 ? "+" : ""}{change}</b></>}
          </div>
        )}
      </div>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <h2 className="full">{editId ? "Edit reading" : "New reading"}</h2>
        {formError && <div className="alert full">{formError}</div>}
        <div><label>Date</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
        <div><label>Value {metric === "weight" ? `(${weightLabel(units)})` : ""}</label><input type="number" step="0.1" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
        <div className="full"><label>Note</label><input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
        <div className="full flex gap-2">
          <button type="submit" className="btn">{editId ? "Update" : "Save entry"}</button>
          {editId && <button type="button" className="btn btn-outline" onClick={() => { setEditId(null); setForm({ date: "", value: "", note: "" }); }}>Cancel</button>}
        </div>
      </form>

      {error && <div className="alert">{error}</div>}

      <div className="card" style={{ marginTop: "1.5rem" }}>
        <h2>Trend</h2>
        {loading && <p className="muted">Loading chart...</p>}
        {!loading && chartData.length === 0 && <p className="muted">No data for this metric yet.</p>}
        {chartData.length > 0 && (
          <div style={{ width: "100%", height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card table-wrap" style={{ marginTop: "1rem" }}>
        <table>
          <thead><tr><th>Date</th><th>Value</th><th>Note</th><th></th></tr></thead>
          <tbody>
            {[...filtered].reverse().map((p) => (
              <tr key={p._id}>
                <td>{p.date}</td>
                <td>{p.metric === "weight" && units === "imperial" ? `${displayWeight(p.value, units)} lb` : p.value}</td>
                <td>{p.note || "-"}</td>
                <td>
                  <button type="button" className="btn btn-small btn-outline" onClick={() => startEdit(p)}>Edit</button>{" "}
                  <button type="button" className="btn btn-small btn-danger" onClick={() => deleteEntry(p._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
