import Image from "next/image"
import Link from "next/link"
import { ImageOff, MapPin, Star } from "lucide-react"
import { ModeBadge } from "@/components/shared/mode-badge"
import { MoneyText } from "@/components/shared/money-text"
import { Skeleton } from "@/components/ui/skeleton"
import { formatJarak, formatRating } from "@/lib/format"
import type { ListingCard as ListingCardData } from "@/types/api/listing"

// Design System 6.2: foto 4:3, judul, nama usaha, rating, "Mulai Rp...", jarak, ModeBadge.
/** `eager` untuk kartu di atas lipatan, supaya fotonya tidak menunggu lazy load (LCP). */
export function ListingCard({ listing, eager = false }: { listing: ListingCardData; eager?: boolean }) {
  const { provider } = listing
  return (
    <Link
      href={`/listing/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="relative aspect-4/3 bg-muted">
        {listing.primary_photo_url ? (
          <Image
            src={listing.primary_photo_url}
            alt=""
            fill
            loading={eager ? "eager" : "lazy"}
            sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <ImageOff aria-hidden className="size-6" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="line-clamp-2 text-lg leading-6.5 font-semibold group-hover:underline">{listing.title}</h3>
          {/* business_name null untuk INDIVIDUAL tanpa nama usaha; kartu belum membawa display_name. */}
          {provider.business_name && <p className="truncate text-sm text-muted-foreground">{provider.business_name}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {listing.rating_count > 0 ? (
            <span className="flex items-center gap-1">
              <Star aria-hidden className="size-4 fill-foreground" />
              <span className="font-semibold tabular-nums">{formatRating(listing.rating_average)}</span>
              <span className="text-muted-foreground tabular-nums">({listing.rating_count})</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Belum ada ulasan</span>
          )}
          {listing.distance_km !== null && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin aria-hidden className="size-4" />
              {/* API memberi km, formatJarak menerima meter (DS 8). */}
              {formatJarak(listing.distance_km * 1000)}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <p className="text-sm text-muted-foreground">
            Mulai <MoneyText amount={listing.price} className="text-base font-semibold text-foreground" />
          </p>
          <div className="flex flex-wrap gap-1.5">
            {listing.supports_available_now && <ModeBadge mode="AVAILABLE_NOW" />}
            {listing.supports_scheduled && <ModeBadge mode="SCHEDULED" />}
          </div>
        </div>
      </div>
    </Link>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-7 w-24 rounded-full" />
        </div>
      </div>
    </div>
  )
}
