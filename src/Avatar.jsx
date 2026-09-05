import { useState } from "react"

export default function Avatar({ user }) {
  const [failed, setFailed] = useState(false)
  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase()

  if (!user.photoURL || failed) {
    return (
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-sm font-semibold text-primary">
        {initial}
      </div>
    )
  }

  return (
    <img
      src={user.photoURL}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  )
}
