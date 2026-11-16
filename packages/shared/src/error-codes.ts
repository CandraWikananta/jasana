/**
 * Katalog kode error beserta status HTTP-nya.
 *
 * Sumbernya PRD Backend Lampiran A. Ditaruh di `packages/shared` supaya
 * frontend memakai daftar yang sama persis, bukan menyalin string sendiri.
 *
 * Tabel ini DATA, bukan logika bisnis. Aturan yang menentukan kapan sebuah
 * kode dilempar ada di service masing-masing modul, bukan di sini.
 */

/** Lampiran A.1, aturan bisnis. */
export const BUSINESS_ERROR_STATUS = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  EMAIL_NOT_VERIFIED: 403,
  FORBIDDEN_ACTOR: 403,
  NOT_ASSIGNED_WORKER: 403,
  NOT_ORDER_PARTICIPANT: 403,
  NOT_FOUND: 404,
  ORDER_TRANSITION_NOT_ALLOWED: 409,
  ORDER_ALREADY_CLAIMED: 409,
  RESPONSE_DEADLINE_PASSED: 409,
  PAYMENT_DEADLINE_PASSED: 409,
  WORKER_HAS_INFLIGHT_ORDER: 409,
  WORKER_SCHEDULE_CONFLICT: 409,
  WORKER_NOT_ASSIGNABLE: 422,
  WORKER_NOT_MAPPED_TO_LISTING: 422,
  CREW_NOT_ALLOWED_FOR_MODE: 422,
  PROVIDER_HAS_NO_ACTIVE_WORKER: 409,
  // Fase 2, belum tercatat di Lampiran A. Status pengajuan provider tidak
  // sesuai untuk aksi yang diminta (ajukan ulang, unggah, setujui, ubah tipe).
  PROVIDER_STATE_CONFLICT: 409,
  // Fase 2, belum tercatat di Lampiran A. Bentrok keanggotaan pekerja,
  // terutama eksklusivitas satu keanggotaan ACTIVE (D36).
  WORKER_MEMBERSHIP_CONFLICT: 409,
  LISTING_HAS_NO_WORKER: 409,
  LISTING_NOT_AVAILABLE: 409,
  // Fase 6, belum tercatat di Lampiran A (usulan D105, H88). Listing tidak
  // bisa dihapus selama masih punya order yang pekerjaannya belum selesai.
  LISTING_HAS_ACTIVE_ORDERS: 409,
  ORDER_ALREADY_PAID: 409,
  MESSAGE_WINDOW_CLOSED: 409,
  DISPUTE_ALREADY_EXISTS: 409,
  DISPUTE_WINDOW_CLOSED: 409,
  ATTRIBUTE_VALIDATION_FAILED: 422,
  OPTION_NOT_OFFERED: 422,
  UNSUPPORTED_FILE_TYPE: 422,
  STORAGE_UPLOAD_FAILED: 502,
  CHECKIN_OUT_OF_RADIUS: 422,
  VERIFICATION_CODE_INVALID: 422,
  VERIFICATION_CODE_EXPIRED: 422,
  VERIFICATION_LOCKED: 429,
  INSUFFICIENT_BALANCE: 422,
  WITHDRAWAL_BELOW_MINIMUM: 422,
  // Sesi 8b, belum tercatat di Lampiran A. Withdrawal yang statusnya tidak
  // cocok untuk aksi admin (reject selain REQUESTED, approve setelah DISBURSING).
  WITHDRAWAL_STATE_CONFLICT: 409,
  // Sesi 8c, belum tercatat di Lampiran A. Refund yang statusnya tidak cocok untuk
  // complete manual atau sync (usulan D140, D144).
  REFUND_STATE_CONFLICT: 409,
  // Sesi 8d, belum tercatat di Lampiran A. Review bukan dari OPEN, putusan bukan dari
  // UNDER_REVIEW, atau bukti untuk dispute yang sudah diputus.
  DISPUTE_STATE_CONFLICT: 409,
  // Sesi 8d, usulan D148: lima bukti per pihak per dispute.
  DISPUTE_EVIDENCE_LIMIT_REACHED: 409,
  TOKEN_INVALID: 422,
  TOKEN_EXPIRED: 422,
  TOKEN_ALREADY_USED: 422,
  TAXONOMY_REQUEST_LIMIT: 429,
  // Fase 3, belum tercatat di Lampiran A. Usulan taksonomi yang sudah
  // diputus tidak bisa diputus lagi.
  TAXONOMY_REQUEST_STATE_CONFLICT: 409,
  // Sesi 9b, belum tercatat di Lampiran A (usulan D162). Sesi tamu ENDED atau kedaluwarsa, atau
  // sesi terdaftar ENDED yang dikirimi pesan atau diakhiri lagi.
  CHAT_SESSION_ENDED: 409,
  // Sesi 9c, belum tercatat di Lampiran A (usulan D170). Klaim sesi tamu yang sudah diklaim,
  // termasuk oleh akun yang sama dan pecundang dua klaim paralel.
  CHAT_SESSION_ALREADY_CLAIMED: 409,
  // Sesi 10b, belum tercatat di Lampiran A. Review: order belum pernah COMPLETED, lewat
  // review_window_days, review kedua untuk order yang sama, dan balasan penyedia kedua.
  REVIEW_NOT_ALLOWED: 409,
  REVIEW_WINDOW_CLOSED: 409,
  REVIEW_ALREADY_EXISTS: 409,
  REVIEW_ALREADY_REPLIED: 409,
  // Sesi 10c (usulan D199). PATCH /admin/settings yang menurunkan batas di bawah data yang
  // sudah ada, misalnya listing_faq_max_items di bawah FAQ aktif terbanyak (V12).
  SETTING_CONFLICTS_WITH_DATA: 409,
  GUEST_CHAT_LIMIT_REACHED: 429,
  RATE_LIMIT_EXCEEDED: 429,
  GEMINI_UNAVAILABLE: 502,
  PAYMENT_GATEWAY_ERROR: 502,
  EMAIL_DELIVERY_FAILED: 502,
  CHATBOT_TEMPORARILY_UNAVAILABLE: 503,
} as const;

/**
 * Lampiran A.2, lapisan infrastruktur.
 * Tidak menyangkut aturan bisnis, dibentuk middleware bersama pada Fase 0.
 */
export const INFRA_ERROR_STATUS = {
  INVALID_JSON: 400,
  PAYLOAD_TOO_LARGE: 413,
  CORS_ORIGIN_NOT_ALLOWED: 403,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
} as const;

export const ERROR_STATUS = {
  ...BUSINESS_ERROR_STATUS,
  ...INFRA_ERROR_STATUS,
} as const;

export type BusinessErrorCode = keyof typeof BUSINESS_ERROR_STATUS;
export type InfraErrorCode = keyof typeof INFRA_ERROR_STATUS;
export type ErrorCode = keyof typeof ERROR_STATUS;

/** Status HTTP untuk sebuah kode error. */
export function httpStatusFor(code: ErrorCode): number {
  return ERROR_STATUS[code];
}

export function isErrorCode(value: string): value is ErrorCode {
  return Object.prototype.hasOwnProperty.call(ERROR_STATUS, value);
}
