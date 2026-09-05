import { useState } from "react"
import { signOut } from "firebase/auth"
import { X, LogOut, Trash2, Award } from "lucide-react"
import { auth } from "./firebase"
import { deleteAccount } from "./account"
import Avatar from "./Avatar"

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
          ? "Verification cancelled. Your account was not deleted."
          : "Could not delete your account. Nothing was changed."
      )
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#0f1923]/50 p-4">
      <div className="flex w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="font-bold text-slate-900">Your account</h2>
          <button onClick={onClose} aria-label="Close account menu" className="text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4">
          <Avatar user={user} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-900">{user.displayName}</p>
            <p className="flex items-center gap-1 text-sm text-slate-500">
              <Award size={14} />
              {points} points · {reportCount} {reportCount === 1 ? "report" : "reports"}
            </p>
          </div>
        </div>

        <div className="space-y-2 p-4 pt-0">
          <button
            onClick={() => signOut(auth)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 py-2.5 text-sm font-semibold text-slate-700"
          >
            <LogOut size={15} />
            Sign out
          </button>

          {confirming ? (
            <div className="space-y-2 rounded-2xl bg-red-50 p-3">
              <p className="text-sm text-red-900">
                This permanently deletes your Google sign-in, your name, and your photo. Your past
                reports stay on the map so others can still trust them, but nothing links them to
                you any more. This cannot be undone.
              </p>
              <p className="text-xs text-red-800">
                You will be asked to sign in with Google once more to confirm it is you.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={remove}
                  disabled={busy}
                  className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {busy ? "Deleting..." : "Yes, delete permanently"}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  disabled={busy}
                  className="rounded-full border border-red-200 bg-white px-4 text-sm font-semibold text-slate-700"
                >
                  Keep
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-red-700"
            >
              <Trash2 size={15} />
              Delete account
            </button>
          )}

          {error && <p className="text-sm text-red-700">{error}</p>}
        </div>
      </div>
    </div>
  )
}
