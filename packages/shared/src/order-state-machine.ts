/**
 * Tabel state machine order, persis State-Machine-Order.md Bagian 8 versi 2.7.
 *
 * Tabel ini DATA. Satu-satunya yang boleh memakainya untuk mengubah
 * `orders.status` adalah `transitionOrder()` di modul orders API.
 *
 * Tipe didefinisikan di sini, bukan diimpor dari Prisma, karena shared juga
 * dipakai frontend. Kecocokannya dengan enum Prisma dijaga test.
 */

export type OrderStatus =
  | 'PENDING_ACCEPTANCE'
  | 'ACCEPTED'
  | 'PAID'
  | 'ON_THE_WAY'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'AWAITING_VERIFICATION'
  | 'COMPLETED'
  | 'SETTLED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'PAYMENT_EXPIRED'
  | 'CANCELLED'
  | 'DISPUTED'
  | 'REFUNDED';

export type OrderActorType = 'CLIENT' | 'PROVIDER' | 'WORKER' | 'ADMIN' | 'SYSTEM';

export type BookingMode = 'SCHEDULED' | 'AVAILABLE_NOW';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_ACCEPTANCE:    ['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED'],
  ACCEPTED:              ['PAID', 'PAYMENT_EXPIRED', 'CANCELLED'],
  PAID:                  ['ON_THE_WAY', 'CANCELLED'],
  ON_THE_WAY:            ['ARRIVED', 'CANCELLED'],
  ARRIVED:               ['IN_PROGRESS', 'DISPUTED'],
  IN_PROGRESS:           ['AWAITING_VERIFICATION', 'DISPUTED'],
  AWAITING_VERIFICATION: ['COMPLETED', 'DISPUTED'],
  COMPLETED:             ['SETTLED', 'DISPUTED'],
  DISPUTED:              ['SETTLED', 'REFUNDED'],
  CANCELLED:             ['REFUNDED'],
  SETTLED:               [],
  REFUNDED:              [],
  REJECTED:              [],
  EXPIRED:               [],
  PAYMENT_EXPIRED:       [],
};

// PROVIDER = pemilik usaha. WORKER = pekerja yang ditugaskan.
// Keduanya bisa jadi orang yang sama pada provider INDIVIDUAL, tapi
// pemeriksaannya tetap dua jalur berbeda supaya BUSINESS ikut benar.
export const ALLOWED_ACTORS: Record<string, OrderActorType[]> = {
  // T1: WORKER hanya sah pada mode AVAILABLE_NOW. T2 hanya PROVIDER (D102).
  // Pemeriksaan mode dilakukan di actorAllowedForMode(), bukan di sini,
  // karena tabel ini tidak tahu booking_mode.
  'PENDING_ACCEPTANCE->ACCEPTED':       ['PROVIDER', 'WORKER'],
  'PENDING_ACCEPTANCE->REJECTED':       ['PROVIDER'],
  'PENDING_ACCEPTANCE->EXPIRED':        ['SYSTEM'],
  'PENDING_ACCEPTANCE->CANCELLED':      ['CLIENT'],
  'ACCEPTED->PAID':                     ['SYSTEM'],
  'ACCEPTED->PAYMENT_EXPIRED':          ['SYSTEM'],
  'ACCEPTED->CANCELLED':                ['CLIENT', 'PROVIDER'],
  'PAID->ON_THE_WAY':                   ['WORKER'],
  'PAID->CANCELLED':                    ['CLIENT', 'PROVIDER', 'ADMIN'],
  'ON_THE_WAY->ARRIVED':                ['WORKER'],
  'ON_THE_WAY->CANCELLED':              ['CLIENT', 'PROVIDER', 'ADMIN'],
  'ARRIVED->IN_PROGRESS':               ['WORKER'],
  'IN_PROGRESS->AWAITING_VERIFICATION': ['WORKER'],
  'AWAITING_VERIFICATION->COMPLETED':   ['WORKER'],
  'COMPLETED->SETTLED':                 ['SYSTEM'],
  'DISPUTED->SETTLED':                  ['ADMIN'],
  'DISPUTED->REFUNDED':                 ['ADMIN'],
  'CANCELLED->REFUNDED':                ['SYSTEM'],
  // Seluruh transisi ke DISPUTED. WORKER sengaja TIDAK termasuk:
  // putusan sengketa menyangkut dana usaha, jadi pemilik yang membuka.
  'ARRIVED->DISPUTED':                  ['CLIENT', 'PROVIDER'],
  'IN_PROGRESS->DISPUTED':              ['CLIENT', 'PROVIDER'],
  'AWAITING_VERIFICATION->DISPUTED':    ['CLIENT', 'PROVIDER'],
  'COMPLETED->DISPUTED':                ['CLIENT', 'PROVIDER'],
};

// Transisi yang HANYA boleh dilakukan pekerja yang benar-benar ditugaskan,
// bukan sembarang pekerja di usaha itu. Pendamping juga tidak termasuk.
export const ASSIGNEE_ONLY_TRANSITIONS = new Set<string>([
  'PAID->ON_THE_WAY',
  'ON_THE_WAY->ARRIVED',
  'ARRIVED->IN_PROGRESS',
  'IN_PROGRESS->AWAITING_VERIFICATION',
  'AWAITING_VERIFICATION->COMPLETED',
]);

/**
 * Aturan aktor yang bergantung pada booking_mode (D70, D102): WORKER hanya
 * sah menerima order AVAILABLE_NOW. Predikat, bukan assert, karena shared
 * tidak punya AppError; pelemparan 403 dilakukan `transitionOrder()`.
 */
export function actorAllowedForMode(
  key: string,
  actor: OrderActorType,
  bookingMode: BookingMode,
): boolean {
  return !(actor === 'WORKER' && key === 'PENDING_ACCEPTANCE->ACCEPTED' && bookingMode !== 'AVAILABLE_NOW');
}
