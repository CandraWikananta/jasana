import { NotFoundView } from "@/components/shared/not-found-view"

export default function PenyediaNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      <NotFoundView title="Penyedia tidak ditemukan" description="Penyedia ini tidak ada, atau belum terverifikasi." />
    </div>
  )
}
