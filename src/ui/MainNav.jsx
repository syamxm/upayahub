import { MapPin } from "lucide-react"

function itemClasses(active) {
  return active ? "text-primary" : "text-muted-foreground hover:text-foreground"
}

export default function MainNav({ items, active, onChange }) {
  return (
    <>
      <nav
        aria-label="Main"
        className="order-last shrink-0 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="flex">
          {items.map(({ id, label, icon: Icon }) => {
            const isActive = id === active
            return (
              <li key={id} className="flex-1">
                <button
                  type="button"
                  onClick={() => onChange(id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`tap flex w-full flex-col items-center gap-1 px-1 pb-2 pt-2.5 text-micro font-semibold transition-colors ${itemClasses(isActive)}`}
                >
                  <span
                    className={`grid h-8 w-8 place-items-center rounded-control transition-colors ${
                      isActive ? "bg-accent text-[var(--accent-foreground)]" : ""
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  {label}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <nav
        aria-label="Main"
        className="hidden shrink-0 border-r border-border bg-card md:flex md:w-20 md:flex-col lg:w-60"
      >
        <div className="flex items-center gap-2 px-4 py-5 lg:px-5">
          <MapPin size={22} aria-hidden="true" className="shrink-0 text-primary" />
          <span className="hidden font-display text-lg font-bold tracking-tight lg:block">
            UpayaHub
          </span>
        </div>
        <ul className="flex flex-1 flex-col gap-1 px-2 lg:px-3">
          {items.map(({ id, label, icon: Icon }) => {
            const isActive = id === active
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => onChange(id)}
                  aria-current={isActive ? "page" : undefined}
                  title={label}
                  className={`tap flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-sm font-semibold transition-colors md:justify-center lg:justify-start ${
                    isActive
                      ? "bg-accent text-[var(--accent-foreground)]"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={20} aria-hidden="true" className="shrink-0" />
                  <span className="hidden lg:block">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </>
  )
}
