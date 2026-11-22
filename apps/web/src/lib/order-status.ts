import type { BookingMode, OrderStatus } from "@jasana/shared"
import {
  Ban,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CircleCheck,
  CircleX,
  Hourglass,
  KeyRound,
  MapPinCheck,
  MessageSquareWarning,
  Navigation,
  TimerOff,
  Undo2,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react"
import type { BadgeTone } from "@/components/ui/badge"

export type StatusMeta = { label: string; tone: BadgeTone; icon: LucideIcon }

// Satu-satunya sumber label status order (Design System 7.1). Record memaksa ke-15 status ada.
export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING_ACCEPTANCE: { label: "Menunggu konfirmasi", tone: "warning", icon: Hourglass },
  ACCEPTED: { label: "Menunggu pembayaran", tone: "warning", icon: Wallet },
  PAID: { label: "Sudah dibayar", tone: "info", icon: Banknote },
  ON_THE_WAY: { label: "Dalam perjalanan", tone: "info", icon: Navigation },
  ARRIVED: { label: "Tiba di lokasi", tone: "info", icon: MapPinCheck },
  IN_PROGRESS: { label: "Sedang dikerjakan", tone: "info", icon: Wrench },
  AWAITING_VERIFICATION: { label: "Menunggu kode verifikasi", tone: "warning", icon: KeyRound },
  COMPLETED: { label: "Selesai", tone: "success", icon: CircleCheck },
  SETTLED: { label: "Dana cair", tone: "success", icon: BadgeCheck },
  DISPUTED: { label: "Dalam komplain", tone: "destructive", icon: MessageSquareWarning },
  REJECTED: { label: "Ditolak", tone: "neutral", icon: CircleX },
  EXPIRED: { label: "Kedaluwarsa", tone: "neutral", icon: TimerOff },
  PAYMENT_EXPIRED: { label: "Batas bayar lewat", tone: "neutral", icon: TimerOff },
  CANCELLED: { label: "Dibatalkan", tone: "neutral", icon: Ban },
  REFUNDED: { label: "Dana dikembalikan", tone: "neutral", icon: Undo2 },
}

/** Mode tanpa ikon ditandai titik live, bukan ikon (D242). */
export type ModeMeta = { label: string; tone: BadgeTone; icon: LucideIcon | null }

// Design System 6.2, ModeBadge. Terjadwal bergaris, karena pill berwarna selalu berarti status (DS 7.1).
// Sekarang pill putih bergaris --brand dengan titik live (D242).
export const BOOKING_MODE_META: Record<BookingMode, ModeMeta> = {
  SCHEDULED: { label: "Terjadwal", tone: "outline", icon: CalendarClock },
  AVAILABLE_NOW: { label: "Sekarang", tone: "now", icon: null },
}
