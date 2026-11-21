// ListingCard (6.2) dan kartu pesanan. Kartu bergaris 1 px --border tanpa bayangan (Bagian 4).
// Foto listing berupa placeholder ikon karena peraga tidak memakai foto asli.
import { MapPin, Timer } from "lucide-react"
import { formatDurasi, formatJarak, formatRupiah } from "@/lib/format"
import { formatTanggalJam } from "@/lib/time"
import type { ListingSample, OrderSample } from "../data"
import { Catatan, LINK_CLASS, ModeBadge, RatingText, StatusBadge } from "./markers"

export function ListingCard({ l }: { l: ListingSample }) {
  const Icon = l.icon
  return (
    <article className="relative flex flex-col overflow-hidden rounded-lg border border-border bg-card has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-background">
      <div className="flex aspect-4/3 items-center justify-center bg-muted text-muted-foreground">
        <Icon aria-hidden className="size-8" />
        <span className="sr-only">Foto jasa</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-lg leading-6.5 font-semibold">
            <a href="#listing" className="outline-none after:absolute after:inset-0">
              {l.title}
            </a>
          </h3>
          <p className="text-sm text-muted-foreground">
            {l.provider} · {l.area}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <RatingText rating={l.rating} reviews={l.reviews} />
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin aria-hidden className="size-4" />
            {formatJarak(l.meter)}
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Timer aria-hidden className="size-4" />
            {formatDurasi(l.minutes)}
          </span>
        </div>
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <p className="text-sm text-muted-foreground">
            Mulai <span className="text-base font-semibold text-foreground tabular-nums">{formatRupiah(l.price)}</span>
          </p>
          <ModeBadge mode={l.mode} />
        </div>
      </div>
    </article>
  )
}

export function OrderCard({ o }: { o: OrderSample }) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusBadge status={o.status} />
        <ModeBadge mode={o.mode} />
      </div>
      <div className="flex flex-col gap-0.5">
        <h3 className="text-lg leading-6.5 font-semibold">{o.title}</h3>
        <p className="text-sm text-muted-foreground">{o.provider}</p>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground">{o.mode === "SCHEDULED" ? "Jadwal" : "Dipesan"}</dt>
          <dd>{formatTanggalJam(o.at)}</dd>
        </div>
        <div className="flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground">Total</dt>
          <dd className="font-semibold tabular-nums">{formatRupiah(o.amount)}</dd>
        </div>
        <div className="col-span-2 flex flex-col">
          <dt className="text-xs font-medium text-muted-foreground">Penanggung jawab</dt>
          <dd>{o.assignee ?? "Belum ditentukan"}</dd>
        </div>
      </dl>
      <p className="text-sm text-muted-foreground">{o.note}</p>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <span className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">{o.number}</span>
          <Catatan id="A16" />
        </span>
        <a href="#pesanan" className={LINK_CLASS + " text-sm"}>
          Lihat detail
        </a>
      </div>
    </article>
  )
}
