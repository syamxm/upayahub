import { useEffect, useState } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { applyTheme, readPreference, savePreference, watchSystemTheme } from "../theme"

const options = [
  { id: "system", label: "System", icon: Monitor },
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
]

export default function ThemeToggle() {
  const [preference, setPreference] = useState(readPreference)

  useEffect(() => watchSystemTheme(() => applyTheme("system")), [])

  function choose(next) {
    setPreference(next)
    savePreference(next)
  }

  return (
    <div>
      <p id="theme-label" className="text-sm font-semibold">
        Appearance
      </p>
      <div role="radiogroup" aria-labelledby="theme-label" className="mt-3 grid grid-cols-3 gap-2">
        {options.map(({ id, label, icon: Icon }) => {
          const isActive = id === preference
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => choose(id)}
              className={`tap flex flex-col items-center justify-center gap-1.5 rounded-control border px-2 py-3 text-micro font-semibold transition-colors ${
                isActive
                  ? "border-primary bg-accent text-[var(--accent-foreground)]"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
