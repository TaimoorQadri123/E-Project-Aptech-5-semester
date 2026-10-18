import { useState } from "react";
import client from "../api/client";

export default function FindUsers() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const search = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await client.get("/users/search", { params: { q } });
      setResults(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="page-title">Find users 🔎</h1>

      <form className="card toolbar" onSubmit={search}>
        <input
          placeholder="Name or email prefix (min 2 chars)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          minLength={2}
          required
        />
        <button type="submit" className="btn" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
      </form>

      {error && <div className="alert">{error}</div>}

      <div className="list">
        {results.length === 0 && !loading && q.length >= 2 && (
          <p className="card muted center-text">No users found.</p>
        )}
        {results.map((u) => (
          <div className="card item" key={u.id}>
            <div>
              <h3>{u.username || u.name}</h3>
              <p className="muted">Goal: {u.goal.replace(/_/g, " ")} • Age group: {u.ageGroup}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
