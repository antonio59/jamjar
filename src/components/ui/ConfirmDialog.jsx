import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import Button from "./Button";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // 'danger' | 'primary'
  loading = false,
  children,
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[var(--overlay)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[var(--surface)] rounded-[var(--r-xl)] w-full max-w-sm shadow-[var(--shadow-xl)] border border-[var(--border-default)] overflow-hidden"
          >
            <div className="p-5">
              {variant === "danger" && (
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--danger-soft)] text-[var(--danger)] mb-3">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                {title}
              </h3>
              {description && (
                <p className="text-sm text-[var(--text-secondary)] mt-1.5 leading-snug">
                  {description}
                </p>
              )}
              {children && <div className="mt-3">{children}</div>}
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3 bg-[var(--surface-2)] border-t border-[var(--border-subtle)]">
              <Button variant="ghost" onClick={onClose} disabled={loading}>
                {cancelLabel}
              </Button>
              <Button
                variant={variant === "danger" ? "danger" : "primary"}
                onClick={onConfirm}
                loading={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
