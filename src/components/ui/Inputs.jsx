import { Search, X } from "lucide-react";
import { cx } from "./cx";

const baseField =
  "block w-full bg-[var(--surface)] border border-[var(--border-default)] rounded-[var(--r-md)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] focus:border-[var(--border-focus)] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function Input({ size = "md", className = "", ...rest }) {
  const sz = { sm: "h-8 px-2.5 pointer-coarse:h-10", md: "h-10 px-3 pointer-coarse:h-11", lg: "h-12 px-4" }[size];
  return <input className={cx(baseField, sz, className)} {...rest} />;
}

export function Textarea({ rows = 3, className = "", ...rest }) {
  return (
    <textarea
      rows={rows}
      className={cx(baseField, "py-2.5 px-3 resize-y", className)}
      {...rest}
    />
  );
}

export function Select({ size = "md", className = "", children, ...rest }) {
  const sz = { sm: "h-8 px-2 pr-7 pointer-coarse:h-10", md: "h-10 px-3 pr-8 pointer-coarse:h-11", lg: "h-12 px-4 pr-9" }[size];
  return (
    <div className="relative inline-block">
      <select
        className={cx(
          baseField,
          sz,
          "appearance-none cursor-pointer pr-8",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden
      >
        <path
          fillRule="evenodd"
          d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
          clipRule="evenodd"
        />
      </svg>
    </div>
  );
}

export function Label({ htmlFor, children, hint, required, className = "" }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cx(
        "block text-sm font-medium text-[var(--text-primary)] mb-1",
        className,
      )}
    >
      {children}
      {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
      {hint && (
        <span className="block text-xs text-[var(--text-muted)] font-normal mt-0.5">
          {hint}
        </span>
      )}
    </label>
  );
}

export function SearchField({
  value,
  onChange,
  onClear,
  placeholder = "Search…",
  loading = false,
  size = "md",
  className = "",
  ...rest
}) {
  const sz = { sm: "h-8 pl-8 pr-8 text-sm pointer-coarse:h-10", md: "h-10 pl-9 pr-9 text-sm pointer-coarse:h-11", lg: "h-12 pl-10 pr-10 text-base" }[size];
  return (
    <div className={cx("relative", className)}>
      <Search
        className={cx(
          "absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none",
          size === "lg" ? "w-5 h-5 left-3" : "w-4 h-4",
        )}
        aria-hidden
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cx(baseField, sz)}
        {...rest}
      />
      {value && !loading && (
        <button
          type="button"
          onClick={() => (onClear ? onClear() : onChange(""))}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      {loading && (
        <span
          aria-hidden
          className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-[var(--brand)] border-t-transparent rounded-full animate-spin"
        />
      )}
    </div>
  );
}
