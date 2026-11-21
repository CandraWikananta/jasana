// Data contoh realistis untuk peraga: jasa di Bali, rupiah integer, waktu ISO UTC yang tampil WITA.
import type { OrderStatus } from "@jasana/shared"
import { AirVent, Droplets, Leaf, Plug, Sparkles, Wrench, type LucideIcon } from "lucide-react"

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

export type Finding = { id: string; section: string; text: string; rendered: string }

// Temuan dari membaca DS v2.0 dan menghitung kontras. Nomornya tetap dan dipakai ulang di tabel Tahap 2.
export const FINDINGS: Finding[] = [
  { id: "A1", section: "1.5", text: "Putih di atas --success: hitungan halaman berbeda dengan dokumen (5,52:1).", rendered: "Nilai token dipakai apa adanya. Lihat tabel kontras." },
  { id: "A2", section: "1.5", text: "--success-subtle-foreground di atas --success-subtle: hitungan halaman berbeda dengan dokumen (6,5:1).", rendered: "Nilai token dipakai apa adanya. Lihat tabel kontras." },
  { id: "A3", section: "1.5", text: "Baris \"teks subtle semantik lain 6,49 sampai 9,42:1\": 6,49 adalah rasio pasangan brand-subtle, bukan salah satu nada semantik. Hitungan destructive, info, dan neutral ada di tabel.", rendered: "Dilaporkan saja." },
  { id: "A4", section: "1.5", text: "Beberapa rasio di dokumen berselisih 0,01 dengan hitungan halaman. Kelihatannya dokumen memotong desimal, bukan membulatkan.", rendered: "Ditandai \"selisih pembulatan\" di tabel." },
  { id: "A5", section: "1.3, 1.3b, 6.2", text: "Warna angka hitung mundur: 1.3 menyebut --brand-strong untuk \"angka hitung mundur bernada Sekarang\", sedangkan 1.3b dan 6.2 menyebut angka hitam (--foreground).", rendered: "Hitam, mengikuti spesifikasi komponen Countdown dan OfferCard." },
  { id: "A6", section: "1.3b, 4", text: "OfferCard memakai \"bayangan tipis\" (1.3b), padahal Bagian 4 menyebut kartu tanpa bayangan dan bayangan hanya untuk elemen melayang.", rendered: "shadow-sm, mengikuti 1.3b." },
  { id: "A7", section: "1.3, 6.4", text: "Opsi terpilih (garis 2 px --brand) dan input kode yang sedang diisi berbenturan dengan aturan 1.3: --brand tidak pernah jadi garis tipis di atas latar terang.", rendered: "Garis 2 px --brand, mengikuti 6.4." },
  { id: "A8", section: "6.4", text: "Item aktif navigasi bawah: paragraf 6.4 menyebut pill di sekitar ikon, tabel intensitas menyebut radius 10 px.", rendered: "Pill (rounded-full) di sekitar ikon." },
  { id: "A9", section: "2, 1.3b, 6.1, 6.4", text: "Badge: teks caption berbobot 500 (Bagian 2) atau \"tebal\" (1.3b dan 6.1). Tinggi ditulis sebagai rentang 24 sampai 28 px.", rendered: "28 px, bobot 600, sama dengan komponen sekarang." },
  { id: "A10", section: "6.4", text: "Hover dan ditekan untuk varian secondary, ghost, dan destructive tidak diatur. Warna thumb switch juga tidak diatur.", rendered: "Dibawa dari v1.6: brightness-95, --accent, destructive/90. Thumb --card." },
  { id: "A11", section: "6.4", text: "Lencana angka di tab aktif tidak diatur. Lencana pucat untuk keadaan biasa, dan lencana --primary hanya disebut untuk menu sidebar aktif.", rendered: "Mengikuti menu aktif: latar --primary, teks putih." },
  { id: "A12", section: "6.1, 6.4", text: "Input: lebar cincin fokus tidak disebut (hanya \"cincin --ring\"), dan warna garis input error tidak disebut di v2.0.", rendered: "Cincin 2 px berjarak 2 px (1.2). Garis error --destructive dibawa dari v1.6." },
  { id: "A13", section: "6.4, 14", text: "Header publik: tautan menu aktif --brand-strong (Bagian 14), sedangkan 6.4 menetapkan navigasi aktif solid --brand.", rendered: "Teks --brand-strong tebal, mengikuti Bagian 14 untuk header publik." },
  { id: "A14", section: "6.1, 6.4", text: "Tombol outline nonaktif: 6.1 menyebut latar --muted untuk semua tombol nonaktif, tabel 6.4 hanya menyebut garis --border dan teks --disabled-foreground.", rendered: "Latar --card, mengikuti tabel 6.4." },
  { id: "A15", section: "6.4", text: "Chip filter yang tidak aktif tidak diatur. Yang diatur hanya chip aktif (pucat dengan ikon Check).", rendered: "Latar --card, garis --input (batas komponen 1.5), teks --foreground 500." },
  { id: "A16", section: "2, 8", text: "Nomor pesanan: Bagian 2 menyebut huruf monospace, Bagian 8 menyebut \"apa adanya, tabular-nums\".", rendered: "Plus Jakarta Sans dengan tabular-nums." },
  { id: "A17", section: "apps/web/CLAUDE.md", text: "apps/web/CLAUDE.md mewajibkan branch feat/frontend, sedangkan sesi ini berjalan di feat/frontend-v2.", rendered: "Mengikuti brief sesi (feat/frontend-v2)." },
  { id: "A18", section: "6.1, 11", text: "Tabs tidak menyebut tinggi. Bagian 11 mensyaratkan area sentuh minimal 44 px, sedangkan daftar tab sekarang 36 px.", rendered: "Daftar tab 44 px." },
  { id: "A19", section: "1.3, 1.4c", text: "Penanda grafis di bawah 3:1 terhadap putih: --brand (garis tepi kiri, titik live, garis badge Sekarang) dan garis bintang --rating-stroke. Dokumen membenarkannya karena makna dibawa teks di sebelahnya, tapi tabel 1.5 tidak mencantumkannya.", rendered: "Sesuai dokumen. Tercantum di tabel kontras." },
  { id: "A20", section: "1.3b, 6.4, 11", text: "Switch menyala: trek --brand hanya 2,28:1 terhadap kartu putih, dan thumb putih di atasnya juga 2,28:1. WCAG 1.4.11 mensyaratkan 3:1 untuk komponen UI. Keadaan mati punya garis --input 3,40:1.", rendered: "Sesuai dokumen (switch menyala solid --brand). Tercantum di tabel kontras." },
]
