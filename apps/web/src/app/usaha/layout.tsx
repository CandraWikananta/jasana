import { AreaGate } from "@/components/layout/area-gate"
import { SidebarShell } from "@/components/layout/sidebar-shell"

// Area usaha (PRD Frontend 4.1): pemilik provider apa pun statusnya, termasuk yang masih mendaftar.
// Catatan W4: /usaha/daftar untuk akun yang BELUM punya profil, jadi nanti harus keluar dari gate ini.
export default function UsahaLayout({ children }: LayoutProps<"/usaha">) {
  return (
    <SidebarShell areaLabel="Usaha saya" nav="usaha">
      <AreaGate area="usaha">{children}</AreaGate>
    </SidebarShell>
  )
}
