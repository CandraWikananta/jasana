import Link from "next/link"
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
          <Link
            href="/"
            className="rounded-sm text-2xl font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Jasana
          </Link>
          <span className="text-sm font-semibold text-muted-foreground">Pekerja</span>
          <HeaderAccount />
        </div>
      </header>
      <EmailVerificationBanner />
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-24">
        <AreaGate area="pekerja">{children}</AreaGate>
      </main>
      <BottomNav nav="pekerja" />
    </div>
  )
}
