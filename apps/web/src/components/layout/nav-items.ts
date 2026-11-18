import {
  ArrowRightLeft,
  Bell,
  Briefcase,
  ChartColumn,
  ClipboardList,
  Gavel,
  House,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  ListChecks,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Tags,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react"

// Menu tiap area (PRD Frontend 4.1 dan 4.2). `exact` untuk akar area, supaya Beranda tidak ikut
// menyala di halaman anaknya.
export interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

export function isActive(item: NavItem, pathname: string): boolean {
  return pathname === item.href || (!item.exact && pathname.startsWith(`${item.href}/`))
}

export const PELANGGAN_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: House, exact: true },
  { href: "/cari", label: "Cari", icon: Search },
  { href: "/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/notifikasi", label: "Notifikasi", icon: Bell },
  { href: "/akun", label: "Akun", icon: UserRound },
]

export const PEKERJA_NAV: NavItem[] = [
  { href: "/pekerja", label: "Beranda", icon: House, exact: true },
  { href: "/pekerja/tugas", label: "Tugas", icon: ListChecks },
  { href: "/pekerja/profil", label: "Profil", icon: UserRound },
]

export const USAHA_NAV: NavItem[] = [
  { href: "/usaha", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/usaha/pesanan", label: "Pesanan", icon: ClipboardList },
  { href: "/usaha/jasa", label: "Jasa saya", icon: Briefcase },
  { href: "/usaha/pekerja", label: "Pekerja", icon: Users },
  { href: "/usaha/saldo", label: "Saldo", icon: Wallet },
  { href: "/usaha/usulan", label: "Usulan", icon: Lightbulb },
  { href: "/usaha/profil", label: "Profil usaha", icon: Store },
]

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Ringkasan", icon: LayoutDashboard, exact: true },
  { href: "/admin/penyedia", label: "Penyedia", icon: ShieldCheck },
  { href: "/admin/perubahan-tipe", label: "Perubahan tipe", icon: ArrowRightLeft },
  { href: "/admin/katalog", label: "Katalog", icon: Tags },
  { href: "/admin/usulan", label: "Usulan", icon: Lightbulb },
  { href: "/admin/pencairan", label: "Pencairan", icon: Landmark },
  { href: "/admin/komplain", label: "Komplain", icon: Gavel },
  { href: "/admin/laporan", label: "Laporan", icon: ChartColumn },
  { href: "/admin/pengaturan", label: "Pengaturan", icon: Settings },
]

// Layout area adalah Server Component, dan komponen ikon tidak bisa dikirim ke Client Component.
// Karena itu layout mengirim nama area, lalu komponen navigasi mengambil menunya di sini.
export const NAV = { pelanggan: PELANGGAN_NAV, pekerja: PEKERJA_NAV, usaha: USAHA_NAV, admin: ADMIN_NAV } as const
export type NavName = keyof typeof NAV
