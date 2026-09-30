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
