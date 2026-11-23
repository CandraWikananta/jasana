import { AreaGate } from "@/components/layout/area-gate"
import { BottomNav } from "@/components/layout/bottom-nav"
import { SiteHeader } from "@/components/layout/site-header"

// Area pelanggan (PRD Frontend 4.1): header publik, navigasi bawah hanya di HP.
export default function PelangganLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="konten" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-nav-safe outline-none md:px-6 md:pb-10">
        <AreaGate area="pelanggan">{children}</AreaGate>
      </main>
      <BottomNav nav="pelanggan" className="md:hidden" />
    </div>
  )
}
