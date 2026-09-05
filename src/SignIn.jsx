import { useState } from "react"
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { MapPin, ShieldCheck } from "lucide-react"
import { auth } from "./firebase"
import Button from "./ui/Button"
import Spinner from "./ui/Spinner"

export default function SignIn() {
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function signIn() {
    setBusy(true)
    setError("")
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (failure) {
      setError(
        failure.code === "auth/popup-closed-by-user"
          ? "Sign-in was cancelled. Try again when you are ready."
          : "Could not sign you in just now. Please try again."
      )
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <div className="bg-header px-4 pb-10 pt-[max(3rem,env(safe-area-inset-top))] text-[var(--header-foreground)]">
        <div className="mx-auto w-full max-w-md">
          <span className="grid h-14 w-14 place-items-center rounded-hero bg-[var(--header-surface)]">
            <MapPin size={26} aria-hidden="true" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight">UpayaHub</h1>
          <p className="mt-1 text-sm text-[var(--header-muted)]">Know before you go.</p>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-between gap-8 px-4 py-8">
        <div>
          <h2 className="font-display text-lg font-bold">Sign in to get started</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Your reports carry your name, so other people know who checked a ramp, a lift or a
            toilet, and when. That is what makes the map worth trusting.
          </p>
          <p className="mt-4 flex items-start gap-2 rounded-card border border-border bg-card p-3 text-micro text-muted-foreground">
            <ShieldCheck size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-primary" />
            We store your name and profile photo only. You can delete your account at any time.
          </p>
        </div>

        <div className="space-y-3">
          {error && (
            <p
              role="alert"
              className="rounded-card border p-3 text-sm"
              style={{
                background: "var(--tone-danger-surface)",
                borderColor: "var(--tone-danger-border)",
                color: "var(--tone-danger-text)",
              }}
            >
              {error}
            </p>
          )}
          <Button onClick={signIn} disabled={busy} size="lg" full>
            {busy ? <Spinner label="Signing you in" /> : "Continue with Google"}
          </Button>
        </div>
      </div>
    </div>
  )
}
