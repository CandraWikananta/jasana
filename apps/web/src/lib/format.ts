// Design System Bagian 8. Uang dari API sudah integer rupiah: jangan dibagi atau dikali 100.

const ribuan = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 })
const satuDesimal = new Intl.NumberFormat("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** `Rp150.000`, `-Rp50.000`. Tanpa spasi tak terputus yang disisipkan format currency Intl. */
export function formatRupiah(amount: number): string {
  return `${amount < 0 ? "-" : ""}Rp${ribuan.format(Math.abs(amount))}`
}

/** Delta opsi: `+Rp25.000`, `-Rp10.000`, nol menjadi `Termasuk`. */
export function formatDelta(amount: number): string {
  if (amount === 0) return "Termasuk"
  return amount > 0 ? `+${formatRupiah(amount)}` : formatRupiah(amount)
}

/** `350 m`, `1,2 km`. */
export function formatJarak(meter: number): string {
  const m = Math.round(meter)
  return m < 1000 ? `${m} m` : `${satuDesimal.format(m / 1000)} km`
}

/** Rating rata-rata `4,8`. */
export function formatRating(value: number): string {
  return satuDesimal.format(value)
}

/** `45 menit`, `2 jam`, `1 jam 30 menit` dari menit. */
export function formatDurasi(menit: number): string {
  const jam = Math.floor(menit / 60)
  const sisa = menit % 60
  if (jam === 0) return `${sisa} menit`
  return sisa === 0 ? `${jam} jam` : `${jam} jam ${sisa} menit`
}

/** Nilai atribut SPEC untuk dibaca: daftar digabung koma, boolean Ya/Tidak, satuan di belakang. Kosong → null. */
export function formatNilaiAtribut(value: unknown, unit: string | null): string | null {
  if (value === null || value === undefined || value === "") return null
  if (Array.isArray(value)) return value.length === 0 ? null : value.map(String).join(", ")
  if (typeof value === "boolean") return value ? "Ya" : "Tidak"
  return unit ? `${String(value)} ${unit}` : String(value)
}
