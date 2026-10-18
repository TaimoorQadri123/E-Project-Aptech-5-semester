import { useEffect, useState } from "react";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { user, setUser, updateTheme } = useAuth();
  const [prefs, setPrefs] = useState({
    units: "metric",
    theme: "light",
    notifications: { workout: true, goal: true, reminder: true },
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user?.preferences) {
      setPrefs({
        units: user.preferences.units || "metric",
        theme: user.preferences.theme || "light",
        notifications: { ...user.preferences.notifications },
      });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await client.put("/users/me/preferences", prefs);
      updateTheme(res.data.data.theme);
      setUser({ ...user, preferences: res.data.data });
      setMessage("Settings saved ✅");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save settings");
    }
  };

  return (
    <>
      <h1 className="page-title">Settings ⚙️</h1>

      <form className="card form-grid" onSubmit={handleSave}>
        {message && <div className="alert success full">{message}</div>}
        {error && <div className="alert full">{error}</div>}

        <div>
          <label>Units</label>
          <select value={prefs.units} onChange={(e) => setPrefs({ ...prefs, units: e.target.value })}>
            <option value="metric">Metric (kg, cm)</option>
            <option value="imperial">Imperial (lb, ft/in display)</option>
          </select>
        </div>
        <div>
          <label>Theme</label>
          <select value={prefs.theme} onChange={(e) => setPrefs({ ...prefs, theme: e.target.value })}>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="full">
          <h2 className="text-lg font-semibold">Notification types</h2>
          <label className="block mt-2">
            <input
              type="checkbox"
              checked={prefs.notifications.workout}
              onChange={(e) => setPrefs({ ...prefs, notifications: { ...prefs.notifications, workout: e.target.checked } })}
            /> Workout logged
          </label>
          <label className="block mt-2">
            <input
              type="checkbox"
              checked={prefs.notifications.goal}
              onChange={(e) => setPrefs({ ...prefs, notifications: { ...prefs.notifications, goal: e.target.checked } })}
            /> Goal achieved
          </label>
          <label className="block mt-2">
            <input
              type="checkbox"
              checked={prefs.notifications.reminder}
              onChange={(e) => setPrefs({ ...prefs, notifications: { ...prefs.notifications, reminder: e.target.checked } })}
            /> Reminders
          </label>
        </div>

        <div className="full"><button type="submit" className="btn">Save settings</button></div>
      </form>
    </>
  );
}
