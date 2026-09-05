import { Loader2 } from "lucide-react"

export default function Spinner({ label = "Loading", size = 18, className = "" }) {
  return (
    <span role="status" className={`inline-flex items-center gap-2 ${className}`}>
      <Loader2 size={size} aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
      <span className="sr-only">{label}</span>
    </span>
  )
}
