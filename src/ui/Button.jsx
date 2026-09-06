const variants = {
  primary: "bg-primary text-[var(--primary-foreground)] shadow-raised hover:brightness-110",
  secondary: "bg-card text-foreground border border-border hover:bg-muted",
  quiet: "bg-muted text-foreground hover:brightness-95",
  danger:
    "bg-[var(--tone-danger-text)] text-[var(--primary-foreground)] shadow-raised hover:brightness-110",
  ghost: "text-[var(--tone-danger-text)] hover:bg-[var(--tone-danger-surface)]",
}

const sizes = {
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-3.5 text-base",
}

export default function Button({
  as: Tag = "button",
  variant = "primary",
  size = "md",
  full = false,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <Tag
      type={Tag === "button" ? type : undefined}
      className={`tap inline-flex items-center justify-center gap-2 rounded-control font-semibold transition-[filter,background-color,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 ${variants[variant]} ${sizes[size]} ${full ? "w-full" : ""} ${className}`}
      {...props}
    />
  )
}
