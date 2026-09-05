export default function Card({ as: Tag = "div", padded = true, className = "", ...props }) {
  return (
    <Tag
      className={`rounded-card border border-border bg-card text-[var(--card-foreground)] shadow-card ${padded ? "p-4" : ""} ${className}`}
      {...props}
    />
  )
}
