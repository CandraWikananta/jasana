import { BottomNav } from "@/components/layout/bottom-nav"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export default function PublikLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="konten" tabIndex={-1} className="flex-1 outline-none">{children}</main>
      <SiteFooter />
      {/* Pelanggan yang login di HP tetap melihat navigasi bawah di Beranda dan Cari (PRD Frontend 4.1). */}
      <BottomNav nav="pelanggan" publicPages className="md:hidden" />
    </div>
  )
}
