import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";
import { avatarUrl } from "../utils/avatarUrl";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const loadUnread = () => {
    client
      .get("/notifications")
      .then((res) => setUnread(res.data.data.unreadCount || 0))
      .catch(() => setUnread(0));
  };

  useEffect(() => {
    loadUnread();
    const id = setInterval(loadUnread, 60000);
    return () => clearInterval(id);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <Link to="/dashboard" className="logo">💪 FitTrack</Link>
      <button type="button" className="menu-btn" onClick={() => setOpen(!open)} aria-label="Menu">
        ☰
      </button>

      <div className={`nav-links ${open ? "show" : ""}`} onClick={() => setOpen(false)}>
        <NavLink to="/dashboard" end>Dashboard</NavLink>
        <NavLink to="/workouts">Workouts</NavLink>
        <NavLink to="/nutrition">Nutrition</NavLink>
        <NavLink to="/progress">Progress</NavLink>
        <NavLink to="/analytics">Analytics</NavLink>
        <NavLink to="/reports">Reports</NavLink>
        <NavLink to="/users">Find users</NavLink>
        <NavLink to="/notifications" className="bell-link">
          🔔 {unread > 0 && <span className="bell-badge">{unread}</span>}
        </NavLink>
        <NavLink to="/settings">Settings</NavLink>
        <NavLink to="/support">Support</NavLink>
        <NavLink to="/profile" className="profile-nav">
          {avatarUrl(user?.profilePicture) ? (
            <img src={avatarUrl(user.profilePicture)} alt="" className="avatar-nav" />
          ) : (
            <span>👤</span>
          )}
          {user?.username || user?.name}
        </NavLink>
        <button type="button" className="btn btn-outline btn-small" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
