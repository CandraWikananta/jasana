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
