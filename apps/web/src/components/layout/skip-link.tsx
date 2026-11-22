// D248: elemen pertama di setiap layout, terlihat saat difokus. Setiap layout memberi
// `<main id="konten" tabIndex={-1}>` sebagai tujuannya.
export function SkipLink() {
  return (
    <a
      href="#konten"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-card focus:outline-none"
    >
      Lewati ke konten
    </a>
  )
}
