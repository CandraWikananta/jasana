// Data contoh realistis untuk peraga: jasa di Bali, rupiah integer, waktu ISO UTC yang tampil WITA.
import type { OrderStatus } from "@jasana/shared"
import { AirVent, Droplets, Leaf, Plug, Sparkles, Wrench, type LucideIcon } from "lucide-react"
import type { ListingCard as ListingCardData } from "@/types/api/listing"

export type Mode = "SCHEDULED" | "AVAILABLE_NOW"

export const CATEGORIES: { label: string; icon: LucideIcon }[] = [
  { label: "Servis AC", icon: AirVent },
  { label: "Kebersihan", icon: Sparkles },
  { label: "Ledeng", icon: Droplets },
  { label: "Listrik", icon: Plug },
  { label: "Taman", icon: Leaf },
  { label: "Perbaikan", icon: Wrench },
]

export const LOCATIONS = ["Denpasar", "Badung", "Gianyar", "Tabanan"]

export type ListingSample = {
  id: string
  title: string
  provider: string
  area: string
  rating: number
  reviews: number
  meter: number
  price: number
  minutes: number
  mode: Mode
  icon: LucideIcon
}

export const LISTINGS: ListingSample[] = [
  { id: "l1", title: "Servis AC split 1/2 sampai 1 PK", provider: "Dingin Jaya Teknik", area: "Denpasar Selatan", rating: 4.8, reviews: 126, meter: 1200, price: 85000, minutes: 60, mode: "SCHEDULED", icon: AirVent },
  { id: "l2", title: "Bersih rumah tipe 36", provider: "Resik Bali Cleaning", area: "Kuta", rating: 4.7, reviews: 89, meter: 3400, price: 150000, minutes: 180, mode: "SCHEDULED", icon: Sparkles },
  { id: "l3", title: "Perbaikan pipa bocor", provider: "Tukang Ledeng Sanur", area: "Sanur", rating: 4.9, reviews: 41, meter: 850, price: 75000, minutes: 60, mode: "AVAILABLE_NOW", icon: Droplets },
]

export type OrderSample = {
  number: string
  title: string
  provider: string
  status: OrderStatus
  mode: Mode
  at: string
  amount: number
  assignee: string | null
  note: string
}

export const ORDERS: OrderSample[] = [
  { number: "ORD-20261121-0014", title: "Bersih rumah tipe 36", provider: "Resik Bali Cleaning", status: "PENDING_ACCEPTANCE", mode: "SCHEDULED", at: "2026-11-22T01:00:00.000Z", amount: 150000, assignee: null, note: "Menunggu usaha menerima pesananmu" },
  { number: "ORD-20261121-0009", title: "Perbaikan pipa bocor", provider: "Tukang Ledeng Sanur", status: "IN_PROGRESS", mode: "AVAILABLE_NOW", at: "2026-11-21T05:40:00.000Z", amount: 110000, assignee: "Komang Arta", note: "Penanggung jawab sedang bekerja di lokasimu" },
  { number: "ORD-20261118-0031", title: "Servis AC split 1/2 sampai 1 PK", provider: "Dingin Jaya Teknik", status: "COMPLETED", mode: "SCHEDULED", at: "2026-11-18T06:00:00.000Z", amount: 135000, assignee: "Made Wirawan", note: "Beri ulasan untuk pesanan ini" },
  { number: "ORD-20261115-0022", title: "Perawatan taman 100 m²", provider: "Taman Asri Ubud", status: "DISPUTED", mode: "SCHEDULED", at: "2026-11-15T00:30:00.000Z", amount: 200000, assignee: "Wayan Sudarma", note: "Admin sedang meninjau komplainmu" },
]

// D254: kartu compact memakai ListingCard asli dari components/shared, jadi datanya berbentuk respons API.
// Tanpa foto, supaya placeholder ImageOff tampil seperti jasa yang belum punya foto.
export const COMPACT_LISTINGS: ListingCardData[] = [
  {
    id: "ds-compact-1",
    title: "Servis AC Split dan Isi Freon untuk Rumah dan Kantor",
    price: 150000,
    price_unit: "PER_JOB",
    estimated_duration_minutes: 90,
    supports_scheduled: true,
    supports_available_now: true,
    rating_average: 4.8,
    rating_count: 37,
    order_count: 52,
    subcategory: { id: "ds-sub-ac", name: "Servis AC" },
    provider: { id: "ds-prov-1", business_name: "Sejuk Jaya Teknik", rating_average: 4.8, rating_count: 37 },
    primary_photo_url: null,
    distance_km: 1.2,
  },
  {
    id: "ds-compact-2",
    title: "Perbaikan Pipa Bocor",
    price: 85000,
    price_unit: "PER_JOB",
    estimated_duration_minutes: 60,
    supports_scheduled: true,
    supports_available_now: false,
    rating_average: 0,
    rating_count: 0,
    order_count: 0,
    subcategory: { id: "ds-sub-ledeng", name: "Ledeng" },
    provider: { id: "ds-prov-2", business_name: "Tukang Ledeng Sanur", rating_average: 0, rating_count: 0 },
    primary_photo_url: null,
    distance_km: null,
  },
]
