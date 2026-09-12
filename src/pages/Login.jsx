import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import api from "../api/client";
import { ArrowLeft, Check, RotateCcw } from "lucide-react";

const MIN_PIN = 4;
const MAX_PIN = 8;

// Card gradient per device/role — matches each kid's player colour elsewhere
const CARD_COLORS = {
  parent: "from-violet-500 to-purple-700",
  yoto: "from-amber-400 to-orange-500",
  ipod: "from-sky-400 to-blue-600",
};

const PROFILE_TAGS = { yoto: "Yoto", ipod: "iPod", parent: "Grown-up" };

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Up late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

// Ambient floating notes — fixed layout so positions never reshuffle
const NOTES = [
  { e: "🎵", left: "6%",  size: 38, dur: 14, delay: 0 },
  { e: "🎶", left: "18%", size: 26, dur: 18, delay: 4 },
  { e: "🎧", left: "30%", size: 30, dur: 16, delay: 8 },
  { e: "🎵", left: "44%", size: 22, dur: 20, delay: 2 },
  { e: "🎶", left: "58%", size: 34, dur: 15, delay: 6 },
  { e: "🫙", left: "70%", size: 28, dur: 19, delay: 10 },
  { e: "🎵", left: "82%", size: 30, dur: 13, delay: 3 },
  { e: "🎶", left: "92%", size: 24, dur: 17, delay: 7 },
];

function FloatingNotes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {NOTES.map((n, i) => (
        <motion.span
          key={i}
          className="absolute top-0 select-none opacity-30 dark:opacity-20"
          style={{ left: n.left, fontSize: n.size }}
          initial={{ y: "105vh", rotate: -10 }}
          animate={{ y: "-15vh", rotate: 10 }}
          transition={{
            duration: n.dur,
            delay: n.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          {n.e}
        </motion.span>
      ))}
    </div>
  );
}

const backdrop =
  "min-h-screen relative flex items-center justify-center p-4 transition-colors " +
  "bg-gradient-to-br from-violet-100 via-rose-50 to-amber-100 " +
  "dark:from-gray-950 dark:via-[#171226] dark:to-gray-900";

export default function Login() {
  const [profiles, setProfiles] = useState(null);
  const [profilesError, setProfilesError] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const { login, showToast } = useStore();
  const handlersRef = useRef({});

  const loadProfiles = useCallback(async () => {
    setProfilesError(false);
    try {
      const res = await api.get("/auth/profiles");
      // Kids first, grown-ups last
      const sorted = [...res.data].sort((a, b) =>
        a.role === b.role ? 0 : a.role === "parent" ? 1 : -1,
      );
      setProfiles(sorted);
    } catch {
      setProfilesError(true);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const submitPin = useCallback(
    async (value) => {
      if (value.length < MIN_PIN || busy) return;
      setBusy(true);
      const result = await login(selectedProfile.username, value);
      setBusy(false);
      if (!result.success) {
        setError(result.error || "Incorrect PIN. Try again!");
        showToast("Login failed", "error");
        setPin("");
        setShakeKey((k) => k + 1);
        setTimeout(() => setError(""), 3000);
      } else {
        showToast(`Welcome back, ${selectedProfile.display_name}! 🎵`, "success");
      }
    },
    [busy, login, selectedProfile, showToast],
  );

  const handlePinPress = (num) => {
    if (busy) return;
    const next = pin.length >= MAX_PIN ? pin : pin + num;
    setPin(next);
    if (next.length === MAX_PIN) submitPin(next);
  };

  const handleBackspace = () => setPin((p) => p.slice(0, -1));

  const handleBack = () => {
    setSelectedProfile(null);
    setPin("");
    setError("");
  };

  // Keep latest handlers in a ref so keyboard listener doesn't re-bind every render
  handlersRef.current = { handlePinPress, handleBackspace, handleBack, submitPin, pin };

  useEffect(() => {
    if (!selectedProfile) return;

    const handleKeyDown = (e) => {
      const { handlePinPress, handleBackspace, handleBack, submitPin } =
        handlersRef.current;
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        handlePinPress(e.key);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleBack();
      } else if (e.key === "Enter") {
        e.preventDefault();
        submitPin(handlersRef.current.pin);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProfile]);

  // ── Profile picker ────────────────────────────────────────────────────────
  if (!selectedProfile) {
    return (
      <div className={backdrop}>
        <FloatingNotes />
        <div className="relative text-center w-full max-w-3xl">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 12 }}
            className="text-8xl mb-3 select-none"
          >
            🫙
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-extrabold tracking-tight text-[var(--text-primary)]"
          >
            JamJar
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-lg text-[var(--text-secondary)] mt-2 mb-10"
          >
            {greeting()}! Who's listening? 🎧
          </motion.p>

          {profilesError && (
            <div className="mx-auto max-w-sm rounded-[var(--r-lg)] bg-[var(--surface)] shadow-[var(--shadow-lg)] p-6">
              <p className="text-[var(--text-secondary)] mb-4">
                Can't reach the JamJar server right now.
              </p>
              <button
                onClick={loadProfiles}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--r-pill)] bg-[var(--brand)] text-[var(--brand-on)] font-semibold hover:bg-[var(--brand-hover)] transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Try again
              </button>
            </div>
          )}

          {!profiles && !profilesError && (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-4 border-[var(--brand)] border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {(profiles || []).map((profile, i) => {
              const key = profile.role === "parent" ? "parent" : profile.profile;
              return (
                <motion.button
                  key={profile.username}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.08, type: "spring", stiffness: 160 }}
                  whileHover={{ scale: 1.06, rotate: i % 2 ? 1.5 : -1.5 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedProfile(profile)}
                  className={`bg-gradient-to-br ${CARD_COLORS[key] || CARD_COLORS.parent} p-7 rounded-3xl shadow-[var(--shadow-xl)] text-white flex flex-col items-center gap-3 cursor-pointer`}
                >
                  <span className="text-7xl drop-shadow-lg select-none">
                    {profile.avatar_emoji || "🎵"}
                  </span>
                  <span className="text-2xl font-bold">
                    {profile.display_name || profile.username}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 rounded-full px-3 py-1">
                    {PROFILE_TAGS[key] || "Family"}
                  </span>
                </motion.button>
              );
            })}
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-sm text-[var(--text-muted)]"
          >
            Family music requests — kids ask, grown-ups approve 🎶
          </motion.p>
        </div>
      </div>
    );
  }

  // ── PIN pad ───────────────────────────────────────────────────────────────
  return (
    <div className={backdrop}>
      <FloatingNotes />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 18 }}
        className="relative bg-[var(--surface)] rounded-3xl shadow-[var(--shadow-xl)] p-8 w-full max-w-sm transition-colors"
      >
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            aria-label="Back to profiles"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none">
              {selectedProfile.avatar_emoji || "🎵"}
            </span>
            <span className="font-bold text-[var(--text-primary)]">
              {selectedProfile.display_name || selectedProfile.username}
            </span>
          </div>
          <div className="w-6" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            What's the magic PIN? ✨
          </h2>
          <motion.div
            key={shakeKey}
            animate={shakeKey ? { x: [0, -10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
            className="flex justify-center gap-3 mt-5"
          >
            {[...Array(MAX_PIN)].map((_, i) => (
              <motion.div
                key={i}
                animate={i === pin.length - 1 ? { scale: [1, 1.5, 1] } : {}}
                className={`w-3.5 h-3.5 rounded-full transition-colors duration-200 ${
                  i < pin.length
                    ? "bg-[var(--brand)]"
                    : i < MIN_PIN
                      ? "bg-[var(--border-strong)]"
                      : "bg-[var(--border-subtle)]"
                }`}
              />
            ))}
          </motion.div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[var(--danger)] text-sm mt-4 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.88 }}
              onClick={() => handlePinPress(num.toString())}
              aria-label={`PIN digit ${num}`}
              className="bg-[var(--surface-2)] hover:bg-[var(--brand-soft)] text-[var(--text-primary)] text-2xl font-bold py-4 rounded-2xl transition-colors"
            >
              {num}
            </motion.button>
          ))}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={handleBackspace}
            aria-label="Backspace"
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => handlePinPress("0")}
            aria-label="PIN digit 0"
            className="bg-[var(--surface-2)] hover:bg-[var(--brand-soft)] text-[var(--text-primary)] text-2xl font-bold py-4 rounded-2xl transition-colors"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: pin.length >= MIN_PIN ? 0.88 : 1 }}
            onClick={() => submitPin(pin)}
            disabled={pin.length < MIN_PIN || busy}
            aria-label="Submit PIN"
            className={`flex items-center justify-center rounded-2xl transition-colors ${
              pin.length >= MIN_PIN
                ? "bg-[var(--brand)] text-[var(--brand-on)] hover:bg-[var(--brand-hover)]"
                : "text-[var(--text-disabled)]"
            }`}
          >
            <Check className="w-7 h-7" />
          </motion.button>
        </div>

        <p className="text-center text-xs text-[var(--text-muted)] mt-5">
          {MIN_PIN}–{MAX_PIN} digits, then tap ✓
        </p>
      </motion.div>
    </div>
  );
}
