import { useEffect, useState } from "react"
import { signInWithEmailAndPassword, signOut } from "firebase/auth"
import { Trash2 } from "lucide-react"
import { auth } from "../firebase"
import Button from "../ui/Button"
import Card from "../ui/Card"
import Field from "../ui/Field"
import { ADMIN_EMAIL, addVoucher, deleteVoucher, loadVouchers, sampleVouchers } from "../rewards"

const empty = { partner: "", title: "", description: "", cost: "" }

// ponytail: prototype admin. Real gate is the Firestore rule on ADMIN_EMAIL, not this form.
export default function AdminScreen({ user }) {
  const isAdmin = user?.email === ADMIN_EMAIL
  const [form, setForm] = useState(empty)
  const [vouchers, setVouchers] = useState([])
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (isAdmin) loadVouchers().then(setVouchers).catch(() => setError("Could not load vouchers."))
  }, [isAdmin])

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  async function signIn(event) {
    event.preventDefault()
    setBusy(true)
    setError("")
    const data = new FormData(event.target)
    try {
      await signInWithEmailAndPassword(auth, `${data.get("username")}@upayahub.app`, data.get("password"))
    } catch (failure) {
      setError(`Sign-in failed: ${failure.code ?? failure.message}`)
    }
    setBusy(false)
  }

  async function create(vouchersToAdd) {
    setBusy(true)
    setError("")
    try {
      for (const voucher of vouchersToAdd) await addVoucher(voucher)
      setVouchers(await loadVouchers())
      setForm(empty)
    } catch {
      setError("Could not save voucher. Check the Firestore rules and the admin account email.")
    }
    setBusy(false)
  }

  async function remove(id) {
    await deleteVoucher(id)
    setVouchers((current) => current.filter((voucher) => voucher.id !== id))
  }

  return (
    <div className="min-h-dvh bg-background">
      <div className="bg-header px-4 py-6 text-[var(--header-foreground)]">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <h1 className="font-display text-xl font-bold">UpayaHub partner admin</h1>
          {isAdmin && (
            <Button variant="quiet" onClick={() => signOut(auth)}>
              Sign out
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
        {error && (
          <p role="alert" className="rounded-control border p-3 text-sm" style={{ background: "var(--tone-danger-surface)", borderColor: "var(--tone-danger-border)", color: "var(--tone-danger-text)" }}>
            {error}
          </p>
        )}

        {!isAdmin ? (
          <form onSubmit={signIn} className="space-y-3">
            {user && (
              <p className="text-sm text-muted-foreground">
                You are signed in as a regular user. Sign in with the admin account to manage vouchers.
              </p>
            )}
            <Field label="Username" name="username" autoComplete="username" required />
            <Field label="Password" name="password" type="password" autoComplete="current-password" required />
            <Button type="submit" disabled={busy} full>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        ) : (
          <>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                create([{ ...form, cost: Number(form.cost) }])
              }}
              className="space-y-3"
            >
              <Field label="Partner" value={form.partner} onChange={set("partner")} maxLength={100} required />
              <Field label="Voucher title" value={form.title} onChange={set("title")} maxLength={100} required />
              <Field label="Description" as="textarea" rows={2} value={form.description} onChange={set("description")} maxLength={300} />
              <Field label="Cost in points" type="number" min={1} step={1} value={form.cost} onChange={set("cost")} required />
              <div className="flex gap-2">
                <Button type="submit" disabled={busy} full>
                  Add voucher
                </Button>
                <Button variant="secondary" disabled={busy} onClick={() => create(sampleVouchers)}>
                  Add samples
                </Button>
              </div>
            </form>

            <ul className="space-y-2">
              {vouchers.map((voucher) => (
                <Card as="li" key={voucher.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-micro font-semibold uppercase text-muted-foreground">{voucher.partner}</p>
                    <p className="text-sm font-semibold">
                      {voucher.title} · {voucher.cost} pts
                    </p>
                  </div>
                  <Button variant="ghost" onClick={() => remove(voucher.id)} aria-label={`Delete ${voucher.title}`}>
                    <Trash2 size={16} aria-hidden="true" />
                  </Button>
                </Card>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}
