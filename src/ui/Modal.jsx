import { useEffect, useId, useRef } from "react"
import { X } from "lucide-react"

export default function Modal({ title, onClose, children, footer }) {
  const titleId = useId()
  const panel = useRef(null)

  useEffect(() => {
    const previous = document.activeElement
    panel.current?.focus()
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose()
        return
      }
      if (event.key !== "Tab" || !panel.current) return

      const focusable = [
        ...panel.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        ),
      ]
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (!panel.current.contains(current)) {
        event.preventDefault()
        first.focus()
      } else if (event.shiftKey && current === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && current === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-[#0f1923]/50 p-0 sm:place-items-center sm:p-4">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[85dvh] w-full flex-col overflow-hidden rounded-t-hero bg-card shadow-float outline-none sm:max-w-md sm:rounded-hero"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h2 id={titleId} className="font-display text-base font-bold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title.toLowerCase()}`}
            className="tap -mr-2 grid shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-border p-4">{footer}</div>}
      </div>
    </div>
  )
}
