import { useEffect, useState } from "react";
import client from "../api/client";

const FAQ = [
  { q: "How do I log a workout?", a: "Go to Workouts, fill the form and click Add workout." },
  { q: "How do I track calories?", a: "Open Nutrition, pick a day, and add meals with food items." },
  { q: "Can I export my data?", a: "Yes — use Reports, pick a date range, and download CSV or PDF." },
  { q: "How do reminders work?", a: "Set them under Notifications → Reminders. Keep this tab open for in-app alerts." },
];

export default function Support() {
  const [open, setOpen] = useState(0);
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState({ subject: "", category: "question", message: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    client.get("/support").then((res) => setTickets(res.data.data)).catch(() => {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await client.post("/support", form);
      setForm({ subject: "", category: "question", message: "" });
      setMessage("Message sent. We will review it soon.");
      const res = await client.get("/support");
      setTickets(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not send message");
    }
  };

  return (
    <>
      <h1 className="page-title">Support 💬</h1>

      <div className="card">
        <h2>FAQ</h2>
        {FAQ.map((item, i) => (
          <div key={item.q} className="faq-item">
            <button type="button" className="faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
              {item.q}
            </button>
            {open === i && <p className="faq-a muted">{item.a}</p>}
          </div>
        ))}
      </div>

      <form className="card form-grid" onSubmit={submit} style={{ marginTop: "1rem" }}>
        <h2 className="full">Contact us</h2>
        {message && <div className="alert success full">{message}</div>}
        {error && <div className="alert full">{error}</div>}
        <div><label>Subject</label><input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required /></div>
        <div>
          <label>Category</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="bug">Bug</option>
            <option value="question">Question</option>
            <option value="feedback">Feedback</option>
          </select>
        </div>
        <div className="full"><label>Message</label><textarea rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required minLength={10} /></div>
        <div className="full"><button type="submit" className="btn">Send message</button></div>
      </form>

      <div className="card" style={{ marginTop: "1rem" }}>
        <h2>My messages</h2>
        {tickets.length === 0 && <p className="muted">No messages yet.</p>}
        {tickets.map((t) => (
          <div className="row" key={t._id}>
            <div>
              <b>{t.subject}</b>
              <p className="muted">{t.category} • {t.status} • {new Date(t.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
