
import { useEffect, useState } from "react";
import Login from "./pages/Login";
import DashboardLayout from "./layouts/DashboardLayout";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function checkAuthentication() {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include"
      });

      if (!response.ok) {
        setUser(null);
        return;
      }

      const data = await response.json();

      if (data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Authentication check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    checkAuthentication();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <p>Loading LeetCode Tracker...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={() => setUser(null)}
    />
  );
}