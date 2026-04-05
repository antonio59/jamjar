import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useStore from './store/useStore';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Tutorial from './pages/Tutorial';
import Navbar from './components/Navbar';

function App() {
  const { isAuthenticated, user } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists on mount
    const token = localStorage.getItem('token');
    if (token) {
      // In production, verify token with backend
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={user?.role === 'child' ? <Home /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analytics" element={user?.role === 'parent' ? <Analytics /> : <Navigate to="/" />} />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
