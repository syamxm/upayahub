import { RefreshCw, WifiOff } from "lucide-react"
import Button from "./Button"

export default function LoadFailure({ message, onRetry }) {
  return (
    <div className="rounded-card border border-dashed border-border px-4 py-8 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <WifiOff size={20} aria-hidden="true" />
      </span>
      <p className="mt-3 text-sm font-semibold">{message}</p>
      <p className="mt-1 text-micro text-muted-foreground">
        Check your connection, then try again.
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="mt-4">
          <RefreshCw size={15} aria-hidden="true" />
          Try again
        </Button>
      )}
    </div>
  )
}
