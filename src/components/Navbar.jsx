import { Link, useLocation } from 'react-router-dom';
import useStore from '../store/useStore';
import { BarChart, Home, BookOpen, LogOut } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useStore();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🎵 Music Request
        </Link>
        <div className="flex items-center gap-6">
          {user.role === 'child' && (
            <>
              <Link to="/" className={`flex items-center gap-2 transition-colors ${isActive('/') ? 'text-purple-600 font-medium' : 'text-gray-700 hover:text-purple-600'}`}>
                <Home className="w-5 h-5" /> Home
              </Link>
              <Link to="/dashboard" className={`flex items-center gap-2 transition-colors ${isActive('/dashboard') ? 'text-purple-600 font-medium' : 'text-gray-700 hover:text-purple-600'}`}>
                My Requests
              </Link>
            </>
          )}
          {user.role === 'parent' && (
            <>
              <Link to="/dashboard" className={`flex items-center gap-2 transition-colors ${isActive('/dashboard') ? 'text-purple-600 font-medium' : 'text-gray-700 hover:text-purple-600'}`}>
                Dashboard
              </Link>
              <Link to="/analytics" className={`flex items-center gap-2 transition-colors ${isActive('/analytics') ? 'text-purple-600 font-medium' : 'text-gray-700 hover:text-purple-600'}`}>
                <BarChart className="w-5 h-5" /> Analytics
              </Link>
            </>
          )}
          <Link to="/tutorial" className={`flex items-center gap-2 transition-colors ${isActive('/tutorial') ? 'text-purple-600 font-medium' : 'text-gray-700 hover:text-purple-600'}`}>
            <BookOpen className="w-5 h-5" /> Tutorial
          </Link>
          <button onClick={logout} className="text-gray-700 hover:text-red-600 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-600">
            {user.profile === 'yoto' ? '📻' : user.profile === 'ipod' ? '🎧' : '👨‍👩‍👧‍👦'} {user.display_name || user.username}
          </span>
        </div>
      </div>
    </nav>
  );
}
