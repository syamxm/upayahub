import { useId } from "react"

export default function Field({
  label,
  hint,
  error,
  icon: Icon,
  as = "input",
  className = "",
  ...props
}) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const Control = as
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ")

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-micro text-muted-foreground">
          {hint}
        </p>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-3.5 text-muted-foreground"
          />
        )}
        <Control
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className={`w-full rounded-control border bg-[var(--input)] py-3 pr-3 text-sm text-foreground placeholder:text-muted-foreground ${
            Icon ? "pl-9" : "pl-3"
          } ${error ? "border-[var(--tone-danger-text)]" : "border-border"} ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-micro font-medium text-[var(--tone-danger-text)]">
          {error}
        </p>
      )}
    </div>
  )
}
