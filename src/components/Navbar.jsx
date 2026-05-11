import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import useStore from "../store/useStore";
import { BarChart, Home, BookOpen, LogOut, Menu, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout } = useStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;
  const activeClass = "text-purple-600 dark:text-purple-400 font-medium";
  const inactiveClass =
    "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400";

  const navLinks =
    user.role === "child"
      ? [
          { to: "/", icon: <Home className="w-5 h-5" />, label: "Home" },
          { to: "/dashboard", icon: null, label: "My Requests" },
          { to: "/tutorial", icon: <BookOpen className="w-5 h-5" />, label: "Tutorial" },
        ]
      : [
          { to: "/", icon: <Home className="w-5 h-5" />, label: "Request" },
          { to: "/dashboard", icon: null, label: "Dashboard" },
          {
            to: "/analytics",
            icon: <BarChart className="w-5 h-5" />,
            label: "Analytics",
          },
          { to: "/tutorial", icon: <BookOpen className="w-5 h-5" />, label: "Tutorial" },
        ];

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md px-4 sm:px-6 py-4 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
        >
          🫙 JamJar
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-2 transition-colors ${isActive(to) ? activeClass : inactiveClass}`}
            >
              {icon} {label}
            </Link>
          ))}
          <ThemeToggle />
          <button
            onClick={logout}
            className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user.profile === "yoto"
              ? "📻"
              : user.profile === "ipod"
                ? "🎧"
                : "👨‍👩‍👧‍👦"}{" "}
            {user.display_name || user.username}
          </span>
        </div>

        {/* Mobile: theme toggle + avatar emoji + hamburger */}
        <div className="flex sm:hidden items-center gap-3">
          <ThemeToggle />
          <span className="text-base">
            {user.profile === "yoto"
              ? "📻"
              : user.profile === "ipod"
                ? "🎧"
                : "👨‍👩‍👧‍👦"}
          </span>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="text-gray-700 dark:text-gray-300 p-1"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-1">
          {navLinks.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive(to)
                  ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-medium"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              {icon} {label}
            </Link>
          ))}
          <div className="flex items-center justify-between px-3 py-3 border-t border-gray-100 dark:border-gray-700 mt-1">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.display_name || user.username}
            </span>
            <button
              onClick={() => {
                setMenuOpen(false);
                logout();
              }}
              className="text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors flex items-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
