
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FitnessIllustration from "../components/FitnessIllustration";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ login: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.login, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-10 text-center text-white md:w-1/2 md:px-12">
        <FitnessIllustration />
        <h2 className="mt-6 text-3xl font-bold">Track your fitness</h2>
        <p className="mt-3 max-w-sm text-base text-blue-100">
          Workout diet and progress — all in one place
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 md:w-1/2 md:px-12">
        <form
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10"
          onSubmit={handleSubmit}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome Back 👋
          </h1>
          <p className="mt-2 mb-8 text-sm text-gray-500">
            Log in to your account
          </p>

          {error && <div className="alert mb-4">{error}</div>}

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Name or email
          </label>
          <input
            type="text"
            name="login"
            placeholder="your_name or you@example.com"
            value={form.login}
            onChange={handleChange}
            required
            className="mb-5 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <label className="mb-2 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="••••••"
            value={form.password}
            onChange={handleChange}
            required
            className="mb-6 w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Login"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
            >
              Sign up.
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
