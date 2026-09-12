import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cx } from "./cx";

export default function Drawer({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  side = "right",
  width = "sm",
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const widths = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
  }[width];

  const isRight = side === "right";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-[var(--overlay)]"
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: isRight ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: isRight ? "100%" : "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className={cx(
              "fixed top-0 bottom-0 z-50 w-full bg-[var(--surface)] shadow-[var(--shadow-xl)] flex flex-col",
              widths,
              isRight ? "right-0 border-l border-[var(--border-default)]" : "left-0 border-r border-[var(--border-default)]",
            )}
          >
            <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[var(--text-primary)]">
                  {title}
                </h2>
                {description && (
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    {description}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex-shrink-0 h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10 inline-flex items-center justify-center rounded-[var(--r-md)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && (
              <footer className="border-t border-[var(--border-subtle)] px-5 py-3 bg-[var(--surface-2)]">
                {footer}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
