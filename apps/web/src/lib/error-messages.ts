import type { ErrorCode } from "@jasana/shared"

// PRD Frontend Lampiran A. Record memaksa setiap kode di @jasana/shared punya pesan,
// termasuk kode Fase 2 sampai 10 yang belum tercatat di Lampiran A.
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Ada isian yang belum sesuai. Periksa lagi yang ditandai.",
  UNAUTHORIZED: "Sesimu sudah berakhir. Silakan masuk lagi.",
  EMAIL_NOT_VERIFIED: "Verifikasi emailmu dulu untuk melanjutkan.",
  FORBIDDEN_ACTOR: "Kamu tidak bisa melakukan aksi ini pada pesanan ini.",
  NOT_ASSIGNED_WORKER: "Hanya penanggung jawab pesanan ini yang bisa melakukan aksi ini.",
  NOT_ORDER_PARTICIPANT: "Kamu bukan peserta pesanan ini.",
  NOT_FOUND: "Data tidak ditemukan.",
  ORDER_TRANSITION_NOT_ALLOWED: "Status pesanan sudah berubah. Halaman diperbarui.",
  ORDER_ALREADY_CLAIMED: "Pesanan ini sudah diambil.",
  RESPONSE_DEADLINE_PASSED: "Waktu untuk merespons pesanan ini sudah habis.",
  PAYMENT_DEADLINE_PASSED: "Batas waktu pembayaran sudah lewat.",
  WORKER_HAS_INFLIGHT_ORDER: "Pekerja ini sedang mengerjakan pesanan lain. Pilih pekerja lain.",
  WORKER_SCHEDULE_CONFLICT: "Jadwal pekerja ini bentrok dengan pesanan lain. Pilih pekerja lain.",
  WORKER_NOT_ASSIGNABLE: "Pekerja ini sedang tidak bisa ditugaskan.",
  WORKER_NOT_MAPPED_TO_LISTING: "Pekerja ini belum dipetakan ke jasa ini.",
  CREW_NOT_ALLOWED_FOR_MODE: "Pendamping hanya bisa ditambahkan pada pesanan terjadwal.",
  PROVIDER_HAS_NO_ACTIVE_WORKER: "Usahamu harus punya minimal satu pekerja aktif yang bisa ditugaskan.",
  PROVIDER_STATE_CONFLICT: "Status pengajuan usahamu sudah berubah. Halaman diperbarui.",
  WORKER_MEMBERSHIP_CONFLICT: "Kamu masih tercatat aktif di usaha lain, atau lamaranmu sudah pernah diproses.",
  LISTING_HAS_NO_WORKER: "Jasa ini belum bisa ditayangkan karena belum ada pekerja yang dipetakan.",
  LISTING_NOT_AVAILABLE: "Jasa ini sedang tidak tersedia.",
  LISTING_HAS_ACTIVE_ORDERS: "Jasa ini masih punya pesanan yang belum selesai, jadi belum bisa dihapus.",
  ORDER_ALREADY_PAID: "Pesanan ini sudah dibayar.",
  MESSAGE_WINDOW_CLOSED: "Percakapan untuk pesanan ini sudah ditutup.",
  DISPUTE_ALREADY_EXISTS: "Pesanan ini sudah punya komplain.",
  DISPUTE_WINDOW_CLOSED: "Batas waktu mengajukan komplain sudah lewat.",
  ATTRIBUTE_VALIDATION_FAILED: "Ada spesifikasi jasa yang belum sesuai. Periksa lagi yang ditandai.",
  OPTION_NOT_OFFERED: "Pilihan ini tidak dilayani penyedia. Pilih yang lain.",
  UNSUPPORTED_FILE_TYPE: "Jenis berkas tidak didukung. Gunakan JPG, PNG, atau PDF.",
  STORAGE_UPLOAD_FAILED: "Berkas gagal diunggah. Coba lagi.",
  CHECKIN_OUT_OF_RADIUS: "Kamu masih di luar radius lokasi. Dekati alamat lalu coba lagi.",
  VERIFICATION_CODE_INVALID: "Kode salah.",
  VERIFICATION_CODE_EXPIRED: "Kode sudah kedaluwarsa. Minta pelanggan membuat kode baru.",
  VERIFICATION_LOCKED: "Terlalu banyak percobaan. Coba lagi setelah waktu tunggu selesai.",
  INSUFFICIENT_BALANCE: "Saldo tersedia tidak cukup.",
  WITHDRAWAL_BELOW_MINIMUM: "Nominal di bawah batas minimum penarikan.",
  WITHDRAWAL_STATE_CONFLICT: "Status pencairan ini sudah berubah. Halaman diperbarui.",
  REFUND_STATE_CONFLICT: "Status pengembalian dana ini sudah berubah. Halaman diperbarui.",
  DISPUTE_STATE_CONFLICT: "Status komplain ini sudah berubah. Halaman diperbarui.",
  DISPUTE_EVIDENCE_LIMIT_REACHED: "Kamu sudah mengunggah bukti sebanyak batas maksimal.",
  TOKEN_INVALID: "Link tidak valid. Minta link baru.",
  TOKEN_EXPIRED: "Link sudah kedaluwarsa. Minta link baru.",
  TOKEN_ALREADY_USED: "Link ini sudah pernah dipakai.",
  TAXONOMY_REQUEST_LIMIT: "Kamu sudah punya 3 usulan yang menunggu. Tunggu salah satunya diputuskan.",
  TAXONOMY_REQUEST_STATE_CONFLICT: "Usulan ini sudah diputuskan.",
  CHAT_SESSION_ENDED: "Percakapan dengan Asisten ini sudah berakhir. Mulai percakapan baru.",
  CHAT_SESSION_ALREADY_CLAIMED: "Percakapan ini sudah tersimpan ke akun.",
  REVIEW_NOT_ALLOWED: "Ulasan hanya bisa diberikan untuk pesanan yang sudah selesai.",
  REVIEW_WINDOW_CLOSED: "Batas waktu memberi ulasan sudah lewat.",
  REVIEW_ALREADY_EXISTS: "Kamu sudah memberi ulasan untuk pesanan ini.",
  REVIEW_ALREADY_REPLIED: "Ulasan ini sudah dibalas.",
  SETTING_CONFLICTS_WITH_DATA: "Nilai ini bertentangan dengan data yang sudah ada.",
  GUEST_CHAT_LIMIT_REACHED: "Batas percakapan tamu sudah tercapai. Daftar gratis untuk melanjutkan.",
  RATE_LIMIT_EXCEEDED: "Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.",
  GEMINI_UNAVAILABLE: "Asisten sedang tidak tersedia. Kamu tetap bisa mencari lewat kolom pencarian.",
  PAYMENT_GATEWAY_ERROR: "Layanan pembayaran sedang bermasalah. Coba lagi beberapa saat.",
  EMAIL_DELIVERY_FAILED: "Email belum terkirim. Sistem akan mencoba lagi.",
  CHATBOT_TEMPORARILY_UNAVAILABLE: "Asisten sedang tidak tersedia. Kamu tetap bisa mencari lewat kolom pencarian.",
  INVALID_JSON: "Permintaan tidak bisa diproses. Muat ulang halaman lalu coba lagi.",
  PAYLOAD_TOO_LARGE: "Berkas terlalu besar. Maksimal 5 MB.",
  CORS_ORIGIN_NOT_ALLOWED: "Permintaan ditolak server.",
  SERVICE_UNAVAILABLE: "Layanan sedang tidak tersedia. Coba lagi beberapa saat.",
  INTERNAL_ERROR: "Terjadi kesalahan di server. Coba lagi beberapa saat.",
}

export const UNKNOWN_ERROR_MESSAGE = "Terjadi kesalahan. Coba lagi."

export function getErrorMessage(code: string | null | undefined): string {
  if (code && Object.hasOwn(ERROR_MESSAGES, code)) return ERROR_MESSAGES[code as ErrorCode]
  if (code && process.env.NODE_ENV === "development") console.warn(`Kode error tidak dikenal: ${code}`)
  return UNKNOWN_ERROR_MESSAGE
}

/**
 * Pesan 401 khusus halaman masuk. Lampiran A memetakan UNAUTHORIZED ke "Sesimu sudah berakhir",
 * yang salah arti untuk kredensial keliru. Akun nonaktif juga 401 dengan kode yang sama, dan
 * sengaja tidak dibedakan supaya status akun tidak bocor.
 */
export const LOGIN_UNAUTHORIZED_MESSAGE = "Email, nomor ponsel, atau kata sandi salah."

/** "Coba lagi dalam N menit" untuk 429 yang membawa Retry-After (PRD Frontend 7.2). */
export function retryAfterMessage(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null
  if (seconds < 60) return `Coba lagi dalam ${seconds} detik.`
  return `Coba lagi dalam ${Math.ceil(seconds / 60)} menit.`
}
