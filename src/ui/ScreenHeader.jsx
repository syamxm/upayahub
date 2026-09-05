import { ChevronLeft } from "lucide-react"

export default function ScreenHeader({ title, subtitle, onBack, backLabel = "Go back", children }) {
  return (
    <header className="bg-header text-[var(--header-foreground)]">
      <div className="mx-auto w-full max-w-5xl px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top))] md:pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label={backLabel}
                className="tap -ml-2 grid shrink-0 place-items-center rounded-full text-[var(--header-foreground)] hover:bg-[var(--header-surface)]"
              >
                <ChevronLeft size={20} aria-hidden="true" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-bold leading-tight md:text-2xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-0.5 text-micro text-[var(--header-muted)]">{subtitle}</p>
              )}
            </div>
          </div>
          {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
        </div>
      </div>
    </header>
  )
}
