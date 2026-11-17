import type { Metadata } from "next"
import { NotFoundView } from "@/components/shared/not-found-view"

// 404 global untuk URL yang tidak punya rute (misalnya /masuk dan /asisten sebelum W1 dan W8).
export const metadata: Metadata = { title: "Halaman tidak ditemukan" }

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 md:px-6">
      <NotFoundView />
    </main>
  )
}
