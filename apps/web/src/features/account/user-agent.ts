// Nama perangkat untuk halaman Perangkat aktif. Urutan penting: Edge, Opera, dan Samsung Internet
// juga memuat "Chrome/", dan semuanya memuat "Safari/".
const BROWSERS: [RegExp, string][] = [
  [/Edg(e|A|iOS)?\//, "Edge"],
  [/OPR\//, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/(Firefox|FxiOS)\//, "Firefox"],
  [/(Chrome|CriOS)\//, "Chrome"],
  [/Safari\//, "Safari"],
]

// iPhone dan iPad memuat "Mac OS X", Android memuat "Linux".
const SYSTEMS: [RegExp, string][] = [
  [/iPhone/, "iPhone"],
  [/iPad/, "iPad"],
  [/Android/, "Android"],
  [/Windows/, "Windows"],
  [/CrOS/, "ChromeOS"],
  [/Macintosh/, "Mac"],
  [/Linux/, "Linux"],
]

const MOBILE = new Set(["iPhone", "iPad", "Android"])

const find = (list: [RegExp, string][], ua: string) => list.find(([pattern]) => pattern.test(ua))?.[1]

export function describeUserAgent(userAgent: string | null): { label: string; mobile: boolean } {
  const ua = userAgent ?? ""
  const system = find(SYSTEMS, ua)
  const parts = [find(BROWSERS, ua), system].filter(Boolean)
  return {
    label: parts.join(" di ") || "Perangkat tidak dikenal",
    mobile: system !== undefined && MOBILE.has(system),
  }
}
