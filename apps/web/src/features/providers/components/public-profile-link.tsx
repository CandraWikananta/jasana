"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useMe } from "@/features/auth/queries"

// Aksi empty state beranda usaha: profil publik hanya ada untuk usaha VERIFIED (GET /providers/:id).
export function PublicProfileLink() {
  const { data: me } = useMe()
  if (me?.provider?.verification_status !== "VERIFIED") return null
  return (
    <Button asChild variant="outline">
      <Link href={`/penyedia/${me.provider.id}`}>Lihat profil publik</Link>
    </Button>
  )
}
