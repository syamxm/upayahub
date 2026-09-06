import { useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { Image } from "lucide-react"
import { db } from "./db"
import Modal from "./ui/Modal"

export default function ReportPhoto({ reportId }) {
  const [photo, setPhoto] = useState(null)
  const [busy, setBusy] = useState(false)

  async function open() {
    setBusy(true)
    const saved = await getDoc(doc(db, "reportPhotos", reportId)).catch(() => null)
    setPhoto(saved?.data()?.data ?? "missing")
    setBusy(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        disabled={busy}
        className="tap inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-micro font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        <Image size={14} aria-hidden="true" />
        View photo
      </button>
      {photo && (
        <Modal title="Report photo" onClose={() => setPhoto(null)}>
          {photo === "missing" ? (
            <p className="p-5 text-sm text-muted-foreground">This photo is no longer available.</p>
          ) : (
            <img src={photo} alt="Photo submitted with this report" className="w-full" />
          )}
        </Modal>
      )}
    </>
  )
}
