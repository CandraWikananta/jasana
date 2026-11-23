import { notFound } from "next/navigation"
import { findNavItem, navSlugs } from "@/components/layout/nav-items"
import { PlaceholderPage } from "@/components/shared/placeholder-page"

// Penampung sementara supaya navigasi bawah tidak 404. Rute yang lebih spesifik menang begitu dibuat.
// Judul dan ikon diambil dari menu; slug di luar menu tetap 404.
export function generateStaticParams() {
  return navSlugs("pekerja")
}

export default async function PekerjaPlaceholder({ params }: PageProps<"/pekerja/[...slug]">) {
  const item = findNavItem("pekerja", (await params).slug)
  if (!item) notFound()
  return <PlaceholderPage title={item.label} icon={item.icon} />
}
