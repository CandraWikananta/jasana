/**
 * Konstanta lapisan infrastruktur.
 *
 * Yang di sini adalah nilai yang ditentukan PRD dan tidak berubah saat
 * berjalan. Parameter bisnis yang bisa diubah admin TIDAK di sini,
 * tempatnya tabel `platform_settings`.
 */

/** PRD Bagian 4.1. Seluruh endpoint bisnis ada di bawah prefix ini. */
export const API_PREFIX = '/api/v1';

/**
 * Batas ukuran body JSON. Kelebihan dibalas 413 PAYLOAD_TOO_LARGE
 * (Lampiran A.2).
 *
 * Tidak berlaku untuk unggahan multipart, yang batasnya dibaca dari
 * `platform_settings` di Fase 2 dan seterusnya.
 */
export const JSON_BODY_LIMIT = '1mb';

/** Nama header yang membawa korelasi log antara client dan server. */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Batas waktu pemeriksaan basis data pada `GET /health`.
 *
 * Ada supaya health check tidak menggantung saat basis data menerima koneksi
 * tetapi tidak menjawab. Health check yang menggantung sama tidak bergunanya
 * dengan health check yang salah, karena pemantau akan timeout sendiri.
 */
export const HEALTH_DB_TIMEOUT_MS = 2_000;

/**
 * Bucket Supabase Storage untuk dokumen e-KYC (D80).
 *
 * WAJIB PRIVATE. Isinya KTP dan selfie, jadi tidak pernah dibaca lewat URL
 * publik. Admin membukanya lewat signed URL berumur pendek. Bucket dibuat
 * sekali di dashboard Supabase, aplikasi tidak membuatnya sendiri.
 */
export const KYC_BUCKET = 'kyc-documents';

/**
 * Umur signed URL dokumen e-KYC yang dibuka admin. Cukup untuk sekali
 * memeriksa, tidak cukup untuk dibagikan lalu dibuka besok.
 */
export const KYC_SIGNED_URL_TTL_SECONDS = 10 * 60;

/** Batas waktu satu panggilan ke Supabase Storage sebelum dianggap gagal. */
export const STORAGE_TIMEOUT_MS = 15_000;

/**
 * Batas satu panggilan PaymentGateway (H96). Tugas afterCommit T1 ditunggu
 * sebelum respons accept dikirim, jadi Xendit yang lambat tidak boleh
 * menahannya lebih lama dari ini.
 */
export const PAYMENT_GATEWAY_TIMEOUT_MS = 10_000;

/**
 * Batas satu panggilan LlmGateway (D151, usulan D156). Ini batas keras, bukan
 * target NFR p95 3 detik. Tamu tidak dibiarkan menunggu lebih lama dari ini.
 */
export const LLM_GATEWAY_TIMEOUT_MS = 8_000;

/**
 * D165, usulan D167: satu retry untuk HTTP 500, 502, 503, 504, dengan jeda ini,
 * di dalam tenggat LLM_GATEWAY_TIMEOUT_MS yang sama. Retry dilewati kalau sisa
 * tenggat setelah jeda kurang dari ambang (sekitar dua kali latensi normal 1,5
 * detik pada smoke 9a), karena percobaan kedua hampir pasti terpotong timeout.
 */
export const LLM_RETRY_DELAY_MS = 1_000;
export const LLM_RETRY_MIN_REMAINING_MS = 3_000;

/** PRD 7.1, D121: event PROCESSING lebih lama dari ini dianggap macet, FAILED diulang maksimal sekian kali. */
export const WEBHOOK_STUCK_MINUTES = 5;
export const WEBHOOK_MAX_RETRIES = 3;

/**
 * Bucket Supabase Storage untuk foto listing (D80).
 *
 * PUBLIK, dan diunggah langsung oleh frontend lewat signed URL, jadi API
 * tidak pernah menerima byte-nya. Karena itu batas tipe dan ukuran berkas
 * dipasang di pengaturan bucket di dashboard Supabase (allowed MIME types
 * image/jpeg, image/png, image/webp dan file size limit), sama seperti
 * KYC_BUCKET yang dibuat sekali di dashboard.
 *
 * Path objek: `<user_id>/<uuid>`. Folder per user yang membuat
 * `POST /providers/me/listings/:id/photos` bisa menolak berkas milik orang lain.
 */
export const LISTING_PHOTO_BUCKET = 'listing-photos';

/**
 * Batas transaksi interaktif Prisma: timeout 15 detik, maxWait 5 detik. Alasannya
 * latensi jaringan ke basis data jarak jauh (Supabase dev, P2028 di 5123 ms pada
 * accept Scheduled), bukan pekerjaan berat. Dipasang global di PrismaClient
 * (`packages/database/src/index.ts`), tempat nilainya didefinisikan.
 */
export { TRANSACTION_MAX_WAIT_MS, TRANSACTION_TIMEOUT_MS } from '@jasana/database';

/**
 * Bucket Supabase Storage untuk bukti dispute (D80). PRIVATE seperti
 * KYC_BUCKET, dibuat sekali di dashboard. Path objek `<dispute_id>/<uuid>.<ext>`.
 */
export const DISPUTE_EVIDENCE_BUCKET = 'dispute-evidences';

/** Usulan D148: bukti per pihak (client atau pemilik) per dispute. */
export const DISPUTE_EVIDENCE_MAX_PER_PARTY = 5;

/** Umur signed URL bukti dispute, sama alasannya dengan KYC_SIGNED_URL_TTL_SECONDS. */
export const DISPUTE_EVIDENCE_SIGNED_URL_TTL_SECONDS = 10 * 60;

/** Usulan D168: sub-kategori terbanyak dipesan yang masuk personalization_snapshot dan prompt. */
export const CHAT_SNAPSHOT_HISTORY_LIMIT = 3;

/** Pesan terakhir sebelum pesan baru yang dikirim ulang ke LlmGateway sebagai riwayat (D158). */
export const CHAT_HISTORY_MESSAGES = 6;

/** Panjang maksimal satu pesan chatbot. Pesan panjang hanya menambah token tanpa menambah intent. */
export const CHAT_MESSAGE_MAX_LENGTH = 1000;

/** Rekomendasi listing per balasan cari_jasa. */
export const CHAT_RECOMMENDATION_LIMIT = 5;

/** PRD: cache daftar sub-kategori aktif untuk prompt, di-invalidasi saat admin mengubah katalog. */
export const SUBCATEGORY_CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Sebagian H114 (sesi 10a). Baris EMAIL yang masih PENDING tanpa retry dan lebih tua dari
 * ini dianggap yatim: proses mati setelah commit sebelum dispatch. Cron retry mengambilnya.
 * Jauh di atas batas waktu SMTP (`mailer.ts`, sekitar 35 detik), jadi pengiriman pertama
 * yang masih berjalan tidak ikut terambil.
 */
export const EMAIL_PENDING_STALE_MINUTES = 15;

/** Baris email per putaran cron retry. */
export const EMAIL_RETRY_BATCH = 50;
