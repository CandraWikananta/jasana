// Teks penjelas tiap arah, dipakai page (server) dan showcase (client). Tanpa nilai warna.
export type ArahId = "A" | "B" | "C"
export type FontPick = { label: string; heading: string; body: string; weight: number; tracking: string }

export const ARAH_META: Record<
  ArahId,
  { name: string; tagline: string; reason: string; radius: number; garis: string; bayangan: string; gerak: string; dur: string; fontReason: string; fonts: FontPick[]; notes: string[] }
> = {
  A: {
    name: "Tinta",
    tagline: "Primary monokrom, warna hanya untuk Sekarang dan status",
    reason:
      "Jasana menahan uang orang dan mengirim pekerja ke rumah orang lain. Tinta membuat seluruh antarmuka tenang seperti dokumen transaksi, sehingga satu-satunya warna yang terlihat adalah yang membawa arti: kuning untuk yang terjadi sekarang dan nada status pesanan. Cocok untuk P1 (jelas dulu), karena status dan tawaran tidak pernah bersaing dengan warna merek.",
    radius: 4,
    garis: "Garis rambut 1 px pada kartu dan input. Hover kartu menggelapkan garis ke warna teks",
    bayangan: "Tanpa bayangan sama sekali, termasuk kartu",
    gerak: "Hanya perubahan warna 120 ms, tanpa geser dan tanpa skala, supaya terasa presisi",
    dur: "120ms",
    fontReason:
      "Newsreader (serif) untuk display, h1, dan h2 memberi kesan dokumen tepercaya untuk uang dan escrow. Hanken Grotesk untuk isi, judul kartu, angka, dan formulir: tegas, punya angka tabular",
    fonts: [
      { label: "Usulan: Newsreader + Hanken Grotesk", heading: "--font-newsreader", body: "--font-hanken", weight: 500, tracking: "-0.015em" },
      { label: "Tanpa serif: Hanken Grotesk", heading: "--font-hanken", body: "--font-hanken", weight: 650, tracking: "-0.02em" },
      { label: "Plus Jakarta Sans", heading: "--font-jakarta", body: "--font-jakarta", weight: 700, tracking: "-0.015em" },
    ],
    notes: [
      "Tautan selalu bergaris bawah, karena primary hitam tidak membedakan tautan dari teks biasa.",
      "Peringatan digeser dari hue 55 ke 78 (amber), karena di hue 55 latar pucatnya terlalu mirip latar bahaya.",
    ],
  },
  B: {
    name: "Laut",
    tagline: "Primary teal petrol, aksen Sekarang oranye senja",
    reason:
      "Teal menggabungkan kepercayaan biru dengan kesan bersih dan segar hijau, dua hal yang dicari orang sebelum membiarkan pekerja masuk rumah. Nuansanya laut Bali tanpa klise, dan teal lazim di produk keuangan sehingga cocok dengan dana ditahan. Oranye adalah komplemennya, jadi mode Sekarang langsung terbaca sebagai sesuatu yang lain dari aksi biasa.",
    radius: 8,
    garis: "Garis 1 px pada kartu dan input, warna dari token border",
    bayangan: "Kartu tanpa bayangan saat diam. Saat hover terangkat 1 px dengan bayangan sangat tipis",
    gerak: "150 ms ease-out, kartu terangkat 1 px saat hover, cukup untuk memberi tanda bisa ditekan",
    dur: "150ms",
    fontReason:
      "Red Hat Display untuk judul dan Red Hat Text untuk isi. Keluarga yang sama dengan dua potongan: Display untuk ukuran besar, Text untuk ukuran kecil. Kesannya mantap dan ramah, cocok untuk jasa dan keuangan",
    fonts: [
      { label: "Usulan: Red Hat Display + Red Hat Text", heading: "--font-red-hat-display", body: "--font-red-hat-text", weight: 700, tracking: "-0.02em" },
      { label: "Plus Jakarta Sans", heading: "--font-jakarta", body: "--font-jakarta", weight: 700, tracking: "-0.015em" },
    ],
    notes: ["Peringatan digeser ke kuning emas (hue sekitar 88) dan bahaya ke crimson, supaya oranye Sekarang punya celah sendiri."],
  },
  C: {
    name: "Kobalt",
    tagline: "Primary biru kobalt, aksen Sekarang limau",
    reason:
      "Biru adalah warna kepercayaan dan keandalan yang paling teruji untuk jasa. Di sini dibuat lebih dalam dari biru template dan dipasang di atas latar netral, sehingga terasa seperti produk keuangan, bukan landing page. Limau sangat jauh dari biru dalam hue maupun terang, sehingga tawaran Sekarang langsung menonjol.",
    radius: 12,
    garis: "Kartu tanpa garis. Input tetap bergaris (batas komponen wajib terlihat)",
    bayangan: "Bayangan xs pada kartu sebagai pengganti garis, menguat saat hover",
    gerak: "200 ms ease-out dan tombol menekan ke 98% saat diklik, terasa empuk seperti aplikasi consumer",
    dur: "200ms",
    fontReason: "Work Sans untuk judul dan isi, hierarki lewat bobot. Kokoh dan polos seperti papan nama tukang, punya angka tabular",
    fonts: [
      { label: "Usulan: Work Sans", heading: "--font-work-sans", body: "--font-work-sans", weight: 600, tracking: "-0.025em" },
      { label: "Plus Jakarta Sans", heading: "--font-jakarta", body: "--font-jakarta", weight: 700, tracking: "-0.015em" },
    ],
    notes: ["Info digeser ke sian (hue sekitar 215), supaya Sudah dibayar dan Dalam perjalanan tidak terbaca sebagai biru primary."],
  },
}

