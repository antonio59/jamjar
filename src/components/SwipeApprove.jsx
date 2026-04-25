import { useState, useEffect, useRef } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { CheckCircle, XCircle, ThumbsDown } from "lucide-react";

const REJECTION_REASONS = [
  { id: "age", label: "Not age-appropriate", emoji: "🔞" },
  { id: "duplicate", label: "Already have this", emoji: "🔄" },
  { id: "inappropriate", label: "Inappropriate content", emoji: "⚠️" },
  { id: "quality", label: "Poor audio quality", emoji: "🔇" },
  { id: "other", label: "Other reason", emoji: "💬" },
];

export default function SwipeApprove({ requests, onApprove, onReject }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const cardRef = useRef(null);

  const currentRequest = requests[currentIndex];

  useEffect(() => {
    if (!currentRequest) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleSwipe("right");
      if (e.key === "ArrowLeft") handleSwipe("left");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentRequest]);

  const handleSwipe = async (direction) => {
    if (!currentRequest) return;

    const offsetX = direction === "right" ? 300 : -300;

    await controls.start({
      x: offsetX,
      opacity: 0,
      transition: { duration: 0.3 },
    });

    if (direction === "right") {
      onApprove(currentRequest.id);
    } else {
      setShowRejectModal(true);
      return;
    }

    controls.set({ x: 0, opacity: 1 });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleRejectConfirm = () => {
    const reason =
      selectedReason === "other"
        ? customReason
        : REJECTION_REASONS.find((r) => r.id === selectedReason)?.label;
    onReject(currentRequest.id, reason);

    setShowRejectModal(false);
    setSelectedReason("");
    setCustomReason("");
    controls.set({ x: 0, opacity: 1 });
    setCurrentIndex((prev) => prev + 1);
  };

  const handleRejectCancel = async () => {
    setShowRejectModal(false);
    await controls.start({ x: 0, opacity: 1, transition: { duration: 0.3 } });
  };

  if (!currentRequest) {
    return (
      <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-colors">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          All Caught Up!
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          No pending requests to review.
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-96 max-w-md mx-auto">
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) handleSwipe("right");
          else if (info.offset.x < -100) handleSwipe("left");
        }}
        animate={controls}
        style={{ x, rotate, opacity }}
        className="absolute inset-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 cursor-grab active:cursor-grabbing border-2 border-gray-200 dark:border-gray-600 transition-colors"
      >
        <div className="absolute top-4 right-4 flex gap-2">
          <motion.div
            style={{ opacity: useTransform(x, [0, 150], [0, 1]) }}
            className="bg-green-700 text-white px-4 py-2 rounded-full font-bold text-sm"
          >
            APPROVE ✓
          </motion.div>
          <motion.div
            style={{ opacity: useTransform(x, [-150, 0], [1, 0]) }}
            className="bg-red-700 text-white px-4 py-2 rounded-full font-bold text-sm"
          >
            REJECT ✗
          </motion.div>
        </div>

        <div className="flex flex-col items-center text-center h-full justify-between">
          <div className="w-full">
            {currentRequest.thumbnail && (
              <img
                src={currentRequest.thumbnail}
                alt=""
                className="w-32 h-32 rounded-xl object-cover mx-auto mb-4 shadow-lg"
              />
            )}
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">
              {currentRequest.title}
            </h3>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span className="bg-purple-100 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                {currentRequest.profile === "yoto" ? "📻 Yoto" : "🎧 iPod"}
              </span>
              <span className="bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full capitalize">
                {currentRequest.type}
              </span>
            </div>
            {currentRequest.duration && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {currentRequest.duration}
              </p>
            )}
          </div>

          <div className="text-sm text-gray-500 dark:text-gray-400">
            ← Swipe left to reject · Swipe right to approve →
          </div>
        </div>
      </motion.div>

      <div className="absolute -bottom-20 left-0 right-0 flex justify-center gap-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe("left")}
          className="bg-red-700 hover:bg-red-800 text-white p-4 rounded-full shadow-lg"
        >
          <XCircle className="w-8 h-8" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe("right")}
          className="bg-green-700 hover:bg-green-800 text-white p-4 rounded-full shadow-lg"
        >
          <CheckCircle className="w-8 h-8" />
        </motion.button>
      </div>

      <div className="absolute -bottom-36 left-0 right-0 text-center text-sm text-gray-500 dark:text-gray-400">
        {currentIndex + 1} of {requests.length} requests
      </div>

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full transition-colors"
          >
            <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
              <ThumbsDown className="w-6 h-6" />
              <h3 className="text-xl font-bold dark:text-gray-200">
                Why are you rejecting?
              </h3>
            </div>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors flex items-center gap-3 ${
                    selectedReason === reason.id
                      ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500"
                      : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-2 border-transparent"
                  }`}
                >
                  <span className="text-2xl">{reason.emoji}</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {reason.label}
                  </span>
                </button>
              ))}
            </div>

            {selectedReason === "other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Type your reason..."
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg mb-4 focus:border-red-500 focus:outline-none text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
                rows={3}
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRejectCancel}
                className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={
                  !selectedReason ||
                  (selectedReason === "other" && !customReason)
                }
                className="flex-1 py-3 px-4 bg-red-700 hover:bg-red-800 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Reject
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
