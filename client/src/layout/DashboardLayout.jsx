
import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

import Home from "../pages/Home";
import Students from "../pages/Students";
import Settings from "../pages/Settings";

function Dashboard({ user, onLogout }) {
  return (
    <div className="app-layout">

      <Navbar
        user={user}
        onLogout={onLogout}
      />

      <div className="dashboard-body">

        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/students" element={<Students />} />
            <Route path="/settings" element={<Settings />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

      </div>
    </div>
  );
}

export default function DashboardLayout({ user, onLogout }) {
  return (
    <BrowserRouter>
      <Dashboard
        user={user}
        onLogout={onLogout}
      />
    </BrowserRouter>
  );
}