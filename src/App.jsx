import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import useStore from "./store/useStore";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Tutorial from "./pages/Tutorial";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";

function App() {
  const { isAuthenticated, user, toast, hideToast, restoreSession } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 transition-colors">
        <Navbar />
        <main className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route
              path="/analytics"
              element={
                user.role === "parent" ? <Analytics /> : <Navigate to="/" />
              }
            />
            <Route path="/tutorial" element={<Tutorial />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <AnimatePresence>
          {toast && (
            <Toast
              key="toast"
              message={toast.message}
              type={toast.type}
              onClose={hideToast}
            />
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;
