
import {
  LogOut,
  UserRound
} from "lucide-react";

export default function Navbar({ user, onLogout }) {

  async function handleLogout() {
    try {
      localStorage.removeItem("admin_token");
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include"
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      onLogout();

    } catch (error) {
      console.error(error);
      localStorage.removeItem("admin_token");
      onLogout();
    }
  }

  return (
    <header className="navbar">

      <div className="brand">
        <img
          src="https://cdn.simpleicons.org/leetcode/FFA116"
          alt="LeetCode"
          className="brand-logo"
        />

        <span>LeetCode Tracker</span>
      </div>

      <div className="navbar-actions">

        <div className="admin-info">
          <div className="admin-avatar">
            <UserRound size={17} />
          </div>

          <span className="admin-username">
            {user?.username}
          </span>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={17} />
          <span>Logout</span>
        </button>

      </div>
    </header>
  );
}