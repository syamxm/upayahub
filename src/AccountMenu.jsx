import { useState } from "react"
import { signOut } from "firebase/auth"
import { Award, LogOut, Trash2 } from "lucide-react"
import { auth } from "./firebase"
import { deleteAccount } from "./account"
import Avatar from "./Avatar"
import Button from "./ui/Button"
import Modal from "./ui/Modal"

export default function AccountMenu({ user, points, reportCount, onClose }) {
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  async function remove() {
    setBusy(true)
    setError("")
    try {
      await deleteAccount(user)
    } catch (failure) {
      setError(
        failure.code === "auth/popup-closed-by-user"
          ? "Verification was cancelled. Your account was not deleted."
          : "Could not delete your account. Nothing was changed."
      )
      setBusy(false)
    }
  }

  return (
    <Modal title="Your account" onClose={onClose}>
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{user.displayName}</p>
            <p className="flex items-center gap-1 text-micro text-muted-foreground">
              <Award size={14} aria-hidden="true" />
              {points} points, {reportCount} {reportCount === 1 ? "report" : "reports"}
            </p>
          </div>
        </div>

        <Button variant="secondary" onClick={() => signOut(auth)} full>
          <LogOut size={16} aria-hidden="true" />
          Sign out
        </Button>

        {confirming ? (
          <div
            className="space-y-3 rounded-control border p-3"
            style={{
              background: "var(--tone-danger-surface)",
              borderColor: "var(--tone-danger-border)",
            }}
          >
            <p className="text-sm" style={{ color: "var(--tone-danger-text)" }}>
              This permanently deletes your Google sign-in, your name and your photo. Your past
              reports stay on the map so others can still trust them, but nothing links them to you
              any more. This cannot be undone.
            </p>
            <p className="text-micro" style={{ color: "var(--tone-danger-text)" }}>
              You will be asked to sign in with Google once more to confirm it is you.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={remove} disabled={busy} className="flex-1">
                {busy ? "Deleting..." : "Yes, delete permanently"}
              </Button>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
                Keep
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)} full>
            <Trash2 size={16} aria-hidden="true" />
            Delete account
          </Button>
        )}

        {error && (
          <p role="alert" className="text-sm" style={{ color: "var(--tone-danger-text)" }}>
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}
