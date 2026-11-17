import Link from "next/link"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Header publik (PRD Frontend 4.1). Mobile-first: logo dan Masuk di baris pertama,
// kotak cari baris kedua; mulai md semuanya satu baris. Form GET biasa ke /cari,
// jadi tetap jalan tanpa JavaScript.
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:flex-nowrap md:px-6">
        <Link
          href="/"
          className="rounded-sm text-2xl font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Jasana
        </Link>

        <form
          role="search"
          action="/cari"
          method="get"
          className="order-last flex w-full gap-2 md:order-none md:max-w-xl md:flex-1"
        >
          <label htmlFor="cari-jasa" className="sr-only">
            Cari jasa
          </label>
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
            />
            <Input id="cari-jasa" name="q" type="search" placeholder="Cari jasa, misalnya servis AC" className="pl-10" />
          </div>
          <Button type="submit" variant="secondary" className="h-11">
            Cari
          </Button>
        </form>

        <Button asChild variant="outline" className="ml-auto">
          <Link href="/masuk">Masuk</Link>
        </Button>
      </div>
    </header>
  )
}
