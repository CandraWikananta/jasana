/**
 * Parameter sistem `platform_settings` (PRD Bagian 3.5, D181, usulan D198 dan D199).
 *
 * SATU registri untuk seluruh kunci yang dibaca server: nilai bawaan, rentang yang boleh
 * ditulis admin, dan deskripsi. Kunci di PRD 3.5 yang tidak dibaca server (TTL token dari env,
 * parameter lokasi pekerja untuk frontend) sengaja tidak terdaftar, supaya admin tidak
 * mengubah angka yang tidak berefek apa pun.
 *
 * Nilai dibaca ulang setiap kali dibutuhkan, TANPA cache, supaya perubahan lewat
 * PATCH /admin/settings langsung berlaku di permintaan berikutnya tanpa restart dan tanpa
 * kode invalidasi. Kuerinya satu baris lewat primary key, jadi murah.
 *
 * Pembaca TIDAK menerapkan rentang: rentang hanya dijaga di jalur tulis. Kalau barisnya belum
 * diseed atau isinya bukan angka sah, dipakai nilai bawaan PRD. Aplikasi tidak boleh berhenti
 * bekerja hanya karena seed parameter belum dijalankan.
 */

import { prisma, type Prisma } from '@jasana/database';
import { logger } from '../../lib/logger';
import { AppError, Errors } from '../../lib/errors';

const iso = (value: Date) => value.toISOString();

interface SettingSpec {
  default: number;
  min: number;
  max: number;
  description: string;
}

const spec = (value: number, min: number, max: number, description: string): SettingSpec => ({ default: value, min, max, description });

/** Usulan D198. Seluruh nilai bilangan bulat. Urutan di sini = urutan GET /admin/settings. */
export const SETTING_REGISTRY = {
  platform_fee_percentage: spec(10, 0, 30, 'Komisi platform dari penyedia, persen. 0 berarti tanpa komisi'),
  geolocation_radius_meters: spec(100, 10, 1000, 'Radius toleransi validasi kedatangan, meter'),
  available_now_response_minutes: spec(5, 1, 60, 'SLA respons mode Available Now, menit'),
  scheduled_approval_hours: spec(24, 1, 72, 'SLA respons mode Scheduled, jam'),
  settlement_holding_hours: spec(24, 1, 168, 'Holding window escrow dan batas akhir membuka dispute, jam'),
  payment_window_minutes: spec(10, 5, 120, 'Batas waktu bayar setelah order diterima, menit'),
  verification_max_attempts: spec(5, 3, 10, 'Batas percobaan kode verifikasi'),
  verification_lockout_minutes: spec(15, 1, 1440, 'Durasi lockout setelah batas percobaan terlampaui, menit'),
  available_now_offer_limit: spec(5, 1, 20, 'Jumlah pekerja yang ditawari satu order mendadak'),
  worker_presence_timeout_minutes: spec(10, 1, 60, 'Toleransi putus sinyal sebelum pekerja dianggap offline, menit'),
  schedule_conflict_buffer_minutes: spec(30, 0, 240, 'Jeda perjalanan antar order Scheduled, menit'),
  email_retry_max_attempts: spec(3, 0, 10, 'Percobaan ulang cron untuk email gagal, di luar pengiriman pertama. 0 mematikan retry'),
  guest_chat_message_limit: spec(20, 1, 200, 'Batas pesan per sesi chatbot tamu'),
  guest_chat_ip_hourly_limit: spec(50, 1, 1000, 'Batas pesan chatbot per alamat IP per jam'),
  guest_chat_daily_global_limit: spec(250, 1, 500, 'Rem darurat seluruh chatbot tamu per hari kalender WITA'),
  guest_chat_session_hours: spec(24, 1, 168, 'Masa berlaku sesi chat tamu, jam'),
  listing_faq_max_items: spec(10, 1, 30, 'Batas butir FAQ aktif per listing'),
  order_message_max_length: spec(2000, 100, 2000, 'Batas panjang satu pesan dalam order, karakter. Maksimal mengikuti CHECK basis data'),
  order_message_rate_per_minute: spec(20, 1, 120, 'Batas pesan per menit per pengirim'),
  review_window_days: spec(14, 1, 90, 'Batas memberi review sejak completed_at, hari'),
  kyc_document_max_size_mb: spec(5, 1, 10, 'Batas ukuran satu dokumen e-KYC, MB'),
  dispute_evidence_max_size_mb: spec(5, 1, 10, 'Batas ukuran satu bukti dispute, MB'),
  orphan_upload_cleanup_hours: spec(24, 3, 168, 'Umur berkas tanpa baris basis data sebelum dibersihkan cron, jam'),
  withdrawal_min_amount: spec(50000, 10000, 10000000, 'Nominal minimum satu pengajuan withdrawal, rupiah'),
  withdrawal_admin_fee: spec(6500, 0, 50000, 'Admin fee flat per pengajuan withdrawal, rupiah. Harus lebih kecil dari withdrawal_min_amount'),
} as const satisfies Record<string, SettingSpec>;

export type NumericSettingKey = keyof typeof SETTING_REGISTRY;

export const SETTING_KEYS = Object.keys(SETTING_REGISTRY) as NumericSettingKey[];

/** Nilai default PRD 3.5, diturunkan dari registri. */
export const NUMERIC_SETTING_DEFAULTS = Object.fromEntries(SETTING_KEYS.map((key) => [key, SETTING_REGISTRY[key].default])) as {
  [K in NumericSettingKey]: (typeof SETTING_REGISTRY)[K]['default'];
};

/**
 * H89. Kunci yang nol-nya bermakna, yaitu yang rentangnya mulai dari 0 (tanpa komisi, tanpa jeda,
 * tanpa admin fee, retry email mati). Kunci lain tetap wajib > 0: misalnya
 * `orphan_upload_cleanup_hours = 0` akan menghapus unggahan yang baru masuk.
 */
const ZERO_ALLOWED = new Set<NumericSettingKey>(SETTING_KEYS.filter((key) => SETTING_REGISTRY[key].min === 0));

/** JSONB boleh berisi angka mentah atau string angka. */
function asValidNumber(value: unknown, allowZero: boolean): number | null {
  const parsed = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) return null;
  return parsed > 0 || (allowZero && parsed === 0) ? parsed : null;
}

function effectiveValue(key: NumericSettingKey, stored: unknown): number | null {
  return asValidNumber(stored, ZERO_ALLOWED.has(key));
}

export async function getNumberSetting(key: NumericSettingKey): Promise<number> {
  const row = await prisma.platformSetting.findUnique({ where: { key }, select: { value: true } });
  if (!row) return NUMERIC_SETTING_DEFAULTS[key];

  const value = effectiveValue(key, row.value);
  if (value === null) {
    logger.warn({ key, value: row.value }, 'Nilai platform_settings tidak sah, memakai default PRD');
    return NUMERIC_SETTING_DEFAULTS[key];
  }
  return value;
}

// ============================================================
// GET dan PATCH /admin/settings
// ============================================================

export interface SettingDto {
  key: NumericSettingKey;
  value: number;
  default_value: number;
  min: number;
  max: number;
  description: string;
  source: 'DATABASE' | 'DEFAULT';
  updated_by: { id: string; full_name: string } | null;
  updated_at: string | null;
}

export type SettingsPatch = Partial<Record<NumericSettingKey, number>>;

type Client = Prisma.TransactionClient;

const ROW_SELECT = {
  key: true,
  value: true,
  updatedAt: true,
  updater: { select: { id: true, fullName: true } },
} as const satisfies Prisma.PlatformSettingSelect;

async function readAll(db: Client): Promise<SettingDto[]> {
  const rows = await db.platformSetting.findMany({ where: { key: { in: SETTING_KEYS } }, select: ROW_SELECT });
  const byKey = new Map(rows.map((row) => [row.key, row]));
  return SETTING_KEYS.map((key) => {
    const entry = SETTING_REGISTRY[key];
    const row = byKey.get(key);
    const stored = row ? effectiveValue(key, row.value) : null;
    return {
      key,
      value: stored ?? entry.default,
      default_value: entry.default,
      min: entry.min,
      max: entry.max,
      description: entry.description,
      source: stored === null ? 'DEFAULT' : 'DATABASE',
      updated_by: row?.updater ? { id: row.updater.id, full_name: row.updater.fullName } : null,
      updated_at: row ? iso(row.updatedAt) : null,
    };
  });
}

export function listSettings(): Promise<SettingDto[]> {
  return readAll(prisma);
}

/**
 * Kunci advisory lock transaksi PATCH (usulan D199, menutup H119). Konstan, dipakai hanya di sini,
 * supaya dua PATCH yang bersamaan diserialkan: pemeriksaan antarkunci kedua membaca hasil yang
 * pertama, bukan nilai lama.
 */
export const SETTINGS_LOCK_KEY = 1_018_100;

/**
 * Usulan D199. Seluruh kunci ditulis atomik di satu transaksi. Relasi antarkunci diperiksa
 * terhadap nilai efektif SESUDAH perubahan, sehingga dua kunci yang saling bergantung bisa
 * diubah bersamaan. Rentang per kunci sudah dijaga Zod.
 */
export async function updateSettings(adminId: string, patch: SettingsPatch): Promise<SettingDto[]> {
  const keys = Object.keys(patch) as NumericSettingKey[];
  if (keys.length === 0) throw Errors.validation([{ path: '', message: 'Minimal satu parameter' }]);

  return prisma.$transaction(async (tx) => {
    // $executeRaw: pg_advisory_xact_lock mengembalikan void, yang tidak bisa dibaca $queryRaw.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${SETTINGS_LOCK_KEY}::bigint)`;

    const current = new Map((await readAll(tx)).map((s) => [s.key, s.value]));
    const after = (key: NumericSettingKey) => patch[key] ?? current.get(key)!;

    // D84: net_amount = amount - admin_fee harus positif untuk nominal minimum sekalipun.
    if ('withdrawal_admin_fee' in patch || 'withdrawal_min_amount' in patch) {
      if (after('withdrawal_admin_fee') >= after('withdrawal_min_amount')) {
        const path = 'withdrawal_admin_fee' in patch ? 'withdrawal_admin_fee' : 'withdrawal_min_amount';
        throw Errors.validation([
          {
            path,
            message: `withdrawal_admin_fee (${after('withdrawal_admin_fee')}) harus lebih kecil dari withdrawal_min_amount (${after('withdrawal_min_amount')})`,
          },
        ]);
      }
    }

    // V12 membaca kunci ini. Menurunkannya di bawah data yang ada menciptakan pelanggaran.
    const faqLimit = patch.listing_faq_max_items;
    if (faqLimit !== undefined) {
      const [top] = await tx.listingFaq.groupBy({
        by: ['listingId'],
        where: { isActive: true },
        _count: { _all: true },
        orderBy: { _count: { listingId: 'desc' } },
        take: 1,
      });
      const most = top?._count._all ?? 0;
      if (faqLimit < most) {
        throw new AppError(
          'SETTING_CONFLICTS_WITH_DATA',
          `listing_faq_max_items tidak boleh di bawah ${most}, jumlah FAQ aktif terbanyak pada satu listing saat ini`,
          { details: [{ path: 'listing_faq_max_items', message: `Minimal ${most}` }] },
        );
      }
    }

    for (const key of keys) {
      const value = patch[key]!;
      await tx.platformSetting.upsert({
        where: { key },
        create: { key, value, description: SETTING_REGISTRY[key].description, updatedBy: adminId },
        update: { value, description: SETTING_REGISTRY[key].description, updatedBy: adminId },
      });
    }
    return readAll(tx);
  });
}
