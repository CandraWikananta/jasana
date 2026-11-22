"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CountBadge } from "./navigation"

// Tab aktif pucat (D243). Lencana angka mengikuti aturan menu (6.4). Tab terpilih disimpan di query
// URL lewat router.replace (DS 10, D248), supaya kembali dari halaman detail tidak menghilangkan
// pilihan. Pemanggil wajib membungkusnya dengan Suspense karena memakai useSearchParams.
const TABS = [
  { value: "semua", label: "Semua" },
  { value: "berjalan", label: "Berjalan", count: 2, countLabel: "pesanan berjalan" },
  { value: "selesai", label: "Selesai" },
  { value: "komplain", label: "Komplain", count: 1, countLabel: "komplain terbuka" },
]

const DEFAULT_TAB = "berjalan"

export function TabsDemo() {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const fromUrl = params.get("tab")
  const value = TABS.some((t) => t.value === fromUrl) ? (fromUrl as string) : DEFAULT_TAB

  function change(next: string) {
    const q = new URLSearchParams(params.toString())
    q.set("tab", next)
    router.replace(`${pathname}?${q.toString()}`, { scroll: false })
  }

  return (
    <Tabs value={value} onValueChange={change}>
      <TabsList className="w-full max-w-xl">
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
            {t.count !== undefined && <CountBadge count={t.count} label={t.countLabel ?? ""} active={value === t.value} />}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((t) => (
        <TabsContent key={t.value} value={t.value} className="pt-2 text-sm text-muted-foreground">
          Isi tab {t.label.toLowerCase()}. Alamat halaman berubah menjadi{" "}
          <code className="font-mono whitespace-nowrap text-foreground">?tab={t.value}</code>.
        </TabsContent>
      ))}
    </Tabs>
  )
}
