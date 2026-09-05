export default function Chip({ pressed = false, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`tap inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-micro font-semibold transition-colors ${
        pressed
          ? "border-primary bg-primary text-[var(--primary-foreground)]"
          : "border-border bg-card text-foreground hover:bg-muted"
      } ${className}`}
      {...props}
    />
  )
}
