import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await client.get("/dashboard");
        setData(res.data.data);
      } catch (err) {
        setError(err.response?.data?.message || "Could not load dashboard");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <p className="muted">Loading dashboard...</p>;
  if (error) return <div className="alert">{error}</div>;
  if (!data) return null;

  const chartData = data.caloriesLast7Days.map((d) => ({
    day: d.date.slice(5),
    cal: d.calories,
  }));

  return (
    <>
      <h1 className="page-title">Hello, {user?.username || user?.name} 👋</h1>

      <div className="quick-links">
        <Link to="/workouts">+ Add workout</Link>
        <Link to="/nutrition">+ Log meal</Link>
        <Link to="/progress">+ Log progress</Link>
      </div>

      <div className="stats">
        <div className="stat"><span>🏋️</span><h3>{data.workoutsThisWeek}</h3><p>Workouts this week</p></div>
        <div className="stat"><span>🔥</span><h3>{data.todayTotals.calories}</h3><p>Today calories</p></div>
        <div className="stat"><span>🥩</span><h3>{data.todayTotals.proteinG}g</h3><p>Today protein</p></div>
        <div className="stat"><span>⚖️</span><h3>{data.latestWeight ? `${data.latestWeight.value} kg` : "—"}</h3><p>Latest weight {data.weightChange != null && `(${data.weightChange > 0 ? "+" : ""}${data.weightChange})`}</p></div>
      </div>

      <div className="card">
        <h2>Calories — last 7 days</h2>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cal" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>Recent workouts</h2>
          {data.lastWorkouts.length === 0 && <p className="muted">No workouts yet.</p>}
          {data.lastWorkouts.map((w) => (
            <div className="row" key={w._id}>
              <div><b>{w.title}</b><p className="muted">{w.category} • {w.date}</p></div>
            </div>
          ))}
        </div>

        <div className="card">
          <h2>Recent meals</h2>
          {data.lastMeals.length === 0 && <p className="muted">No meals logged yet.</p>}
          {data.lastMeals.map((m) => (
            <div className="row" key={m._id}>
              <div>
                <b>{m.items.map((i) => i.name).join(", ")}</b>
                <p className="muted">{m.mealType} • {m.date} • {m.totals.calories} kcal</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
