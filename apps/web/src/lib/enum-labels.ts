import {
  Ban,
  CircleCheck,
  CirclePause,
  CircleX,
  Eye,
  EyeOff,
  FilePen,
  GitMerge,
  Gavel,
  Hourglass,
  LogOut,
  Mail,
  MailCheck,
  MailX,
  Search,
  Send,
  ShieldCheck,
  ShieldX,
  Undo2,
} from "lucide-react"
import type { ProviderVerificationStatus } from "@/types/api/auth"
import type {
  DisputeStatus,
  EmailDeliveryStatus,
  ListingStatus,
  MembershipStatus,
  RefundStatus,
  TaxonomyRequestStatus,
  WithdrawalStatus,
} from "@/types/api/enums"
import type { PriceUnit, SearchSort } from "@/types/api/listing"
import type { ProviderType } from "@/types/api/provider"
import type { StatusMeta } from "./order-status"

// Satu-satunya tabel label enum non-order (Design System 7.2). Label status order di order-status.ts.
// Record memaksa setiap nilai enum punya label. Pola nada DS 7.2: menunggu = warning, berhasil =
// success, gagal atau ditolak = destructive, dibatalkan atau berakhir = neutral.

/** Akhiran harga: `Mulai Rp50.000 / jam`. PER_JOB tanpa akhiran. */
export const PRICE_UNIT_SUFFIX: Record<PriceUnit, string> = {
  PER_JOB: "",
  PER_HOUR: "/ jam",
  PER_UNIT: "/ unit",
}

export const SORT_LABEL: Record<SearchSort, string> = {
  rating: "Rating tertinggi",
  popular: "Paling populer",
  price_asc: "Harga terendah",
  price_desc: "Harga tertinggi",
  distance: "Terdekat",
}

export const PROVIDER_TYPE_LABEL: Record<ProviderType, string> = {
  INDIVIDUAL: "Perorangan",
  BUSINESS: "Usaha",
}

/** Status verifikasi usaha. */
export const VERIFICATION_STATUS_META: Record<ProviderVerificationStatus, StatusMeta> = {
  DRAFT: { label: "Draf", tone: "neutral", icon: FilePen },
  PENDING: { label: "Menunggu verifikasi", tone: "warning", icon: Hourglass },
  VERIFIED: { label: "Terverifikasi", tone: "success", icon: ShieldCheck },
  REJECTED: { label: "Ditolak", tone: "destructive", icon: CircleX },
  SUSPENDED: { label: "Ditangguhkan", tone: "destructive", icon: ShieldX },
}

export const MEMBERSHIP_STATUS_META: Record<MembershipStatus, StatusMeta> = {
  PENDING: { label: "Pelamar", tone: "warning", icon: Hourglass },
  ACTIVE: { label: "Aktif", tone: "success", icon: CircleCheck },
  REJECTED: { label: "Ditolak", tone: "neutral", icon: CircleX },
  RESIGNED: { label: "Keluar", tone: "neutral", icon: LogOut },
}

export const LISTING_STATUS_META: Record<ListingStatus, StatusMeta> = {
  DRAFT: { label: "Draf", tone: "neutral", icon: FilePen },
  ACTIVE: { label: "Tayang", tone: "success", icon: Eye },
  INACTIVE: { label: "Nonaktif", tone: "neutral", icon: EyeOff },
  SUSPENDED: { label: "Ditangguhkan admin", tone: "destructive", icon: ShieldX },
}

export const TAXONOMY_REQUEST_STATUS_META: Record<TaxonomyRequestStatus, StatusMeta> = {
  PENDING: { label: "Menunggu", tone: "warning", icon: Hourglass },
  APPROVED: { label: "Disetujui", tone: "success", icon: CircleCheck },
  REJECTED: { label: "Ditolak", tone: "destructive", icon: CircleX },
  MERGED: { label: "Sudah ada", tone: "info", icon: GitMerge },
}

// DS 7.2 hanya menyebut OPEN, UNDER_REVIEW, dan RESOLVED_*. CLOSED ada di enum backend dan diberi
// label "Ditutup". Putusan: dana dilepas dan sebagian = success, refund penuh = neutral.
export const DISPUTE_STATUS_META: Record<DisputeStatus, StatusMeta> = {
  OPEN: { label: "Dibuka", tone: "warning", icon: Hourglass },
  UNDER_REVIEW: { label: "Ditinjau admin", tone: "info", icon: Search },
  RESOLVED_RELEASE: { label: "Diputus", tone: "success", icon: Gavel },
  RESOLVED_PARTIAL: { label: "Diputus", tone: "success", icon: Gavel },
  RESOLVED_REFUND: { label: "Diputus", tone: "neutral", icon: Gavel },
  CLOSED: { label: "Ditutup", tone: "neutral", icon: CirclePause },
}

export const WITHDRAWAL_STATUS_META: Record<WithdrawalStatus, StatusMeta> = {
  REQUESTED: { label: "Menunggu persetujuan", tone: "warning", icon: Hourglass },
  APPROVED: { label: "Disetujui", tone: "warning", icon: CircleCheck },
  DISBURSING: { label: "Sedang dikirim", tone: "warning", icon: Send },
  COMPLETED: { label: "Berhasil", tone: "success", icon: CircleCheck },
  REJECTED: { label: "Ditolak", tone: "destructive", icon: CircleX },
  FAILED: { label: "Gagal", tone: "destructive", icon: CircleX },
  REVERSED: { label: "Dibatalkan, saldo dikembalikan", tone: "neutral", icon: Undo2 },
}

export const REFUND_STATUS_META: Record<RefundStatus, StatusMeta> = {
  REQUESTED: { label: "Diajukan", tone: "warning", icon: Hourglass },
  PROCESSING: { label: "Diproses", tone: "warning", icon: Send },
  COMPLETED: { label: "Berhasil", tone: "success", icon: CircleCheck },
  FAILED: { label: "Gagal", tone: "destructive", icon: Ban },
}

/** Status kirim notifikasi email. */
export const EMAIL_DELIVERY_STATUS_META: Record<EmailDeliveryStatus, StatusMeta> = {
  PENDING: { label: "Menunggu dikirim", tone: "warning", icon: Mail },
  SENT: { label: "Terkirim", tone: "success", icon: MailCheck },
  FAILED: { label: "Gagal", tone: "destructive", icon: MailX },
}

/** Untuk galeri /dev/ui. */
export const ENUM_META_GROUPS: { name: string; meta: Record<string, StatusMeta> }[] = [
  { name: "Verifikasi usaha", meta: VERIFICATION_STATUS_META },
  { name: "Keanggotaan pekerja", meta: MEMBERSHIP_STATUS_META },
  { name: "Status jasa", meta: LISTING_STATUS_META },
  { name: "Usulan jenis jasa", meta: TAXONOMY_REQUEST_STATUS_META },
  { name: "Komplain", meta: DISPUTE_STATUS_META },
  { name: "Pencairan", meta: WITHDRAWAL_STATUS_META },
  { name: "Pengembalian dana", meta: REFUND_STATUS_META },
  { name: "Notifikasi email", meta: EMAIL_DELIVERY_STATUS_META },
]
