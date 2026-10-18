import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import FitnessIllustration from "../components/FitnessIllustration";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    privacyConsent: false,
  });
  const [picture, setPicture] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!picture) {
      setError("Profile picture is required (JPG, PNG or WEBP, max 2 MB)");
      return;
    }
    if (!form.privacyConsent) {
      setError("You must agree to the privacy policy");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Password and confirm password do not match");
      return;
    }
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("username", form.username.trim().toLowerCase());
      data.append("email", form.email);
      data.append("password", form.password);
      data.append("confirmPassword", form.confirmPassword);
      data.append("privacyConsent", "true");
      data.append("profilePicture", picture);
      await signup(data);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Please check your details.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 md:flex-row">
      <div className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 px-6 py-10 text-center text-white md:w-1/2 md:px-12">
        <FitnessIllustration />
        <h2 className="mt-6 text-3xl font-bold">Start Today! 🔥</h2>
        <p className="mt-3 max-w-sm text-base text-blue-100">
          Create a free account and start your fitness journey.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12 md:w-1/2 md:px-12">
        <form
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl sm:p-10"
          onSubmit={handleSubmit}
        >
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Create Account</h1>
          <p className="mt-2 mb-6 text-sm text-gray-500">Just a few details needed.</p>

          {error && <div className="alert mb-4">{error}</div>}

          <label className="mb-2 block text-sm font-medium text-gray-700">Name</label>
          <input
            name="username"
            placeholder="Choose a name, e.g. ali_khan"
            pattern="[a-zA-Z0-9_]{3,20}"
            value={form.username}
            onChange={handleChange}
            required
            className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
          />

          <label className="mb-2 block text-sm font-medium text-gray-700">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3" />

          <label className="mb-2 block text-sm font-medium text-gray-700">Password</label>
          <input type="password" name="password" minLength={8} value={form.password} onChange={handleChange} required className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3" />

          <label className="mb-2 block text-sm font-medium text-gray-700">Confirm password</label>
          <input type="password" name="confirmPassword" minLength={8} value={form.confirmPassword} onChange={handleChange} required className="mb-4 w-full rounded-lg border border-gray-300 px-4 py-3" />

          <label className="mb-2 block text-sm font-medium text-gray-700">Profile picture (required)</label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => setPicture(e.target.files?.[0] || null)}
            required
            className="mb-4 w-full text-sm"
          />

          <label className="mb-6 flex items-start gap-2 text-sm">
            <input type="checkbox" name="privacyConsent" checked={form.privacyConsent} onChange={handleChange} required />
            <span>
              I agree to the{" "}
              <Link to="/privacy" className="text-blue-600 underline" target="_blank">privacy policy</Link>
              {" "}and processing of my data.
            </span>
          </label>

          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
            {submitting ? "Creating..." : "Sign Up"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account? <Link to="/login" className="font-semibold text-blue-600 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
