import { useEffect, useState } from "react"
import { Award, Sparkles, Ticket } from "lucide-react"
import Button from "../ui/Button"
import Card from "../ui/Card"
import LoadFailure from "../ui/LoadFailure"
import { pointsPerReport } from "../conditions"
import { loadVouchers, loadWallet, redeemVoucher } from "../rewards"

export default function RewardsPanel({ points, reportCount, userId, onRedeem }) {
  const [vouchers, setVouchers] = useState(null)
  const [wallet, setWallet] = useState(null)
  const [failed, setFailed] = useState(false)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    Promise.all([loadVouchers(), loadWallet(userId)])
      .then(([catalogue, owned]) => {
        if (!active) return
        setVouchers(catalogue)
        setWallet(owned)
      })
      .catch(() => active && setFailed(true))
    return () => {
      active = false
    }
  }, [userId])

  async function redeem(voucher) {
    setBusyId(voucher.id)
    setError("")
    try {
      const entry = await redeemVoucher(userId, voucher)
      setWallet((current) => [entry, ...current])
      onRedeem(voucher.cost)
    } catch {
      setError("Could not redeem that voucher. Your points were not touched.")
    }
    setBusyId(null)
  }

  return (
    <div className="space-y-4">
      <div className="rounded-hero bg-header p-5 text-[var(--header-foreground)]">
        <p className="text-micro font-semibold uppercase tracking-wide text-[var(--header-muted)]">
          Your points
        </p>
        <p className="mt-1 font-display text-3xl font-bold leading-none">{points}</p>
        <p className="mt-2 text-sm text-[var(--header-muted)]">
          {reportCount} EXP from {reportCount} {reportCount === 1 ? "report" : "reports"}. Each
          report earns {pointsPerReport} points to spend here; EXP is what ranks you on the
          leaderboard.
        </p>
      </div>

      <Card className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
          <Sparkles size={18} aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-sm font-semibold">Partners who want inclusive spaces</h2>
          <p className="mt-1 text-micro leading-relaxed text-muted-foreground">
            Local businesses and councils sponsor these vouchers to thank you for keeping the map
            honest. Spending points never lowers your EXP.
          </p>
        </div>
      </Card>

      {error && (
        <p
          role="alert"
          className="rounded-control border p-3 text-sm"
          style={{
            background: "var(--tone-danger-surface)",
            borderColor: "var(--tone-danger-border)",
            color: "var(--tone-danger-text)",
          }}
        >
          {error}
        </p>
      )}

      <section>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <Ticket size={18} aria-hidden="true" className="text-primary" />
          Rewards catalogue
        </h2>
        {failed ? (
          <LoadFailure message="Could not load rewards." />
        ) : vouchers === null ? (
          <div className="h-24 animate-pulse rounded-card bg-muted" aria-busy="true" />
        ) : vouchers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No partner vouchers listed yet.</p>
        ) : (
          <ul className="space-y-2">
            {vouchers.map((voucher) => {
              const affordable = points >= voucher.cost
              return (
                <Card as="li" key={voucher.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                      {voucher.partner}
                    </p>
                    <p className="text-sm font-semibold">{voucher.title}</p>
                    {voucher.description && (
                      <p className="mt-0.5 text-micro text-muted-foreground">{voucher.description}</p>
                    )}
                  </div>
                  <Button
                    variant={affordable ? "primary" : "secondary"}
                    disabled={!affordable || busyId !== null}
                    onClick={() => redeem(voucher)}
                    aria-label={`Redeem ${voucher.title} for ${voucher.cost} points`}
                  >
                    {busyId === voucher.id ? "Redeeming…" : `${voucher.cost} pts`}
                  </Button>
                </Card>
              )
            })}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-bold">
          <Award size={18} aria-hidden="true" className="text-primary" />
          Voucher wallet
        </h2>
        {wallet === null ? null : wallet.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing redeemed yet. Your voucher codes will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {wallet.map((entry) => (
              <Card as="li" key={entry.id} className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
                    {entry.partner}
                  </p>
                  <p className="text-sm font-semibold">{entry.title}</p>
                  <p className="mt-0.5 text-micro text-muted-foreground">
                    Show this code at the counter
                  </p>
                </div>
                <code className="rounded-control bg-accent px-3 py-2 font-mono text-sm font-bold text-[var(--accent-foreground)]">
                  {entry.code}
                </code>
              </Card>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
