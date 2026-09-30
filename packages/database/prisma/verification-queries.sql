-- ============================================================
-- KUERI VERIFIKASI V1 SAMPAI V12
--
-- Versi siap jalan dari blok komentar di akhir migration-constraints.sql.
-- Isinya SAMA, hanya sudah tidak dikomentari supaya bisa dieksekusi
-- langsung oleh scripts/verify.mjs.
--
-- Berkas ini TIDAK ikut migrasi. Tidak mengubah apa pun, hanya SELECT.
--
-- Cara jalan:  npm run db:verify
--
-- Hasil yang benar (PRD Bagian 8.3):
--   V1, V5, V6, V7, V8, V11, V12  -> NOL baris
--   V2, V3, V4, V9, V10           -> tabel hasil atau angka, untuk Bab IV
--
-- Pemisah antar kueri adalah baris penanda `-- @query`, dibaca runner.
-- ============================================================


-- @query V1 | zero | Rekonsiliasi ledger terhadap cache saldo
SELECT w.id,
       w.balance_available,
       COALESCE(SUM(t.amount_available_delta), 0) AS ledger_available,
       w.balance_pending,
       COALESCE(SUM(t.amount_pending_delta), 0)   AS ledger_pending
FROM wallets w
LEFT JOIN wallet_transactions t ON t.wallet_id = w.id
GROUP BY w.id, w.balance_available, w.balance_pending
HAVING w.balance_available <> COALESCE(SUM(t.amount_available_delta), 0)
    OR w.balance_pending   <> COALESCE(SUM(t.amount_pending_delta), 0);


-- @query V2 | table | Akurasi validasi geolokasi
SELECT radius_threshold_meters,
       COUNT(*)                                        AS total_percobaan,
       COUNT(*) FILTER (WHERE is_valid)                AS valid,
       COUNT(*) FILTER (WHERE NOT is_valid)            AS tidak_valid,
       ROUND(AVG(distance_meters), 2)                  AS rata_jarak_meter,
       ROUND(AVG(accuracy_meters), 2)                  AS rata_akurasi_gps,
       ROUND(100.0 * COUNT(*) FILTER (WHERE is_valid) / COUNT(*), 2) AS persen_valid
FROM order_checkins
GROUP BY radius_threshold_meters;


-- @query V3 | table | Performa intent extraction, dipecah tamu dan terdaftar
SELECT CASE WHEN s.user_id IS NULL THEN 'tamu' ELSE 'terdaftar' END AS jenis_sesi,
       m.gemini_model,
       COUNT(*)                              AS jumlah_pesan,
       ROUND(AVG(m.intent_confidence), 3)    AS rata_confidence,
       ROUND(AVG(m.latency_ms))              AS rata_latensi_ms,
       PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.latency_ms) AS p95_latensi_ms,
       COUNT(*) FILTER (WHERE m.extracted_intent IS NULL) AS gagal_ekstraksi
FROM chat_messages m
JOIN chat_sessions s ON s.id = m.session_id
WHERE m.role = 'ASSISTANT'
GROUP BY 1, 2;


-- @query V4 | table | Pendapatan platform beserta komposisi nominal
SELECT DATE_TRUNC('month', settled_at) AS bulan,
       COUNT(*)                        AS jumlah_order,
       SUM(listing_base_amount)        AS nilai_harga_dasar,
       SUM(options_amount)             AS nilai_opsi_tambahan,
       SUM(total_amount)               AS nilai_transaksi,
       SUM(platform_fee)               AS fee_dipungut,
       SUM(platform_fee_refunded)      AS fee_dikembalikan,
       SUM(platform_fee - platform_fee_refunded) AS pendapatan_bersih
FROM orders
WHERE status = 'SETTLED'
GROUP BY 1
ORDER BY 1;


-- @query V5 | zero | Tidak ada pekerja terikat dua pekerjaan sekaligus
SELECT assigned_worker_id, COUNT(*)
FROM orders
WHERE assigned_worker_id IS NOT NULL
  AND (status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
       OR (booking_mode = 'AVAILABLE_NOW' AND status IN ('ACCEPTED', 'PAID')))
GROUP BY assigned_worker_id
HAVING COUNT(*) > 1;


-- @query V6 | zero | Setiap provider punya pekerja aktif yang bersedia ditugaskan
SELECT p.id, p.business_name, p.provider_type
FROM provider_profiles p
WHERE p.verification_status = 'VERIFIED'
  AND NOT EXISTS (
    SELECT 1 FROM provider_workers w
    WHERE w.provider_profile_id = p.id
      AND w.membership_status = 'ACTIVE'
      AND w.accepts_assignments = TRUE
  );


-- @query V7 | zero | Tidak ada listing ACTIVE tanpa pekerja terpetakan
SELECT l.id, l.title
FROM listings l
WHERE l.status = 'ACTIVE'
  AND l.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM worker_listings wl
    JOIN provider_workers w ON w.id = wl.worker_id
    WHERE wl.listing_id = l.id
      AND w.membership_status = 'ACTIVE'
  );


-- @query V8 | zero | Tidak ada pendamping yang bentrok dengan order lain
SELECT c.worker_id, o1.id AS order_pendamping, o2.id AS order_penanggung_jawab
FROM order_crew c
JOIN orders o1 ON o1.id = c.order_id
JOIN orders o2 ON o2.assigned_worker_id = c.worker_id
WHERE o1.status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
  AND o2.status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
  AND o1.id <> o2.id;


-- @query V9 | table | Konversi sesi chat tamu jadi pendaftaran
SELECT COUNT(*)                                          AS total_sesi_tamu,
       COUNT(*) FILTER (WHERE claimed_at IS NOT NULL)     AS berlanjut_daftar,
       ROUND(100.0 * COUNT(*) FILTER (WHERE claimed_at IS NOT NULL)
             / NULLIF(COUNT(*), 0), 2)                    AS persen_konversi,
       ROUND(AVG(message_count), 1)                       AS rata_pesan_per_sesi
FROM chat_sessions
WHERE guest_token IS NOT NULL;


-- @query V10 | table | Usulan taksonomi yang jadi taksonomi resmi
SELECT request_type,
       COUNT(*)                                        AS total_usulan,
       COUNT(*) FILTER (WHERE status = 'APPROVED')     AS disetujui,
       COUNT(*) FILTER (WHERE status = 'MERGED')       AS sudah_ada,
       COUNT(*) FILTER (WHERE status = 'REJECTED')     AS ditolak,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'APPROVED')
             / NULLIF(COUNT(*), 0), 2)                 AS persen_disetujui
FROM taxonomy_requests
GROUP BY request_type;


-- @query V11 | zero | Tidak ada pesan dari bukan peserta order
SELECT m.id, m.order_id, m.sender_user_id, m.sender_role
FROM order_messages m
JOIN orders o ON o.id = m.order_id
LEFT JOIN provider_profiles p ON p.id = o.provider_profile_id
LEFT JOIN provider_workers w  ON w.id = o.assigned_worker_id
WHERE m.sender_user_id <> o.client_id
  AND m.sender_user_id <> p.user_id
  AND (w.user_id IS NULL OR m.sender_user_id <> w.user_id);


-- @query V12 | zero | Tidak ada listing melebihi batas FAQ
-- Batasnya dibaca dari platform_settings.listing_faq_max_items, dengan
-- cadangan 10 kalau barisnya belum diseed. Doknya menyebut "ganti angka 10
-- sesuai platform_settings", dan ini cara supaya tidak perlu diganti tangan.
SELECT f.listing_id, COUNT(*) AS jumlah_faq
FROM listing_faqs f
WHERE f.is_active = TRUE
GROUP BY f.listing_id
HAVING COUNT(*) > COALESCE(
  (SELECT (value #>> '{}')::int FROM platform_settings
   WHERE key = 'listing_faq_max_items'),
  10
);
