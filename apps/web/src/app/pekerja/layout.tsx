import { BrandLogo } from "@/components/layout/brand-logo"
import { AreaGate } from "@/components/layout/area-gate"
import { BottomNav } from "@/components/layout/bottom-nav"
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner"
import { HeaderAccount } from "@/components/layout/header-account"

// Area pekerja (PRD Frontend 4.1): mobile-only. Di layar lebar tetap satu kolom sempit
// dengan navigasi bawah, cukup terbaca (Design System 3).
export default function PekerjaLayout({ children }: LayoutProps<"/pekerja">) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
        <div className="mx-auto flex h-16 max-w-md items-center gap-3 px-4">
          <BrandLogo href="/" />
          <span className="text-sm font-semibold text-muted-foreground">Pekerja</span>
          <HeaderAccount />
        </div>
      </header>
      <EmailVerificationBanner />
      <main id="konten" tabIndex={-1} className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-24 outline-none">
        <AreaGate area="pekerja">{children}</AreaGate>
      </main>
      <BottomNav nav="pekerja" />
    </div>
  )
}
