import { useRef } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function BottomSheet({ title, expanded, onToggle, children }) {
  const start = useRef(null)
  const travel = useRef(0)
  const handled = useRef(false)

  function onPointerDown(event) {
    start.current = event.clientY
    travel.current = 0
    handled.current = false
  }

  function onPointerMove(event) {
    if (start.current === null) return
    travel.current = event.clientY - start.current
  }

  function onPointerUp() {
    if (start.current === null) return
    if (travel.current < -40 && !expanded) {
      onToggle(true)
      handled.current = true
    }
    if (travel.current > 40 && expanded) {
      onToggle(false)
      handled.current = true
    }
    start.current = null
  }

  function onClick() {
    if (handled.current) {
      handled.current = false
      return
    }
    onToggle(!expanded)
  }

  return (
    <section
      aria-label={title}
      className={`absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-hero border border-border bg-card shadow-float transition-[height] duration-200 md:hidden ${
        expanded ? "h-[70%]" : "h-16"
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        aria-expanded={expanded}
        className="flex shrink-0 touch-none flex-col items-center gap-1 px-4 pb-2 pt-2.5"
      >
        <span aria-hidden="true" className="h-1 w-10 rounded-full bg-border" />
        <span className="flex items-center gap-1.5 text-sm font-semibold">
          {title}
          {expanded ? (
            <ChevronDown size={16} aria-hidden="true" />
          ) : (
            <ChevronUp size={16} aria-hidden="true" />
          )}
        </span>
      </button>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" hidden={!expanded}>
        {children}
      </div>
    </section>
  )
}
