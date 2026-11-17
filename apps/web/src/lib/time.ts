// FE6: seluruh waktu tampil dalam WITA, tidak mengikuti zona perangkat. Zona eksplisit juga
// membuat hasil server dan client sama, jadi aman dari hydration mismatch.

const ZONA = "Asia/Makassar"

const tanggal = new Intl.DateTimeFormat("id-ID", {
  timeZone: ZONA,
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
})
const jam = new Intl.DateTimeFormat("id-ID", { timeZone: ZONA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" })

// Dirakit dari bagian-bagiannya supaya tanda baca tidak bergantung versi data ICU.
function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((p) => p.type === type)?.value ?? ""
}

/** `Sel, 17 Nov 2026` */
export function formatTanggal(iso: string): string {
  const p = tanggal.formatToParts(new Date(iso))
  return `${part(p, "weekday")}, ${part(p, "day")} ${part(p, "month")} ${part(p, "year")}`
}

/** `14.00 WITA` */
export function formatJam(iso: string): string {
  const p = jam.formatToParts(new Date(iso))
  return `${part(p, "hour")}.${part(p, "minute")} WITA`
}

/** `Sel, 17 Nov 2026, 14.00 WITA` */
export function formatTanggalJam(iso: string): string {
  return `${formatTanggal(iso)}, ${formatJam(iso)}`
}
