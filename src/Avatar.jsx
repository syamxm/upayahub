import { useState } from "react"

export default function Avatar({ user }) {
  const [failed, setFailed] = useState(false)
  const initial = (user.displayName || user.email || "?").charAt(0).toUpperCase()

  if (!user.photoURL || failed) {
    return (
      <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-800 grid place-items-center text-sm font-semibold">
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
      className="w-9 h-9 shrink-0 rounded-full object-cover"
    />
  )
}
