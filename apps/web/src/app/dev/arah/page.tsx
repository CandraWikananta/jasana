import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Hanken_Grotesk, Newsreader, Red_Hat_Display, Red_Hat_Text, Work_Sans } from "next/font/google"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import arah from "./arah.json"
import { ARAH_META, type ArahId } from "./meta"
import { Showcase } from "./showcase"
import "./arah.css"

export const metadata: Metadata = { title: "Arah visual" }

// Font usulan tiap arah. Plus Jakarta Sans pembanding sudah dimuat root layout (--font-jakarta).
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader" })
const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken" })
const redHatDisplay = Red_Hat_Display({ subsets: ["latin"], variable: "--font-red-hat-display" })
const redHatText = Red_Hat_Text({ subsets: ["latin"], variable: "--font-red-hat-text" })
const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans" })
const FONT_VARS = [newsreader, hanken, redHatDisplay, redHatText, workSans].map((f) => f.variable).join(" ")

const IDS: ArahId[] = ["A", "B", "C"]

// Eksplorasi arah visual v2. Layout dan konten sama, yang berbeda hanya token, huruf, radius, dan gerak.
export default function DevArahPage() {
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <main className={`${FONT_VARS} mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:px-6`}>
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Arah visual v2</h1>
        <p className="max-w-prose text-sm text-muted-foreground">
          Tiga arah dengan layout dan konten yang sama. Hanya tampil di development, belum menjadi keputusan.
        </p>
      </header>

      <Tabs defaultValue="A">
        <TabsList className="h-11 w-full sm:w-fit">
          {IDS.map((id) => (
            <TabsTrigger key={id} value={id} className="px-4">
              {id}. {ARAH_META[id].name}
            </TabsTrigger>
          ))}
        </TabsList>
        {IDS.map((id) => (
          <TabsContent key={id} value={id} className="pt-4">
            <Showcase id={id} data={arah[id]} />
          </TabsContent>
        ))}
      </Tabs>
    </main>
  )
}
