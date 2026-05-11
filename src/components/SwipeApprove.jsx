import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useMotionValue, useTransform } from "framer-motion";
import { CheckCircle, XCircle, ThumbsDown, Music, BookOpen } from "lucide-react";

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
  const rotate = useTransform(x, [-250, 250], [-12, 12]);
  const cardOpacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);
  const approveOpacity = useTransform(x, [20, 120], [0, 1]);
  const rejectOpacity = useTransform(x, [-120, -20], [1, 0]);

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
    await controls.start({
      x: direction === "right" ? 450 : -450,
      opacity: 0,
      transition: { duration: 0.28, ease: "easeIn" },
    });
    if (direction === "right") {
      onApprove(currentRequest.id);
      controls.set({ x: 0, opacity: 1 });
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowRejectModal(true);
    }
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
    await controls.start({ x: 0, opacity: 1, transition: { duration: 0.25 } });
  };

  if (!currentRequest) {
    return (
      <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-colors">
        <div className="text-5xl mb-3">🎉</div>
        <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">All caught up!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Swipeable card — natural height, no overflow issues */}
      <motion.div
        ref={cardRef}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) handleSwipe("right");
          else if (info.offset.x < -100) handleSwipe("left");
          else controls.start({ x: 0, opacity: 1, transition: { duration: 0.2 } });
        }}
        animate={controls}
        style={{ x, rotate, opacity: cardOpacity }}
        className="relative bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-600 p-5 cursor-grab active:cursor-grabbing select-none shadow-md transition-colors"
      >
        {/* Directional stamp badges */}
        <motion.div
          style={{ opacity: approveOpacity }}
          className="absolute top-3 right-3 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none"
        >
          APPROVE ✓
        </motion.div>
        <motion.div
          style={{ opacity: rejectOpacity }}
          className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full pointer-events-none"
        >
          REJECT ✗
        </motion.div>

        <div className="flex flex-col items-center text-center gap-3 pt-3 pb-1">
          {currentRequest.thumbnail ? (
            <img
              src={currentRequest.thumbnail}
              alt=""
              className="w-24 h-24 rounded-xl object-cover shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {currentRequest.type === "audiobook"
                ? <BookOpen className="w-10 h-10 text-gray-400" />
                : <Music className="w-10 h-10 text-gray-400" />}
            </div>
          )}

          <h3 className="font-bold text-gray-800 dark:text-gray-200 text-base leading-snug line-clamp-2 px-6">
            {currentRequest.title}
          </h3>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full font-medium">
              {currentRequest.profile === "yoto" ? "📻 Yoto" : "🎧 iPod"}
            </span>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full font-medium capitalize">
              {currentRequest.type}
            </span>
          </div>

          {currentRequest.duration && currentRequest.duration !== "Unknown" && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{currentRequest.duration}</p>
          )}
        </div>
      </motion.div>

      {/* Counter + hint — in normal flow, no overflow */}
      <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2 select-none">
        {currentIndex + 1} of {requests.length} · ← reject &nbsp;|&nbsp; approve →
      </p>

      {/* Action buttons — in normal flow */}
      <div className="flex justify-center gap-10 mt-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe("left")}
          aria-label="Reject"
          className="bg-red-600 hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-colors"
        >
          <XCircle className="w-7 h-7" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSwipe("right")}
          aria-label="Approve"
          className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-colors"
        >
          <CheckCircle className="w-7 h-7" />
        </motion.button>
      </div>

      {/* Reject reason modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl transition-colors"
          >
            <div className="flex items-center gap-2 mb-4 text-red-600 dark:text-red-400">
              <ThumbsDown className="w-5 h-5" />
              <h3 className="text-lg font-bold dark:text-gray-200">Why are you rejecting?</h3>
            </div>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-colors flex items-center gap-3 border-2 ${
                    selectedReason === reason.id
                      ? "bg-red-50 dark:bg-red-900/30 border-red-500"
                      : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 border-transparent"
                  }`}
                >
                  <span className="text-xl">{reason.emoji}</span>
                  <span className="font-medium text-sm text-gray-800 dark:text-gray-200">
                    {reason.label}
                  </span>
                </button>
              ))}
            </div>

            {selectedReason === "other" && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Type your reason…"
                rows={2}
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl mb-4 focus:border-red-500 focus:outline-none text-sm text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400"
              />
            )}

            <div className="flex gap-3">
              <button
                onClick={handleRejectCancel}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors dark:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!selectedReason || (selectedReason === "other" && !customReason)}
                className="flex-1 py-2.5 rounded-xl font-medium text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-colors"
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
