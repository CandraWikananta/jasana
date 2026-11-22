import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Logo D251 (DS 5): ikon J diikuti teks "Jasana". Ikon dekoratif, nama dibawa teks yang tidak
// diterjemahkan otomatis. SVG tidak diwarnai ulang lewat CSS, dan `unoptimized` karena SVG tidak
// perlu diproses optimizer.
const SIZE = {
  header: { icon: "h-7 w-auto", text: "text-logo" },
  footer: { icon: "h-5 w-auto", text: "text-h3" },
} as const

export function BrandLogo({ size = "header", href }: { size?: keyof typeof SIZE; href?: string }) {
  const s = SIZE[size]
  const content = (
    <>
      <Image src="/brand/jasana-mark.svg" alt="" width={1314} height={1591} unoptimized className={s.icon} />
      <span translate="no" className={cn(s.text, "font-bold text-foreground")}>
        Jasana
      </span>
    </>
  )
  if (!href) return <span className="inline-flex items-center gap-2">{content}</span>
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-2 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {content}
    </Link>
  )
}
