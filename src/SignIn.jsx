import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { MapPin } from "lucide-react"
import { auth } from "./firebase"

export default function SignIn() {
  return (
    <div className="h-screen flex flex-col items-center justify-center gap-6 bg-slate-50 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <MapPin size={40} className="text-emerald-600" />
        <h1 className="text-3xl font-bold text-emerald-600">UpayaHub</h1>
        <p className="text-slate-600">Know Before You Go.</p>
      </div>
      <p className="text-sm text-slate-500 text-center max-w-xs">
        Sign in so your accessibility reports carry your name and build your credibility.
      </p>
      <button
        onClick={() => signInWithPopup(auth, new GoogleAuthProvider())}
        className="rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200"
      >
        Continue with Google
      </button>
    </div>
  )
}
