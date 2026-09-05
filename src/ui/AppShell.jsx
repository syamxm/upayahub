export default function AppShell({ nav, children }) {
  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-control focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-float"
      >
        Skip to main content
      </a>
      {nav}
      <main id="main" className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
