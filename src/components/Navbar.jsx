import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import useStore from "../store/useStore";
import {
  BarChart3,
  LayoutDashboard,
  PlusCircle,
  BookOpen,
  LogOut,
  Settings,
  Menu,
  X,
} from "lucide-react";
import ThemeToggle from "./ThemeToggle";
import { IconButton } from "./ui/Button";
import { cx } from "./ui/cx";

const PARENT_NAV = [
  { to: "/", icon: PlusCircle, label: "Request", purpose: "Add new" },
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", purpose: "Review queue" },
  { to: "/analytics", icon: BarChart3, label: "Analytics", purpose: "Trends" },
  { to: "/tutorial", icon: BookOpen, label: "Tutorial", purpose: "How it works" },
  { to: "/settings", icon: Settings, label: "Settings", purpose: "Kids & PINs" },
];

const CHILD_NAV = [
  { to: "/", icon: PlusCircle, label: "Request", purpose: "Add a song" },
  { to: "/dashboard", icon: LayoutDashboard, label: "My requests", purpose: "See status" },
  { to: "/tutorial", icon: BookOpen, label: "How it works", purpose: "Guide" },
];

function profileBadge(profile) {
  if (profile === "yoto") return { emoji: "📻", label: "Yoto", tone: "yoto" };
  if (profile === "ipod") return { emoji: "🎧", label: "iPod", tone: "ipod" };
  return { emoji: "👨‍👩‍👧‍👦", label: "Parent", tone: "brand" };
}

export default function Navbar() {
  const { user, logout } = useStore();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = user.role === "child" ? CHILD_NAV : PARENT_NAV;
  const isActive = (path) => location.pathname === path;
  const badge = profileBadge(user.profile);

  return (
    <nav className="sticky top-0 z-30 bg-[var(--surface)]/95 backdrop-blur border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Brand */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold text-base text-[var(--text-primary)]"
          >
            <span
              aria-hidden
              className="w-7 h-7 rounded-[var(--r-md)] bg-[var(--brand)] text-[var(--brand-on)] flex items-center justify-center text-sm"
            >
              J
            </span>
            <span>JamJar</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {links.map((l) => {
              const Icon = l.icon;
              const active = isActive(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "inline-flex items-center gap-2 h-9 px-3 rounded-[var(--r-md)] text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {l.label}
                </Link>
              );
            })}
          </div>

          {/* Right side: profile + theme + logout */}
          <div className="hidden lg:flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[var(--r-pill)] text-xs font-medium bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-subtle)]"
              title={`${user.role === "parent" ? "Parent" : "Child"} · ${badge.label}`}
            >
              <span aria-hidden>{badge.emoji}</span>
              <span className="truncate max-w-[8rem]">
                {user.display_name || user.username}
              </span>
            </span>
            <ThemeToggle />
            <IconButton size="sm" label="Log out" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </IconButton>
          </div>

          {/* Mobile right cluster */}
          <div className="flex lg:hidden items-center gap-1">
            <ThemeToggle />
            <IconButton
              size="sm"
              label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </IconButton>
          </div>
        </div>

        {/* Mobile expanded menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-[var(--border-subtle)] py-2">
            <div className="flex items-center gap-2 px-2 py-2 border-b border-[var(--border-subtle)] mb-2">
              <span aria-hidden className="text-lg">
                {badge.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                  {user.display_name || user.username}
                </p>
                <p className="text-xs text-[var(--text-muted)] capitalize">
                  {user.role} · {badge.label}
                </p>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--danger)] px-2 py-1"
              >
                <LogOut className="w-3.5 h-3.5" /> Log out
              </button>
            </div>
            {links.map((l) => {
              const Icon = l.icon;
              const active = isActive(l.to);
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setMenuOpen(false)}
                  className={cx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-[var(--r-md)] transition-colors",
                    active
                      ? "bg-[var(--brand-soft)] text-[var(--brand)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{l.label}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      {l.purpose}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
