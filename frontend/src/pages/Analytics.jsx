import { useEffect, useState } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import client from "../api/client";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#64748b"];

export default function Analytics() {
  const [tab, setTab] = useState("workouts");
  const [workoutRange, setWorkoutRange] = useState("30");
  const [nutritionRange, setNutritionRange] = useState("7");
  const [workoutData, setWorkoutData] = useState(null);
  const [nutritionData, setNutritionData] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exercise, setExercise] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/analytics/exercises").then((res) => {
      setExercises(res.data.data);
      if (res.data.data.length) setExercise(res.data.data[0]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab !== "workouts") return;
    setLoading(true);
    setError("");
    client
      .get("/analytics/workouts", { params: { range: workoutRange, exercise } })
      .then((res) => setWorkoutData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load workout analytics"))
      .finally(() => setLoading(false));
  }, [tab, workoutRange, exercise]);

  useEffect(() => {
    if (tab !== "nutrition") return;
    setLoading(true);
    setError("");
    client
      .get("/analytics/nutrition", { params: { range: nutritionRange } })
      .then((res) => setNutritionData(res.data.data))
      .catch((err) => setError(err.response?.data?.message || "Failed to load nutrition analytics"))
      .finally(() => setLoading(false));
  }, [tab, nutritionRange]);

  const emptyWorkouts = workoutData && workoutData.workoutsPerWeek.length === 0;
  const emptyNutrition = nutritionData && nutritionData.dailyCalories.every((d) => d.calories === 0);

  return (
    <>
      <h1 className="page-title">Analytics 📊</h1>

      <div className="tab-row">
        <button type="button" className={`btn btn-small ${tab === "workouts" ? "" : "btn-outline"}`} onClick={() => setTab("workouts")}>Workouts</button>
        <button type="button" className={`btn btn-small ${tab === "nutrition" ? "" : "btn-outline"}`} onClick={() => setTab("nutrition")}>Nutrition</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {loading && <p className="muted">Loading...</p>}

      {tab === "workouts" && !loading && workoutData && (
        <>
          <div className="filter-row card">
            <div>
              <label>Range (days)</label>
              <select value={workoutRange} onChange={(e) => setWorkoutRange(e.target.value)}>
                <option value="30">30</option>
                <option value="90">90</option>
                <option value="365">365</option>
              </select>
            </div>
            <div>
              <label>Exercise (weight history)</label>
              <select value={exercise} onChange={(e) => setExercise(e.target.value)}>
                {exercises.length === 0 && <option value="">No exercises yet</option>}
                {exercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
              </select>
            </div>
          </div>

          {emptyWorkouts ? (
            <p className="card muted center-text">No workout data in this range. Log workouts to see charts.</p>
          ) : (
            <>
              <div className="grid-2">
                <div className="card">
                  <h2>Workouts per week</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={workoutData.workoutsPerWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="card">
                  <h2>Minutes per week</h2>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={workoutData.minutesPerWeek}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="minutes" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <h2>By category</h2>
                  {workoutData.workoutsByCategory.length === 0 ? (
                    <p className="muted">No categories</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={workoutData.workoutsByCategory} dataKey="count" nameKey="category" outerRadius={80} label>
                          {workoutData.workoutsByCategory.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="card">
                  <h2>Max weight — {exercise || "pick exercise"}</h2>
                  {workoutData.exerciseHistory.length === 0 ? (
                    <p className="muted">No weight data for this exercise.</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={workoutData.exerciseHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="maxWeightKg" stroke="#10b981" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {tab === "nutrition" && !loading && nutritionData && (
        <>
          <div className="card form-grid">
            <div>
              <label>Range (days)</label>
              <select value={nutritionRange} onChange={(e) => setNutritionRange(e.target.value)}>
                <option value="7">7</option>
                <option value="30">30</option>
                <option value="90">90</option>
              </select>
            </div>
            <div className="muted full">
              Avg daily calories: <b>{nutritionData.avgDailyCalories}</b> •
              Avg protein/carbs/fat (per meal): {nutritionData.avgProteinG}g / {nutritionData.avgCarbsG}g / {nutritionData.avgFatG}g
            </div>
          </div>

          {emptyNutrition ? (
            <p className="card muted center-text">No meals in this range. Log nutrition to see charts.</p>
          ) : (
            <div className="grid-2">
              <div className="card">
                <h2>Daily calories</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={nutritionData.dailyCalories}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="calories" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <h2>Macro split (by calories)</h2>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={nutritionData.macroSplit} dataKey="percent" nameKey="name" outerRadius={90} label>
                      {nutritionData.macroSplit.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
