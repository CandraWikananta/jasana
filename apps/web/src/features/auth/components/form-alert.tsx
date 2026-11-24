import { CircleCheck, CircleX, Info, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

// Banner status DS 1.4b di halaman autentikasi. Tanpa judul: ringkasan galat di atas formulir (bentuk
// ringkas yang sudah dipakai /masuk). Dengan judul: hasil sebuah langkah (link terverifikasi, kata
// sandi diganti), bentuk penuh seperti StatusBanner di /dev/ds. Bisa difokus (tabIndex -1) supaya
// fokus pindah ke sini setelah kirim, bukan jatuh ke body.
type Tone = "success" | "info" | "destructive"

const TONE: Record<Tone, { box: string; chip: string; title: string; body: string; icon: LucideIcon }> = {
  success: {
    box: "border-success-border bg-success-surface",
    chip: "bg-success-border text-success",
    title: "text-success-title",
    body: "text-success-subtle-foreground",
    icon: CircleCheck,
  },
  info: {
    box: "border-info-border bg-info-surface",
    chip: "bg-info-border text-info",
    title: "text-info-title",
    body: "text-info-subtle-foreground",
    icon: Info,
  },
  destructive: {
    box: "border-destructive-border bg-destructive-surface",
    chip: "bg-destructive-border text-destructive",
    title: "text-destructive-title",
    body: "text-destructive-subtle-foreground",
    icon: CircleX,
  },
}

export function FormAlert({
  tone,
  title,
  children,
  id,
  ref,
}: {
  tone: Tone
  title?: React.ReactNode
  children: React.ReactNode
  id?: string
  ref?: React.Ref<HTMLDivElement>
}) {
  const t = TONE[tone]
  const Icon = t.icon
  return (
    <div
      id={id}
      ref={ref}
      tabIndex={-1}
      // Galat diumumkan segera, hasil berhasil cukup sopan.
      role={tone === "destructive" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 border outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
        title ? "rounded-lg p-4" : "rounded-md p-3",
        t.box,
      )}
    >
      <span
        className={cn("flex shrink-0 items-center justify-center rounded-full", title ? "size-9" : "size-7", t.chip)}
      >
        <Icon aria-hidden className={title ? "size-5" : "size-4"} />
      </span>
      {title ? (
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className={cn("text-base font-semibold", t.title)}>{title}</p>
          <div className={cn("text-sm text-pretty", t.body)}>{children}</div>
        </div>
      ) : (
        <p className={cn("pt-1 text-sm", t.body)}>{children}</p>
      )}
    </div>
  )
}
