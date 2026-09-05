import { Award, ChevronRight, FileText, Settings, Trophy } from "lucide-react"
import Avatar from "../Avatar"
import Card from "../ui/Card"
import ScreenHeader from "../ui/ScreenHeader"
import ThemeToggle from "../ui/ThemeToggle"

function Stat({ label, value }) {
  return (
    <div className="rounded-control bg-[var(--header-surface)] p-3 text-center">
      <p className="font-display text-xl font-bold leading-none">{value}</p>
      <p className="mt-1 text-micro text-[var(--header-muted)]">{label}</p>
    </div>
  )
}

export default function ProfileScreen({ user, points, reportCount, onOpenLeaderboard, onOpenAccount }) {
  return (
    <>
      <ScreenHeader title="Profile" subtitle="Your contributions and settings">
        <button
          type="button"
          onClick={onOpenAccount}
          aria-label="Open account settings"
          className="tap grid place-items-center rounded-full text-[var(--header-foreground)] hover:bg-[var(--header-surface)]"
        >
          <Settings size={20} aria-hidden="true" />
        </button>
      </ScreenHeader>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="bg-header px-4 pb-5 text-[var(--header-foreground)]">
          <div className="mx-auto w-full max-w-5xl">
            <div className="flex items-center gap-3">
              <Avatar user={user} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-bold leading-tight">
                  {user.displayName || "Signed in"}
                </p>
                <p className="text-micro text-[var(--header-muted)]">
                  Every report you confirm keeps the map trustworthy.
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat label="Points" value={points} />
              <Stat label={reportCount === 1 ? "Report" : "Reports"} value={reportCount} />
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-5xl space-y-3 px-4 py-5">
          <button
            type="button"
            onClick={onOpenLeaderboard}
            className="tap flex w-full items-center gap-3 rounded-card border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
              <Trophy size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Top contributors</span>
              <span className="block text-micro text-muted-foreground">
                See how the community ranks by points and credibility
              </span>
            </span>
            <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          </button>

          <button
            type="button"
            onClick={onOpenAccount}
            className="tap flex w-full items-center gap-3 rounded-card border border-border bg-card p-4 text-left transition-colors hover:bg-muted"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
              <Award size={18} aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Account</span>
              <span className="block text-micro text-muted-foreground">
                Sign out or permanently delete your account
              </span>
            </span>
            <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-muted-foreground" />
          </button>

          <Card>
            <ThemeToggle />
          </Card>

          <Card className="flex items-start gap-3">
            <FileText size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-muted-foreground" />
            <p className="text-micro text-muted-foreground">
              Achievements, activity history and trust levels arrive in a later phase. Your points
              and report count above are read from your real account.
            </p>
          </Card>
        </div>
      </div>
    </>
  )
}
