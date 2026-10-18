import { useCallback, useEffect, useState } from "react";
import client from "../api/client";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const emptyReminder = {
  title: "",
  type: "workout",
  time: "08:00",
  days: [1, 2, 3, 4, 5],
  enabled: true,
};

export default function Notifications() {
  const [tab, setTab] = useState("notifications");
  const [list, setList] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(emptyReminder);
  const [editId, setEditId] = useState(null);
  const [formError, setFormError] = useState("");

  const loadNotifications = useCallback(async () => {
    const res = await client.get("/notifications");
    setList(res.data.data.list);
  }, []);

  const loadReminders = useCallback(async () => {
    const res = await client.get("/reminders");
    setReminders(res.data.data);
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadNotifications(), loadReminders()]);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load data");
    } finally {
      setLoading(false);
    }
  }, [loadNotifications, loadReminders]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const markRead = async (id) => {
    await client.patch(`/notifications/${id}/read`);
    loadNotifications();
  };

  const markAllRead = async () => {
    await client.patch("/notifications/read-all");
    loadNotifications();
  };

  const deleteNote = async (id) => {
    await client.delete(`/notifications/${id}`);
    loadNotifications();
  };

  const toggleDay = (d) => {
    const days = form.days.includes(d) ? form.days.filter((x) => x !== d) : [...form.days, d];
    setForm({ ...form, days: days.sort() });
  };

  const saveReminder = async (e) => {
    e.preventDefault();
    setFormError("");
    try {
      if (editId) {
        await client.put(`/reminders/${editId}`, form);
      } else {
        await client.post("/reminders", form);
      }
      setForm(emptyReminder);
      setEditId(null);
      loadReminders();
    } catch (err) {
      setFormError(err.response?.data?.message || "Could not save reminder");
    }
  };

  const editReminder = (r) => {
    setEditId(r._id);
    setForm({
      title: r.title,
      type: r.type,
      time: r.time,
      days: r.days,
      enabled: r.enabled,
    });
  };

  const deleteReminder = async (id) => {
    if (!window.confirm("Delete this reminder?")) return;
    await client.delete(`/reminders/${id}`);
    loadReminders();
  };

  const requestBrowserNotify = () => {
    if ("Notification" in window) Notification.requestPermission();
  };

  return (
    <>
      <h1 className="page-title">Notifications 🔔</h1>

      <div className="tab-row">
        <button type="button" className={`btn btn-small ${tab === "notifications" ? "" : "btn-outline"}`} onClick={() => setTab("notifications")}>Inbox</button>
        <button type="button" className={`btn btn-small ${tab === "reminders" ? "" : "btn-outline"}`} onClick={() => setTab("reminders")}>Reminders</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {tab === "notifications" && !loading && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" className="btn btn-small btn-outline" onClick={markAllRead}>Mark all read</button>
            <button type="button" className="btn btn-small btn-outline" onClick={requestBrowserNotify}>Enable browser alerts</button>
          </div>
          {list.length === 0 ? (
            <p className="card muted center-text">No notifications yet.</p>
          ) : (
            <div className="list">
              {list.map((n) => (
                <div className={`card item ${n.read ? "" : "unread-note"}`} key={n._id}>
                  <div>
                    <span className="badge">{n.type}</span>
                    <p>{n.message}</p>
                    <p className="muted">{new Date(n.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    {!n.read && <button type="button" className="btn btn-small btn-outline" onClick={() => markRead(n._id)}>Mark read</button>}
                    <button type="button" className="btn btn-small btn-danger" onClick={() => deleteNote(n._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === "reminders" && !loading && (
        <>
          <form className="card form-grid" onSubmit={saveReminder}>
            <h2 className="full">{editId ? "Edit reminder" : "New reminder"}</h2>
            {formError && <div className="alert full">{formError}</div>}
            <div><label>Title</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div>
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="workout">Workout</option>
                <option value="meal">Meal</option>
                <option value="goal">Goal</option>
              </select>
            </div>
            <div><label>Time (HH:MM)</label><input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} pattern="\d{2}:\d{2}" required /></div>
            <div className="full">
              <label>Days</label>
              <div className="day-chips">
                {DAYS.map((label, i) => (
                  <button
                    key={label}
                    type="button"
                    className={`chip ${form.days.includes(i) ? "active" : ""}`}
                    onClick={() => toggleDay(i)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="full">
              <label><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Enabled</label>
            </div>
            <div className="full flex gap-2">
              <button type="submit" className="btn">{editId ? "Update" : "Add reminder"}</button>
              {editId && <button type="button" className="btn btn-outline" onClick={() => { setEditId(null); setForm(emptyReminder); }}>Cancel</button>}
            </div>
          </form>

          <div className="list" style={{ marginTop: "1rem" }}>
            {reminders.length === 0 && <p className="muted card center-text">No reminders yet.</p>}
            {reminders.map((r) => (
              <div className="card item" key={r._id}>
                <div>
                  <h3>{r.title} {!r.enabled && <span className="badge">off</span>}</h3>
                  <p className="muted">{r.type} at {r.time} — {r.days.map((d) => DAYS[d]).join(", ")}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn btn-small btn-outline" onClick={() => editReminder(r)}>Edit</button>
                  <button type="button" className="btn btn-small btn-danger" onClick={() => deleteReminder(r._id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}
