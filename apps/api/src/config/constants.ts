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
