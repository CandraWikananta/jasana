"use client"

import { useEffect, useState } from "react"
import { useMe } from "@/features/auth/queries"
import { EmailSection } from "./email-section"
import { PasswordSection } from "./password-section"
import { SessionsSection } from "./sessions-section"

export function SecurityView() {
  // Link konfirmasi email biasanya dibuka di tab lain. Saat kembali ke sini, banner "Menunggu
  // konfirmasi" harus sesuai kenyataan (D64).
  const { data: me } = useMe({ refetchOnWindowFocus: "always" })
  // Satu formulir terbuka, supaya paling banyak satu tombol primary di layar (DS P2).
  const [open, setOpen] = useState<"email" | "password" | null>(null)
  // Next menyimpan halaman yang ditinggalkan tetap terpasang tapi tersembunyi (Cache Components).
  // Formulir ditutup supaya kata sandi yang sudah diketik tidak tertinggal di DOM.
  useEffect(() => () => setOpen(null), [])
  if (!me) return null

  return (
    <div className="flex flex-col gap-8 lg:gap-10">
      <EmailSection me={me} open={open === "email"} onOpenChange={(next) => setOpen(next ? "email" : null)} />
      <PasswordSection me={me} open={open === "password"} onOpenChange={(next) => setOpen(next ? "password" : null)} />
      <SessionsSection />
    </div>
  )
}
