import { Award, Sparkles, Ticket } from "lucide-react"
import Card from "../ui/Card"
import TodoStub from "../ui/TodoStub"
import { pointsPerReport } from "../submitReport"

export default function RewardsPanel({ points, reportCount }) {
  return (
    <div className="space-y-4">
      <div className="rounded-hero bg-header p-5 text-[var(--header-foreground)]">
        <p className="text-micro font-semibold uppercase tracking-wide text-[var(--header-muted)]">
          Your points
        </p>
        <p className="mt-1 font-display text-3xl font-bold leading-none">{points}</p>
        <p className="mt-2 text-sm text-[var(--header-muted)]">
          Earned from {reportCount} {reportCount === 1 ? "report" : "reports"}, at{" "}
          {pointsPerReport} points each.
        </p>
      </div>

      <Card className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">How you earn points</h2>
          <p className="mt-1 text-micro leading-relaxed text-muted-foreground">
            Every photo report you submit earns {pointsPerReport} points. Your points and report
            count above are read from your real account.
          </p>
        </div>
      </Card>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <Ticket size={18} aria-hidden="true" className="text-primary" />
          Rewards catalogue
        </h2>
        <TodoStub what="No rewards are listed because there is no backend for them. Partner vouchers, stock levels, redeeming points and issuing a voucher code all need server-side support that does not exist yet. Nothing here can be redeemed." />
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <Award size={18} aria-hidden="true" className="text-primary" />
          Voucher wallet
        </h2>
        <TodoStub what="Your wallet is empty and cannot be filled yet. Storing redeemed vouchers, their expiry dates and their QR codes needs the same backend." />
      </div>
    </div>
  )
}
