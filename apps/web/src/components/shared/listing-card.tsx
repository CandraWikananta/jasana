import Image from "next/image"
import Link from "next/link"
import { ImageOff, MapPin, Star } from "lucide-react"
import { ModeBadge } from "@/components/shared/mode-badge"
import { MoneyText } from "@/components/shared/money-text"
import { Skeleton } from "@/components/ui/skeleton"
import { formatJarak, formatRating } from "@/lib/format"
import type { ListingCard as ListingCardData } from "@/types/api/listing"

// Design System 6.2: foto 4:3, judul, nama usaha, rating, "Mulai Rp...", jarak, dan ModeBadge hanya untuk
// mode Sekarang. Terjadwal adalah mode bawaan, badge yang diulang di setiap kartu tidak menambah informasi (D246).
//
// Varian `compact` (D254): baris horizontal, foto 112 px di kiri, selama wadah @container terdekat lebih sempit dari
// @xl (36rem); mulai @xl kembali ke bentuk biasa. Satu DOM yang diatur CSS, bukan dua kartu atau media query di
// JavaScript, supaya server dan browser menghasilkan tampilan yang sama (tanpa kilasan dan pergeseran) dan foto
// hanya terunduh sekali. Pemakainya wajib membungkus daftar dengan `@container`.
//
// `actions` (usulan D266, rekomendasi Asisten): badan kartu dan baris aksi bersaudara, jadi tidak ada elemen interaktif
// di dalam tautan. Harga pindah ke baris aksi dan jarak tampil juga di compact. Tautan badan tidak ikut urutan Tab,
// karena tombol Lihat di baris aksi menuju halaman yang sama.
type Variant = "default" | "compact"

const STYLE = {
  default: {
    link: "flex-col",
    photo: "w-full",
    body: "gap-2 p-4",
    title: "text-h3",
    distance: "flex",
    price: "text-base",
  },
  compact: {
    link: "gap-3 p-3 @xl:flex-col @xl:gap-0 @xl:p-0",
    photo: "w-28 shrink-0 self-start rounded-md @xl:w-full @xl:self-auto @xl:rounded-none",
    body: "gap-1 @xl:gap-2 @xl:p-4",
    title: "text-base @xl:text-h3",
    // DS 6.2: kartu compact hanya memuat rating dan harga.
    distance: "hidden @xl:flex",
    price: "text-sm @xl:text-base",
  },
} as const

const SIZES = {
  default: "(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw",
  compact: "(min-width: 640px) 368px, 112px",
} as const

const FRAME = "overflow-hidden rounded-lg border border-border bg-card text-card-foreground"

/** `eager` untuk kartu di atas lipatan, supaya fotonya tidak menunggu lazy load (LCP). */
export function ListingCard({
  listing,
  eager = false,
  variant = "default",
  actions,
}: {
  listing: ListingCardData
  eager?: boolean
  variant?: Variant
  actions?: React.ReactNode
}) {
  const { provider } = listing
  const s = STYLE[variant]
  const href = `/listing/${listing.id}`
  const price = (
    <p className="text-sm text-muted-foreground">
      Mulai <MoneyText amount={listing.price} className={`font-semibold text-foreground ${s.price}`} />
    </p>
  )
  const nowBadge = listing.supports_available_now && <ModeBadge mode="AVAILABLE_NOW" />

  const body = (
    <>
      <div className={`relative aspect-4/3 overflow-hidden bg-muted ${s.photo}`}>
        {listing.primary_photo_url ? (
          <Image
            src={listing.primary_photo_url}
            alt=""
            fill
            loading={eager ? "eager" : "lazy"}
            sizes={SIZES[variant]}
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff aria-hidden className="size-6" />
          </div>
        )}
      </div>

      <div className={`flex min-w-0 flex-1 flex-col ${s.body}`}>
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className={`line-clamp-2 font-semibold group-hover:underline ${s.title}`}>{listing.title}</h3>
          {/* business_name null untuk INDIVIDUAL tanpa nama usaha; kartu belum membawa display_name. */}
          {provider.business_name && <p className="truncate text-sm text-muted-foreground">{provider.business_name}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {listing.rating_count > 0 ? (
            <span className="flex items-center gap-1">
              <Star aria-hidden className="size-4 fill-rating text-rating-stroke" />
              <span className="font-semibold tabular-nums">{formatRating(listing.rating_average)}</span>
              <span className="text-muted-foreground tabular-nums">({listing.rating_count})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Belum ada ulasan</span>
          )}
          {listing.distance_km !== null && (
            <span className={`items-center gap-1 text-muted-foreground ${actions ? "flex" : s.distance}`}>
              <MapPin aria-hidden className="size-4" />
              {/* API memberi km, formatJarak menerima meter (DS 8). */}
              {formatJarak(listing.distance_km * 1000)}
            </span>
          )}
          {actions && nowBadge}
        </div>

        {!actions && (
          <div className="mt-auto flex min-h-7 flex-wrap items-end justify-between gap-2 pt-1">
            {price}
            {nowBadge}
          </div>
        )}
      </div>
    </>
  )

  if (actions) {
    return (
      <article className={FRAME}>
        <Link href={href} tabIndex={-1} className={`group flex outline-none ${s.link}`}>
          {body}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-border px-3 py-2">
          {price}
          <div className="ml-auto flex gap-2">{actions}</div>
        </div>
      </article>
    )
  }
  return (
    <Link
      href={href}
      className={`group flex ${FRAME} outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${s.link}`}
    >
      {body}
    </Link>
  )
}

/** Kerangka sebentuk kartu, varian dan aturan @container yang sama dengan `ListingCard`. */
export function ListingCardSkeleton({ variant = "default", actions = false }: { variant?: Variant; actions?: boolean }) {
  const s = STYLE[variant]
  const body = (
    <div className={`flex ${actions ? "" : FRAME} ${s.link}`}>
      <Skeleton className={`aspect-4/3 rounded-none ${s.photo}`} />
      <div className={`flex min-w-0 flex-1 flex-col ${s.body}`}>
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        {!actions && (
          <div className="flex justify-between pt-1">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-7 w-24 rounded-full" />
          </div>
        )}
      </div>
    </div>
  )
  if (!actions) return body
  return (
    <div className={FRAME}>
      {body}
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  )
}
