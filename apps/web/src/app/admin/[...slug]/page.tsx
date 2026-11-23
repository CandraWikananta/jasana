import { notFound } from "next/navigation"
import { findNavItem, navSlugs } from "@/components/layout/nav-items"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

// Penampung sementara supaya menu sidebar tidak 404. Rute yang lebih spesifik menang begitu dibuat.
// Judul dan ikon diambil dari menu; slug di luar menu tetap 404.
export function generateStaticParams() {
  return navSlugs("admin")
}

export default async function AdminPlaceholder({ params }: PageProps<"/admin/[...slug]">) {
  const item = findNavItem("admin", (await params).slug)
  if (!item) notFound()
  return <PlaceholderPage title={item.label} icon={item.icon} />
}
