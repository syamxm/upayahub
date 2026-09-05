export default function ListSkeleton({ rows = 3, label = "Loading" }) {
  return (
    <div className="space-y-2" aria-busy="true">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className="h-24 animate-pulse rounded-card bg-muted" />
      ))}
    </div>
  )
}
