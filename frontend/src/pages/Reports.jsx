import { useState } from "react";
import client from "../api/client";

export default function Reports() {
  const [type, setType] = useState("workouts");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function download(format) {
    setError("");
    if (!from || !to) {
      setError("Please choose from and to dates");
      return;
    }
    setLoading(true);
    try {
      const res = await client.get(`/reports/${type}`, {
        params: { from, to, format },
        responseType: "blob",
      });
      const blob = new Blob([res.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${from}-to-${to}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.message || "Download failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h1 className="page-title">Reports 📄</h1>

      <div className="card form-grid">
        <div>
          <label>Report type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="workouts">Workouts</option>
            <option value="nutrition">Nutrition</option>
            <option value="progress">Progress</option>
          </select>
        </div>
        <div><label>From</label><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
        <div><label>To</label><input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
        <div className="full flex flex-wrap gap-2">
          <button type="button" className="btn" disabled={loading} onClick={() => download("csv")}>Download CSV</button>
          <button type="button" className="btn btn-outline" disabled={loading} onClick={() => download("pdf")}>Download PDF</button>
        </div>
        {error && <div className="alert full">{error}</div>}
      </div>
    </>
  );
}
