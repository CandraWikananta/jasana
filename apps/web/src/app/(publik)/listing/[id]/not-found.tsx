import { NotFoundView } from "@/components/shared/not-found-view"

export default function ListingNotFound() {
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6">
      <NotFoundView title="Jasa tidak ditemukan" description="Jasa ini tidak ada, atau sudah tidak tayang." />
    </div>
  )
}
