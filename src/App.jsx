import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, lazy, Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import useStore from "./store/useStore";
import Login from "./pages/Login";
import Home from "./pages/Home";
import Navbar from "./components/Navbar";
import Toast from "./components/Toast";

// Secondary routes load on demand — Analytics pulls in recharts, which is a
// big share of the bundle and pointless on the kids' request screen.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Tutorial = lazy(() => import("./pages/Tutorial"));
const Settings = lazy(() => import("./pages/Settings"));

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--canvas)]">
      <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RouteFallback() {
  return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, user, toast, hideToast, restoreSession } = useStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    restoreSession().finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated || !user) return <Login />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--canvas)] text-[var(--text-primary)]">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route
                path="/analytics"
                element={user.role === "parent" ? <Analytics /> : <Navigate to="/" />}
              />
              <Route
                path="/settings"
                element={user.role === "parent" ? <Settings /> : <Navigate to="/" />}
              />
              <Route path="/tutorial" element={<Tutorial />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Suspense>
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
