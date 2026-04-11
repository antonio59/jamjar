import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useStore from "../store/useStore";
import { User, Lock, ArrowLeft } from "lucide-react";

const PROFILES = [
  {
    id: "cristina",
    username: "cristina",
    name: "Cristina",
    emoji: "👧",
    color: "from-yellow-400 to-orange-500",
    pinLength: 6,
  },
  {
    id: "isabella",
    username: "isabella",
    name: "Isabella",
    emoji: "👩",
    color: "from-blue-400 to-purple-500",
    pinLength: 6,
  },
  {
    id: "parent",
    username: "parent",
    name: "Parent",
    emoji: "👨‍👩‍👧‍👦",
    color: "from-gray-700 to-gray-900",
    pinLength: 6,
  },
];

export default function Login() {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const { login, showToast } = useStore();

  const handlePinPress = async (num) => {
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 6 && selectedProfile) {
        const result = await login(selectedProfile.username, newPin);
        if (!result.success) {
          setError("Incorrect PIN. Try again!");
          showToast("Login failed", "error");
          setPin("");
          setTimeout(() => setError(""), 2000);
        } else {
          showToast(`Welcome back, ${selectedProfile.name}! 🎵`, "success");
        }
      }
    }
  };

  const handleBackspace = () => setPin(pin.slice(0, -1));

  const handleBack = () => {
    setSelectedProfile(null);
    setPin("");
    setError("");
  };

  if (!selectedProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 transition-colors">
        <div className="text-center w-full max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-12 text-gray-800 dark:text-gray-200"
          >
            Who is listening? 🎧
          </motion.h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PROFILES.map((profile, i) => (
              <motion.button
                key={profile.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedProfile(profile)}
                className={`bg-gradient-to-br ${profile.color} p-8 rounded-3xl shadow-xl text-white flex flex-col items-center gap-4`}
              >
                <span className="text-7xl">{profile.emoji}</span>
                <span className="text-2xl font-bold">{profile.name}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 transition-colors">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 w-full max-w-sm transition-colors"
      >
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{selectedProfile.emoji}</span>
            <span className="font-bold text-gray-700 dark:text-gray-300">
              {selectedProfile.name}
            </span>
          </div>
          <div className="w-6"></div>
        </div>

        <div className="text-center mb-8">
          <Lock className="w-8 h-8 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Enter your PIN
          </h2>

          <div className="flex justify-center gap-3 mt-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  i < pin.length
                    ? "bg-purple-600 scale-110"
                    : "bg-gray-200 dark:bg-gray-600"
                }`}
              />
            ))}
          </div>
          {error && (
            <p className="text-red-500 text-sm mt-4 font-medium">{error}</p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <motion.button
              key={num}
              whileTap={{ scale: 0.9 }}
              onClick={() => handlePinPress(num.toString())}
              className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-2xl font-bold py-4 rounded-2xl transition-colors"
            >
              {num}
            </motion.button>
          ))}
          <div className="flex items-center justify-center"></div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handlePinPress("0")}
            className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-2xl font-bold py-4 rounded-2xl transition-colors"
          >
            0
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleBackspace}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 flex items-center justify-center"
          >
            <ArrowLeft className="w-6 h-6" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
