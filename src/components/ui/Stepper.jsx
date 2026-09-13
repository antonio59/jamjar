import { Check } from "lucide-react";
import { cx } from "./cx";

export default function Stepper({ steps, current, onJump }) {
  return (
    <ol className="flex items-center w-full gap-2">
      {steps.map((step, idx) => {
        const isComplete = idx < current;
        const isActive = idx === current;
        const isClickable = idx <= current && onJump;

        return (
          <li key={step.id} className="flex items-center flex-1 min-w-0">
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onJump(idx)}
              className={cx(
                "flex items-center gap-2 min-w-0 group text-left",
                isClickable && "cursor-pointer",
              )}
            >
              <span
                className={cx(
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold flex-shrink-0 transition-colors border",
                  isComplete &&
                    "bg-[var(--brand)] border-[var(--brand)] text-[var(--brand-on)]",
                  isActive &&
                    "bg-[var(--brand-soft)] border-[var(--brand)] text-[var(--brand)]",
                  !isComplete &&
                    !isActive &&
                    "bg-[var(--surface)] border-[var(--border-default)] text-[var(--text-muted)]",
                )}
              >
                {isComplete ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </span>
              <span className="hidden sm:block min-w-0">
                <span
                  className={cx(
                    "block text-xs font-semibold leading-snug",
                    isActive ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]",
                  )}
                >
                  {step.label}
                </span>
                {step.hint && (
                  <span className="block text-[11px] leading-tight text-[var(--text-muted)]">
                    {step.hint}
                  </span>
                )}
              </span>
            </button>
            {idx < steps.length - 1 && (
              <span
                aria-hidden
                className={cx(
                  "h-px flex-1 mx-2",
                  idx < current
                    ? "bg-[var(--brand)]"
                    : "bg-[var(--border-default)]",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
