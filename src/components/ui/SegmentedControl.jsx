import { cx } from "./cx";

export default function SegmentedControl({
  value,
  onChange,
  options,
  size = "md",
  fullWidth = false,
  className = "",
  ariaLabel,
}) {
  const sz = {
    sm: "h-8 text-xs pointer-coarse:h-10",
    md: "h-10 text-sm pointer-coarse:h-11",
    lg: "h-12 text-base",
  }[size];

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cx(
        "inline-flex bg-[var(--surface-2)] border border-[var(--border-default)] rounded-[var(--r-md)] p-0.5 gap-0.5",
        fullWidth && "flex w-full",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(opt.value)}
            disabled={opt.disabled}
            className={cx(
              "inline-flex items-center justify-center gap-1.5 px-3 rounded-[calc(var(--r-md)-2px)] font-medium transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed",
              sz,
              fullWidth && "flex-1",
              active
                ? "bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
            )}
          >
            {opt.icon}
            {opt.label}
            {opt.badge != null && (
              <span
                className={cx(
                  "ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full",
                  active
                    ? "bg-[var(--brand)] text-[var(--brand-on)]"
                    : "bg-[var(--border-default)] text-[var(--text-secondary)]",
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
