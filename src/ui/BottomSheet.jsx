import { useRef, useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export default function BottomSheet({ title, expanded, onToggle, children }) {
  const [dragged, setDragged] = useState(null)
  const start = useRef(null)

  function onPointerDown(event) {
    start.current = event.clientY
    setDragged(0)
  }

  function onPointerMove(event) {
    if (start.current === null) return
    setDragged(event.clientY - start.current)
  }

  function onPointerUp() {
    if (start.current === null) return
    const travel = dragged ?? 0
    if (travel < -40 && !expanded) onToggle(true)
    if (travel > 40 && expanded) onToggle(false)
    start.current = null
    setDragged(null)
  }

  return (
    <section
      aria-label={title}
      className={`absolute inset-x-0 bottom-0 z-10 flex flex-col rounded-t-hero border border-border bg-card shadow-float transition-[height] duration-200 md:hidden ${
        expanded ? "h-[70%]" : "h-32"
      }`}
    >
      <button
        type="button"
        onClick={() => onToggle(!expanded)}
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
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
    </section>
  )
}
