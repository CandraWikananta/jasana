"use client"

import { useQueries } from "@tanstack/react-query"
import Link from "next/link"
import { useRef, useState } from "react"
import { flushSync } from "react-dom"
import { ListingCard, ListingCardSkeleton } from "@/components/shared/listing-card"
import { Button } from "@/components/ui/button"
import { getListing } from "@/features/listings/api"
import { isNotFound } from "@/lib/api-client"
import { qk } from "@/lib/query-keys"
import type { ListingCard as ListingCardData } from "@/types/api/listing"
import { toListingCard } from "../conversation"

/** Jumlah kartu sebelum "Tampilkan N jasa lainnya" (usulan D266). */
const INITIAL_CARDS = 3

// @container max-w-lg (32rem) selalu di bawah @xl, jadi kartu tetap compact di semua lebar layar.
const LIST_CLASS = "@container flex w-full max-w-lg flex-col gap-3"

/** Rekomendasi dalam satu jawaban. `cards` dari respons kirim; percakapan lama hanya punya id. */
export function RecommendationList({
  ids,
  cards,
  autoLoad,
}: {
  ids: string[]
  cards?: ListingCardData[]
  autoLoad: boolean
}) {
  return cards ? <Cards cards={cards} /> : <RestoredCards ids={ids} autoLoad={autoLoad} />
}

function Cards({ cards }: { cards: ListingCardData[] }) {
  const [expanded, setExpanded] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const hidden = expanded ? 0 : Math.max(0, cards.length - INITIAL_CARDS)

  function expand() {
    flushSync(() => setExpanded(true))
    // Tombolnya hilang, jadi fokus pindah ke kartu pertama yang baru tampil.
    listRef.current?.querySelectorAll<HTMLElement>("[data-lihat]")[INITIAL_CARDS]?.focus()
  }

  return (
    <div ref={listRef} className={LIST_CLASS}>
      {cards.slice(0, cards.length - hidden).map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          variant="compact"
          actions={
            <>
              <Button asChild variant="ghost">
                <Link href={`/listing/${listing.id}`} data-lihat>
                  Lihat<span className="sr-only"> {listing.title}</span>
                </Link>
              </Button>
              <Button asChild variant="outline">
                {/* TODO W3: /pesan/[listingId] belum ada. Tamu dialihkan proxy.ts ke /masuk?next=. */}
                <Link href={`/pesan/${listing.id}`} prefetch={false}>
                  Pesan<span className="sr-only"> {listing.title}</span>
                </Link>
              </Button>
            </>
          }
        />
      ))}
      {hidden > 0 && (
        <Button variant="outline" className="self-start" onClick={expand}>
          Tampilkan {hidden} jasa lainnya
        </Button>
      )}
    </div>
  )
}

/**
 * Riwayat pesan dari server tidak membawa kartu (calon H153), jadi tiap jasa diambil dari halaman
 * detailnya. Jawaban terakhir otomatis, sisanya menunggu ketukan supaya percakapan panjang tidak
 * menghabiskan batas permintaan.
 */
function RestoredCards({ ids, autoLoad }: { ids: string[]; autoLoad: boolean }) {
  const [open, setOpen] = useState(autoLoad)
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: qk.listings.card(id),
      queryFn: async () => toListingCard((await getListing(id)).data),
      enabled: open,
    })),
  })

  if (!open) {
    return (
      <Button variant="outline" className="self-start" onClick={() => setOpen(true)}>
        Tampilkan {ids.length} jasa
      </Button>
    )
  }
  if (results.some((r) => r.isPending)) {
    return (
      <div className={LIST_CLASS} aria-busy="true" aria-label="Memuat jasa">
        {ids.slice(0, INITIAL_CARDS).map((id) => (
          <ListingCardSkeleton key={id} variant="compact" actions />
        ))}
      </div>
    )
  }

  const cards = results.flatMap((r) => (r.data ? [r.data] : []))
  const gone = results.filter((r) => isNotFound(r.error)).length
  const failed = results.filter((r) => r.isError && !isNotFound(r.error))
  return (
    <div className="flex flex-col gap-3">
      {cards.length > 0 && <Cards cards={cards} />}
      {gone > 0 && <p className="text-sm text-muted-foreground">{gone} jasa sudah tidak tersedia.</p>}
      {failed.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          {failed.length} jasa gagal dimuat.
          <Button variant="ghost" onClick={() => failed.forEach((r) => void r.refetch())}>
            Coba lagi
          </Button>
        </div>
      )}
    </div>
  )
}
