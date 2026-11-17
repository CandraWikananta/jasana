"use client"

import { useEffect } from "react"
import { ErrorState } from "@/components/shared/error-state"

// State error halaman publik yang datanya diambil di server. Header dan footer (layout) tetap tampil.
// Di produksi pesan error server disamarkan Next, jadi teksnya umum.
export default function PublikError({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <ErrorState
        title="Halaman gagal dimuat"
        message="Layanan sedang tidak bisa dihubungi. Coba lagi beberapa saat."
        onRetry={retry}
      />
    </div>
  )
}
