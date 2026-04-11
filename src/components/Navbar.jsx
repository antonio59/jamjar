import { Link, useLocation } from "react-router-dom";
import useStore from "../store/useStore";
import { BarChart, Home, BookOpen, LogOut } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { user, logout } = useStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const activeClass = "text-purple-600 dark:text-purple-400 font-medium";
  const inactiveClass =
    "text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400";

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-md px-6 py-4 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent"
        >
          🎵 Music Request
        </Link>
        <div className="flex items-center gap-6">
          {user.role === "child" && (
            <>
              <Link
                to="/"
                className={`flex items-center gap-2 transition-colors ${isActive("/") ? activeClass : inactiveClass}`}
              >
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 transition-colors ${isActive("/dashboard") ? activeClass : inactiveClass}`}
              >
                My Requests
              </Link>
            </>
          )}
          {user.role === "parent" && (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 transition-colors ${isActive("/dashboard") ? activeClass : inactiveClass}`}
              >
                Dashboard
              </Link>
              <Link
                to="/analytics"
                className={`flex items-center gap-2 transition-colors ${isActive("/analytics") ? activeClass : inactiveClass}`}
              >
                <BarChart className="w-5 h-5" /> Analytics
              </Link>
            </>
          )}
          <Link
            to="/tutorial"
            className={`flex items-center gap-2 transition-colors ${isActive("/tutorial") ? activeClass : inactiveClass}`}
          >
            <BookOpen className="w-5 h-5" /> Tutorial
          </Link>
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
      </div>
    </nav>
  );
}
