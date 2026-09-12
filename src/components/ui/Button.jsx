import { cx } from "./cx";

const base =
  "inline-flex items-center justify-center gap-1.5 font-medium rounded-[var(--r-md)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap";

const sizes = {
  xs: "text-xs h-7 px-2.5 pointer-coarse:h-9",
  sm: "text-sm h-8 px-3 pointer-coarse:h-10",
  md: "text-sm h-10 px-4 pointer-coarse:h-11",
  lg: "text-base h-12 px-5",
};

const variants = {
  primary:
    "bg-[var(--brand)] text-[var(--brand-on)] hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)]",
  secondary:
    "bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-default)] hover:bg-[var(--surface-2)] hover:border-[var(--border-strong)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]",
  danger:
    "bg-[var(--danger-solid)] text-white hover:bg-[var(--danger-solid-hover)]",
  success:
    "bg-[var(--success-solid)] text-white hover:bg-[var(--success-solid-hover)]",
  warning:
    "bg-[var(--warning-solid)] text-white hover:bg-[var(--warning-solid-hover)]",
  subtle:
    "bg-[var(--brand-soft)] text-[var(--brand)] hover:bg-[var(--brand-soft-strong)]",
};

export default function Button({
  as: As = "button",
  variant = "secondary",
  size = "md",
  fullWidth = false,
  loading = false,
  iconLeft,
  iconRight,
  className = "",
  children,
  disabled,
  ...rest
}) {
  const cls = cx(
    base,
    sizes[size],
    variants[variant],
    fullWidth && "w-full",
    className,
  );

  return (
    <As className={cls} disabled={disabled || loading} {...rest}>
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        iconLeft
      )}
      {children}
      {iconRight}
    </As>
  );
}

export function IconButton({
  variant = "ghost",
  size = "md",
  label,
  className = "",
  children,
  ...rest
}) {
  const sz = {
    xs: "h-7 w-7 pointer-coarse:h-9 pointer-coarse:w-9",
    sm: "h-8 w-8 pointer-coarse:h-10 pointer-coarse:w-10",
    md: "h-9 w-9 pointer-coarse:h-11 pointer-coarse:w-11",
    lg: "h-10 w-10",
  }[size];
  return (
    <button
      aria-label={label}
      title={label}
      className={cx(
        "inline-flex items-center justify-center rounded-[var(--r-md)] transition-colors disabled:opacity-50",
        sz,
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
