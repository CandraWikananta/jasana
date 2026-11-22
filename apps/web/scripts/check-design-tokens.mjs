#!/usr/bin/env node
// Penjaga aturan 8 apps/web/CLAUDE.md dan Design System 13: warna, radius, dan ukuran
// hanya dari token. Memindai src/**/*.{ts,tsx} baris per baris (globals.css tidak, karena
// di sanalah token didefinisikan).
//
// Pengecualian per baris: komentar `token-check-ignore: <alasan>` di baris yang sama atau
// tepat di atasnya. Pengecualian tanpa alasan tetap gagal.
//
//   node scripts/check-design-tokens.mjs              periksa src/
//   node scripts/check-design-tokens.mjs --self-test  uji aturan dengan contoh

import { readdirSync, readFileSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose"
const PREFIX =
  "bg|text|border(?:-[trblxyse])?|ring|ring-offset|outline|fill|stroke|from|via|to|divide|decoration|placeholder|caret|accent|shadow"

const RULES = [
  ["warna hex", /#[0-9a-fA-F]{3,8}\b/],
  ["fungsi warna rgb()/hsl()/oklch()", /\b(?:rgba?|hsla?|oklch|oklab)\(/],
  // `p-[13px]`, `bg-[#..]`. Varian arbitrer seperti `has-[>svg]:` dan `data-[state=open]:` boleh.
  ["nilai arbitrer -[...]", /-\[[^\]\s]*\](?!:)/],
  ["variabel arbitrer -(--...)", /-\(--(?!radix-)/],
  ["palet bawaan Tailwind", new RegExp(`\\b(?:${PREFIX})-(?:(?:${PALETTE})-\\d{2,3}|black|white)\\b`)],
  ["varian dark: (FE13)", /\bdark:/],
  // DS 13: putih di atas --brand hanya 2,28:1, --brand sebagai teks juga 2,28:1. Pakai text-brand-foreground.
  ["teks brand/putih di atas bg-brand (DS 13)", /^(?=.*\bbg-brand(?![\w-]))(?=.*\btext-(?:brand|white)(?![\w-]))/],
  ["garis tepi kiri brand (D242)", /\bborder-l-brand\b/],
  ["max-w-prose (D247)", /\bmax-w-prose\b/],
]

const IGNORE = "token-check-ignore"
// Alasan wajib: setelah titik dua harus ada teks, bukan hanya penutup komentar.
const IGNORE_WITH_REASON = /token-check-ignore:\s*(?!\*\/)\S/
const COMMENT_ONLY = /^\s*(?:\/\/|\/\*|\{\/\*)/

/** Mengembalikan daftar pelanggaran untuk satu baris, dengan baris sebelumnya untuk komentar pengecualian. */
export function checkLine(line, prevLine = "") {
  const hits = RULES.filter(([, re]) => re.test(line)).map(([name]) => name)
  if (hits.length === 0) return []
  const marker = line.includes(IGNORE) ? line : COMMENT_ONLY.test(prevLine) && prevLine.includes(IGNORE) ? prevLine : null
  if (marker === null) return hits
  return IGNORE_WITH_REASON.test(marker) ? [] : ["token-check-ignore tanpa alasan"]
}

function selfTest() {
  const bad = [
    'className="bg-[#00814B]"',
    'className="p-[13px]"',
    'className="text-gray-500"',
    'className="hover:bg-teal-700"',
    'className="bg-white"',
    'className="border-x-red-500"',
    'style={{ color: "#fff" }}',
    'const c = "rgb(0, 0, 0)"',
    'className="dark:bg-input/30"',
    'className="bg-(--brand)"',
    'className="bg-brand text-brand"',
    'className="text-brand hover:bg-brand"',
    'className="border-l-4 border-l-brand"',
    'className="max-w-prose text-pretty"',
    'className="bg-white" // token-check-ignore',
    'className="bg-white" // token-check-ignore:',
    'className="bg-white" {/* token-check-ignore: */}',
  ]
  const good = [
    'className="bg-primary text-muted-foreground"',
    'className="has-[>svg]:px-3 [&_svg]:size-4"',
    "className=\"[&_svg:not([class*='size-'])]:size-5\"",
    'className="data-[state=open]:bg-accent"',
    'className="bg-neutral-subtle text-neutral-subtle-foreground"',
    'className="max-h-(--radix-select-content-available-height)"',
    'className="bg-primary/90 aspect-4/3 -translate-y-1/2"',
    'href="#konten"',
    'className="bg-brand text-brand-foreground"',
    'className="hover:bg-brand-hover text-brand-strong"',
    'className="bg-brand-subtle text-brand-subtle-foreground"',
    'className="border-brand max-w-lg"',
    'className="bg-white" // token-check-ignore: logo pihak ketiga wajib putih',
    'className="bg-white" {/* token-check-ignore: logo pihak ketiga */}',
  ]
  let failed = 0
  for (const s of bad) {
    if (checkLine(s).length === 0) {
      failed++
      console.error(`LOLOS padahal harus gagal: ${s}`)
    }
  }
  for (const s of good) {
    if (checkLine(s).length > 0) {
      failed++
      console.error(`GAGAL padahal harus lolos: ${s} -> ${checkLine(s)}`)
    }
  }
  const prevOk = checkLine('  <div className="bg-white">', "  {/* token-check-ignore: kontras foto */}")
  const prevBad = checkLine('  <div className="bg-white">', "  {/* token-check-ignore */}")
  if (prevOk.length !== 0 || prevBad.length !== 1) {
    failed++
    console.error("Pengecualian baris sebelumnya salah")
  }
  console.log(failed ? `self-test: ${failed} gagal` : "self-test: semua lolos")
  process.exit(failed ? 1 : 0)
}

function main() {
  const root = join(fileURLToPath(import.meta.url), "..", "..")
  const src = join(root, "src")
  const files = readdirSync(src, { recursive: true })
    .map(String)
    .filter((f) => /\.(ts|tsx)$/.test(f))
  let count = 0
  for (const f of files) {
    const lines = readFileSync(join(src, f), "utf8").split(/\r?\n/)
    lines.forEach((line, i) => {
      for (const rule of checkLine(line, lines[i - 1])) {
        count++
        console.error(`${relative(root, join(src, f)).replaceAll("\\", "/")}:${i + 1}  ${rule}\n    ${line.trim()}`)
      }
    })
  }
  if (count) {
    console.error(`\n${count} pelanggaran token Design System. Pakai token di globals.css, atau tambahkan token lewat revisi Design System.`)
    process.exit(1)
  }
  console.log(`check-design-tokens: ${files.length} berkas bersih`)
}

if (process.argv.includes("--self-test")) selfTest()
else main()
