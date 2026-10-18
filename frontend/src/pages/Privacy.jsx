import { Link } from "react-router-dom";

export default function Privacy() {
  return (
    <div className="container" style={{ maxWidth: "720px", paddingTop: "2rem", paddingBottom: "3rem" }}>
      <h1 className="page-title">Privacy Policy</h1>
      <div className="card" style={{ lineHeight: 1.7 }}>
        <p><strong>What we store</strong></p>
        <ul className="list-disc pl-6 text-sm muted">
          <li>Account info: username, name, email, password (hashed), profile picture, age, gender, height, goals</li>
          <li>Fitness data: workouts, meals, progress entries</li>
          <li>App data: notifications, reminders, support messages you send</li>
        </ul>
        <p className="mt-4"><strong>Why</strong></p>
        <p className="text-sm muted">To run your personal fitness tracker: show your dashboard, charts, reminders, and keep your history private to you.</p>
        <p className="mt-4"><strong>Your choices</strong></p>
        <p className="text-sm muted">
          You can <strong>download a copy</strong> of your data (JSON) or <strong>delete your account</strong> from Profile → Privacy & data.
          Deletion removes your data and profile picture from our servers.
        </p>
        <p className="mt-6">
          <Link to="/signup" className="text-blue-600 underline">Back to sign up</Link>
        </p>
      </div>
    </div>
  );
}
