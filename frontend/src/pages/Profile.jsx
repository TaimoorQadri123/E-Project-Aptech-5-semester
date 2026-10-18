import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import client from "../api/client";
import { useAuth } from "../context/AuthContext";
import { cmToFeetInches, feetInchesToCm, displayWeight, toStorageWeight, weightLabel } from "../utils/units";
import { avatarUrl } from "../utils/avatarUrl";

const GOALS = [
  { value: "lose_weight", label: "Lose weight" },
  { value: "gain_muscle", label: "Gain muscle" },
  { value: "stay_fit", label: "Stay fit" },
  { value: "improve_endurance", label: "Improve endurance" },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();
  const units = user?.preferences?.units || "metric";
  const [form, setForm] = useState({
    email: "",
    age: "",
    gender: "male",
    heightCm: "",
    heightFt: "",
    heightIn: "",
    goal: "stay_fit",
    targetWeightKg: "",
    targetWeightDisplay: "",
  });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");
  const [picMessage, setPicMessage] = useState("");
  const [picError, setPicError] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [privacyError, setPrivacyError] = useState("");

  useEffect(() => {
    if (user) {
      const { ft, inches } = cmToFeetInches(user.heightCm || 0);
      setForm({
        email: user.email || "",
        age: user.age ?? "",
        gender: user.gender || "male",
        heightCm: user.heightCm ?? "",
        heightFt: ft,
        heightIn: inches,
        goal: user.goal || "stay_fit",
        targetWeightKg: user.targetWeightKg ?? "",
        targetWeightDisplay: displayWeight(user.targetWeightKg, units),
      });
    }
  }, [user, units]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      let heightCm = Number(form.heightCm);
      if (units === "imperial") {
        heightCm = feetInchesToCm(form.heightFt, form.heightIn);
      }

      const targetWeightKg =
        form.targetWeightDisplay === "" || form.targetWeightDisplay == null
          ? null
          : toStorageWeight(form.targetWeightDisplay, units);

      const res = await client.put("/users/me", {
        age: Number(form.age),
        gender: form.gender,
        heightCm,
        goal: form.goal,
        targetWeightKg,
      });
      setUser(res.data.data);
      setMessage("Profile saved successfully ✅");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile");
    }
  };

  const handlePictureChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPicMessage("");
    setPicError("");
    try {
      const data = new FormData();
      data.append("profilePicture", file);
      const res = await client.put("/users/me/picture", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data.data);
      setPicMessage("Profile picture updated ✅");
    } catch (err) {
      setPicError(err.response?.data?.message || "Could not update picture");
    }
  };

  const downloadMyData = async () => {
    setPrivacyError("");
    try {
      const res = await client.get("/users/me/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-fittrack-data.json";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setPrivacyError(err.response?.data?.message || "Export failed");
    }
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (!window.confirm("This permanently deletes your account and all data. Continue?")) return;
    setPrivacyError("");
    try {
      await client.delete("/users/me", { data: { password: deletePassword } });
      await logout();
      navigate("/login");
    } catch (err) {
      setPrivacyError(err.response?.data?.message || "Could not delete account");
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwMessage("");
    setPwError("");
    try {
      const res = await client.put("/users/me/password", passwordForm);
      setPwMessage(res.data.message);
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      setPwError(err.response?.data?.message || "Could not change password");
    }
  };

  return (
    <>
      <h1 className="page-title">My Profile 👤</h1>

      <form className="card form-grid" onSubmit={handleSubmit}>
        <div className="full profile-top">
          {avatarUrl(user?.profilePicture) ? (
            <img src={avatarUrl(user.profilePicture)} alt="" className="avatar-img" />
          ) : (
            <span className="avatar-lg">{user?.username ? user.username[0].toUpperCase() : "?"}</span>
          )}
          <div>
            <h2>{user?.username}</h2>
            <p className="muted">{form.email}</p>
            <label className="mt-2 inline-block text-sm text-blue-600 cursor-pointer">
              Change photo
              <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" className="hidden" onChange={handlePictureChange} />
            </label>
            {picMessage && <p className="text-sm text-green-600">{picMessage}</p>}
            {picError && <p className="text-sm text-red-600">{picError}</p>}
          </div>
        </div>

        {message && <div className="alert success full">{message}</div>}
        {error && <div className="alert full">{error}</div>}

        <div><label>Name</label><input value={user?.username || ""} disabled readOnly title="Your name cannot be changed after signup" /></div>
        <div><label>Email</label><input name="email" value={form.email} disabled readOnly /></div>
        <div><label>Age</label><input type="number" name="age" value={form.age} onChange={handleChange} required /></div>
        <div>
          <label>Gender</label>
          <select name="gender" value={form.gender} onChange={handleChange}>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>

        {units === "metric" ? (
          <div><label>Height (cm)</label><input type="number" name="heightCm" value={form.heightCm} onChange={handleChange} required /></div>
        ) : (
          <>
            <div><label>Height (ft)</label><input type="number" name="heightFt" value={form.heightFt} onChange={handleChange} required /></div>
            <div><label>Height (in)</label><input type="number" name="heightIn" value={form.heightIn} onChange={handleChange} required /></div>
          </>
        )}

        <div>
          <label>Goal</label>
          <select name="goal" value={form.goal} onChange={handleChange}>
            {GOALS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Target weight ({weightLabel(units)})</label>
          <input
            type="number"
            step="0.1"
            name="targetWeightDisplay"
            value={form.targetWeightDisplay}
            onChange={handleChange}
            placeholder="Optional"
          />
        </div>

        <div className="full"><button type="submit" className="btn">Save Profile</button></div>
      </form>

      <form className="card form-grid" onSubmit={handlePasswordSubmit} style={{ marginTop: "1.5rem" }}>
        <h2 className="full">Change password</h2>
        {pwMessage && <div className="alert success full">{pwMessage}</div>}
        {pwError && <div className="alert full">{pwError}</div>}
        <div><label>Current password</label><input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required /></div>
        <div><label>New password</label><input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required minLength={8} /></div>
        <div className="full"><button type="submit" className="btn btn-outline">Update password</button></div>
      </form>

      <div className="card form-grid" style={{ marginTop: "1.5rem" }}>
        <h2 className="full">Privacy & data</h2>
        {privacyError && <div className="alert full">{privacyError}</div>}
        <div className="full flex flex-wrap gap-2">
          <button type="button" className="btn btn-outline" onClick={downloadMyData}>Download my data</button>
        </div>
        <form className="full form-grid" onSubmit={deleteAccount}>
          <p className="full muted text-sm">Delete account removes all workouts, meals, progress, notifications, reminders, support messages, and your profile picture.</p>
          <div><label>Password to confirm delete</label><input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required /></div>
          <div className="full"><button type="submit" className="btn btn-danger">Delete my account</button></div>
        </form>
      </div>
    </>
  );
}
