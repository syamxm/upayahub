import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore"
import { db } from "./db"

export const ADMIN_EMAIL = "admin_upayahub@upayahub.app"

export const sampleVouchers = [
  {
    partner: "Kopi Sejahtera Café",
    title: "RM5 off any drink",
    description: "Step-free entrance and accessible toilet. Show your code at the counter.",
    cost: 30,
  },
  {
    partner: "Farmasi Mesra OKU",
    title: "10% off mobility aids",
    description: "Valid on wheelchairs, walking frames and grab bars.",
    cost: 50,
  },
  {
    partner: "DBKL Parking",
    title: "2 hours free OKU parking",
    description: "Redeem at any DBKL parking counter with your OKU card.",
    cost: 20,
  },
]

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function voucherCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return "UH-" + Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("")
}

async function list(ref) {
  const snapshot = await getDocs(query(ref, orderBy("createdAt", "desc")))
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }))
}

export const loadVouchers = () => list(collection(db, "vouchers"))
export const loadWallet = (userId) => list(collection(db, "users", userId, "redemptions"))

export function addVoucher(voucher) {
  return addDoc(collection(db, "vouchers"), { ...voucher, createdAt: serverTimestamp() })
}

export const deleteVoucher = (id) => deleteDoc(doc(db, "vouchers", id))

export async function redeemVoucher(userId, voucher) {
  const redemption = doc(collection(db, "users", userId, "redemptions"))
  const entry = {
    voucherId: voucher.id,
    partner: voucher.partner,
    title: voucher.title,
    code: voucherCode(),
    cost: voucher.cost,
  }
  const batch = writeBatch(db)
  batch.set(redemption, { ...entry, createdAt: serverTimestamp() })
  batch.update(doc(db, "users", userId), {
    points: increment(-voucher.cost),
    lastRedemptionId: redemption.id,
  })
  await batch.commit()
  return { id: redemption.id, ...entry, createdAt: { seconds: Date.now() / 1000 } }
}
