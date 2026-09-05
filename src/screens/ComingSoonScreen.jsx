import ScreenHeader from "../ui/ScreenHeader"

export default function ComingSoonScreen({ title, subtitle, icon: Icon, phase, available }) {
  return (
    <>
      <ScreenHeader title={title} subtitle={subtitle} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-[var(--accent-foreground)]">
              <Icon size={26} aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-lg font-bold">Not built yet</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              This screen is scheduled for {phase} of the redesign. Nothing here is mocked, so you
              are not looking at placeholder data.
            </p>
            <p className="mt-4 max-w-sm rounded-card border border-border bg-card p-4 text-sm text-foreground">
              {available}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
