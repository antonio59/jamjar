import { useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  Check,
  X,
  Music,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { Drawer, Button, Badge, cx } from "../ui";
import { thumbUrl } from "../../api/client";

const REJECTION_REASONS = [
  { id: "age", label: "Not age-appropriate" },
  { id: "duplicate", label: "Already have this" },
  { id: "inappropriate", label: "Inappropriate content" },
  { id: "quality", label: "Poor audio quality" },
  { id: "other", label: "Other" },
];

export default function QuickApproveDrawer({
  open,
  onClose,
  requests,
  onApprove,
  onReject,
}) {
  const [processed, setProcessed] = useState(0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-8, 8]);
  const approveStampOpacity = useTransform(x, [20, 120], [0, 1]);
  const rejectStampOpacity = useTransform(x, [-120, -20], [1, 0]);

  const current = requests[0];

  useEffect(() => {
    if (!open) setProcessed(0);
  }, [open]);

  useEffect(() => {
    if (!open || !current) return;
    const onKey = (e) => {
      if (showRejectModal) return;
      if (e.key === "ArrowRight" || e.key === "a") handleApprove();
      if (e.key === "ArrowLeft" || e.key === "r") openRejectModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, current, showRejectModal]);

  const handleApprove = async () => {
    if (!current) return;
    await controls.start({
      x: 320,
      opacity: 0,
      transition: { duration: 0.22, ease: "easeIn" },
    });
    onApprove(current.id);
    setProcessed((n) => n + 1);
    controls.set({ x: 0, opacity: 1 });
  };

  const openRejectModal = () => {
    if (!current) return;
    setShowRejectModal(true);
  };

  const confirmReject = async () => {
    const reason =
      selectedReason === "other"
        ? customReason || "Other"
        : REJECTION_REASONS.find((r) => r.id === selectedReason)?.label;
    setShowRejectModal(false);
    setSelectedReason("");
    setCustomReason("");
    await controls.start({
      x: -320,
      opacity: 0,
      transition: { duration: 0.22, ease: "easeIn" },
    });
    onReject(current.id, reason);
    setProcessed((n) => n + 1);
    controls.set({ x: 0, opacity: 1 });
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Quick Approve"
      description={
        requests.length === 0
          ? "All caught up — nothing to review."
          : `${requests.length} waiting${processed > 0 ? ` · ${processed} reviewed this session` : ""}`
      }
      width="md"
      footer={
        requests.length > 0 && (
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border-default)] rounded text-[10px] font-mono">
                ←
              </kbd>
              reject
              <span className="text-[var(--border-default)]">·</span>
              <kbd className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border-default)] rounded text-[10px] font-mono">
                →
              </kbd>
              approve
            </span>
            <span>or drag the card</span>
          </div>
        )
      }
    >
      {!current ? (
        <div className="flex flex-col items-center justify-center text-center py-12">
          <div className="w-14 h-14 rounded-full bg-[var(--success-soft)] flex items-center justify-center text-[var(--success)] mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="font-semibold text-[var(--text-primary)] mb-1">
            All caught up!
          </h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            No pending requests. Come back when new requests roll in.
          </p>
          {processed > 0 && (
            <p className="text-xs text-[var(--success)] mt-3 font-medium">
              You reviewed {processed} request{processed === 1 ? "" : "s"} this session.
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          {/* Stack indicator */}
          <p className="text-xs text-[var(--text-muted)] mb-3">
            Request {processed + 1} of {processed + requests.length}
          </p>

          {/* Card */}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.5}
            onDragEnd={(_, info) => {
              if (info.offset.x > 120) handleApprove();
              else if (info.offset.x < -120) openRejectModal();
              else controls.start({ x: 0, transition: { duration: 0.2 } });
            }}
            animate={controls}
            style={{ x, rotate }}
            className="relative bg-[var(--surface)] border-2 border-[var(--border-default)] rounded-[var(--r-xl)] p-5 cursor-grab active:cursor-grabbing select-none w-full max-w-sm shadow-[var(--shadow-md)]"
          >
            {/* Decision stamps */}
            <motion.div
              style={{ opacity: approveStampOpacity }}
              className="absolute top-3 right-3 bg-[var(--success-solid)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full pointer-events-none"
            >
              Approve
            </motion.div>
            <motion.div
              style={{ opacity: rejectStampOpacity }}
              className="absolute top-3 left-3 bg-[var(--danger-solid)] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full pointer-events-none"
            >
              Reject
            </motion.div>

            <div className="flex flex-col items-center text-center gap-3 pt-3 pb-1">
              {current.thumbnail ? (
                <img
                  src={thumbUrl(current.thumbnail)}
                  alt=""
                  className="w-28 h-28 rounded-[var(--r-lg)] object-cover shadow-[var(--shadow-sm)]"
                />
              ) : (
                <div className="w-28 h-28 rounded-[var(--r-lg)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)]">
                  {current.type === "audiobook" ? (
                    <BookOpen className="w-10 h-10" />
                  ) : (
                    <Music className="w-10 h-10" />
                  )}
                </div>
              )}

              <h3 className="font-bold text-[var(--text-primary)] text-base leading-snug line-clamp-3 px-2">
                {current.title}
              </h3>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <Badge tone={current.profile === "yoto" ? "yoto" : "ipod"} size="xs">
                  {current.profile === "yoto" ? "📻 Yoto" : "🎧 iPod"}
                </Badge>
                <Badge
                  tone={current.type === "audiobook" ? "info" : "neutral"}
                  size="xs"
                >
                  {current.type === "audiobook" ? "Audiobook" : "Music"}
                </Badge>
              </div>

              {current.duration && current.duration !== "Unknown" && (
                <p className="text-xs text-[var(--text-muted)]">{current.duration}</p>
              )}
            </div>
          </motion.div>

          {/* Buttons */}
          <div className="flex items-center justify-center gap-8 mt-6">
            <button
              onClick={openRejectModal}
              aria-label="Reject"
              className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--surface)] border-2 border-[var(--danger-border)] text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <button
              onClick={handleApprove}
              aria-label="Approve"
              className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--success-solid)] text-white hover:bg-[var(--success-solid-hover)] shadow-[var(--shadow-md)] transition-colors"
            >
              <Check className="w-7 h-7" />
            </button>
          </div>
        </div>
      )}

      {/* Reject reason modal — inline so drawer stays on top */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-[var(--overlay)] p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[var(--surface)] rounded-[var(--r-xl)] p-5 max-w-sm w-full shadow-[var(--shadow-xl)] border border-[var(--border-default)]"
            >
              <h3 className="font-semibold text-[var(--text-primary)] mb-3">
                Why are you rejecting?
              </h3>
              <div className="space-y-1.5 mb-3">
                {REJECTION_REASONS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedReason(r.id)}
                    className={cx(
                      "w-full text-left px-3 py-2 rounded-[var(--r-md)] border transition-colors text-sm",
                      selectedReason === r.id
                        ? "border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand)]"
                        : "border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-2)]",
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {selectedReason === "other" && (
                <input
                  autoFocus
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="Type a reason…"
                  className="w-full mb-3 px-3 h-10 border border-[var(--border-default)] rounded-[var(--r-md)] text-sm bg-[var(--surface)] text-[var(--text-primary)] focus:border-[var(--border-focus)] focus:outline-none"
                />
              )}
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  fullWidth
                  onClick={() => setShowRejectModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  disabled={!selectedReason || (selectedReason === "other" && !customReason)}
                  onClick={confirmReject}
                >
                  Reject
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
}
