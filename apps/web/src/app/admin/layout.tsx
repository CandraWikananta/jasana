import { AreaGate } from "@/components/layout/area-gate"
import { SidebarShell } from "@/components/layout/sidebar-shell"

// Area admin (PRD Frontend 4.1): users.role = ADMIN. Desktop-first.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <SidebarShell areaLabel="Panel admin" nav="admin">
      <AreaGate area="admin">{children}</AreaGate>
    </SidebarShell>
  )
}
