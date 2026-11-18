
import { NavLink } from "react-router-dom";
import {
  House,
  Users,
  Settings,
  ChevronLeft
} from "lucide-react";

const menuItems = [
  { name: "Home", path: "/", icon: House },
  { name: "Students", path: "/students", icon: Users },
  { name: "Settings", path: "/settings", icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-heading">
        <span>MENU</span>
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>LEETCODE TRACKER</span>
        <ChevronLeft size={16} />
      </div>
    </aside>
  );
}