-- ============================================================
-- Migrasi SQL Manual: Constraint yang Tidak Didukung Prisma
--
-- Platform Marketplace Jasa On-Demand "Jasana"
-- I Nyoman Gede Candra Wikananta - 2305551065
--
-- VERSI 2.6. Menyesuaikan keputusan D31 sampai D80.
-- D80 tidak menambah constraint basis data: validasi unggahan berkas
-- dilakukan service layer (H78, H79) dan pembersihan berkas yatim lewat cron (H80).
-- Rujukan lengkap: Keputusan-Desain-Sistem.md
--
-- CARA PAKAI (monorepo):
--   1. npx prisma migrate dev --name init
--   2. npx prisma migrate dev --create-only --name add_integrity_constraints
--   3. Salin isi file ini ke migration.sql yang baru dibuat
--   4. npx prisma migrate dev
--
-- Prisma tidak mendukung partial unique index maupun CHECK constraint.
-- Tanpa file ini, DUA BELAS pengaman kritikal TIDAK AKTIF dan sistem bisa
-- kehilangan uang, punya saldo tidak konsisten, atau menugaskan satu
-- pekerja ke dua pekerjaan sekaligus.
--
-- YANG BERUBAH DARI VERSI SEBELUMNYA
--   H4   kunci in-flight PINDAH dari provider ke PEKERJA (D40).
--        Index lama uniq_inflight_order_per_provider HARUS DIBUANG, karena
--        justru memblokir fitur yang diminta Pembimbing 1: usaha dengan
--        lima pekerja memang harus bisa memegang lima order paralel.
--   H5   nominal order memakai listing_base_amount + options_amount (D73),
--        menggantikan base_price.
--   H23  eksklusivitas keanggotaan pekerja, baru (D36).
--   H24  assigned_worker_id wajib terisi mulai ACCEPTED, baru (D42).
--   H32  unique pemetaan pekerja ke listing, baru (D50).
--   H33  unique token verifikasi email, baru (D63).
--   H44  unique kru order, baru (D69).
--   H53  komposisi nominal order, baru (D73).
--   H54  unique harga opsi per listing, baru (D72).
--   H62  unique refresh token, baru (D76).
--   H63  sesi chat wajib punya identitas, baru (D77).
--   H69  peran dan panjang pesan dalam order, baru (D79).
-- ============================================================


-- ------------------------------------------------------------
-- 1. Saldo wallet tidak boleh negatif                      [H1]
-- ------------------------------------------------------------
-- Pengaman terakhir kalau ada bug di service layer yang mengizinkan
-- withdrawal melebihi saldo.

ALTER TABLE wallets
  ADD CONSTRAINT chk_wallet_balance_non_negative
  CHECK (balance_available >= 0 AND balance_pending >= 0);


-- ------------------------------------------------------------
-- 2. Satu order hanya boleh punya satu pembayaran lunas     [H2]
-- ------------------------------------------------------------
-- Skenario nyata tanpa ini: client membuka invoice lama di tab lain yang
-- belum expired, lalu membayar keduanya. Sistem melakukan ESCROW_HOLD dua kali.

CREATE UNIQUE INDEX uniq_payment_paid_per_order
  ON payments (order_id)
  WHERE status = 'PAID';

-- Sekalian cegah dua invoice aktif bersamaan untuk order yang sama.
CREATE UNIQUE INDEX uniq_payment_pending_per_order
  ON payments (order_id)
  WHERE status = 'PENDING';


-- ------------------------------------------------------------
-- 3. Satu order hanya boleh punya satu HOLD dan satu RELEASE [H3]
-- ------------------------------------------------------------
-- Pertahanan lapis terakhir di level LEDGER, tidak bergantung pada
-- tabel payments di atasnya. Berlaku selamanya, termasuk terhadap
-- replay manual atau bug di kode.

CREATE UNIQUE INDEX uniq_escrow_event_per_order
  ON wallet_transactions (order_id, type)
  WHERE order_id IS NOT NULL
    AND type IN ('ESCROW_HOLD', 'ESCROW_RELEASE');


-- ------------------------------------------------------------
-- 4. Satu PEKERJA tidak boleh mengerjakan dua order sekaligus [H4]
-- ------------------------------------------------------------
-- D40. KUNCINYA PINDAH DARI PROVIDER KE PEKERJA.
--
-- Kalau index lama (pada provider_profile_id) dipertahankan, usaha dengan
-- lima pekerja tetap hanya bisa memegang satu order, dan fitur tenaga kerja
-- yang diminta Pembimbing 1 justru diblokir oleh constraint sendiri.
--
-- Predikat bergantung status DAN mode, tidak berubah dari versi sebelumnya:
--   ON_THE_WAY..AWAITING_VERIFICATION = pekerjaan fisik sedang berlangsung
--                                       (berlaku kedua mode)
--   ACCEPTED, PAID hanya untuk AVAILABLE_NOW, karena order SCHEDULED bisa
--   berstatus PAID berhari-hari sebelum jadwalnya. Kalau ikut dihitung,
--   mode Scheduled praktis tidak bisa dipakai.
--
-- HARUS SATU INDEX. Kalau dipecah dua, pekerja yang sedang IN_PROGRESS
-- masih bisa menerima order Available Now baru, karena keduanya jatuh di
-- index berbeda dan tidak saling bertabrakan.
--
-- Pelanggaran (Prisma P2002) dipetakan ke 409 WORKER_HAS_INFLIGHT_ORDER,
-- bukan 500.

CREATE UNIQUE INDEX uniq_inflight_order_per_worker
  ON orders (assigned_worker_id)
  WHERE assigned_worker_id IS NOT NULL
    AND (status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
         OR (booking_mode = 'AVAILABLE_NOW' AND status IN ('ACCEPTED', 'PAID')));

-- CATATAN PENTING soal apa yang TIDAK dijaga di sini.
-- Bentrok JADWAL antar order SCHEDULED dijaga di service layer (H25), bukan
-- di sini, karena unique index tidak bisa memeriksa tumpang tindih RENTANG
-- waktu, hanya kesamaan nilai. Solusi kedapnya butuh EXCLUDE constraint
-- dengan ekstensi btree_gist dan kolom tstzrange baru, tidak sebanding
-- dengan cakupan penelitian ini. Celah race condition-nya kecil (dua order
-- diterima pada detik yang sama) dan dampaknya jadwal tabrakan, bukan dana
-- hilang. Ditulis eksplisit sebagai batasan penelitian (H31).
--
-- Pekerja PENDAMPING (order_crew) juga tidak ikut index ini, karena index
-- hanya melihat assigned_worker_id. Penyaringannya di service layer (H45).


-- ------------------------------------------------------------
-- 5. Konsistensi nominal order                          [H5, H53]
-- ------------------------------------------------------------
-- D73. Model komisi dari provider, dengan harga bertingkat per opsi:
--   listing_base_amount = harga listing saat dipesan, TANPA opsi
--   options_amount      = jumlah seluruh delta opsi yang dipilih client
--   total_amount        = listing_base_amount + options_amount  (dibayar client)
--   platform_fee        = total_amount * 10 persen
--   provider_earning    = total_amount - platform_fee
--
-- DUA INVARIANT TERPISAH, dan itu disengaja:
--   yang pertama menjaga sisi client   (dari mana angkanya)
--   yang kedua  menjaga sisi pembagian (ke mana angkanya pergi)
-- Kalau ada bug, langsung ketahuan sisi mana yang salah tanpa menelusuri
-- keduanya.

-- H53, baru.
ALTER TABLE orders
  ADD CONSTRAINT chk_order_total_composition
  CHECK (total_amount = listing_base_amount + options_amount);

-- H5, tidak berubah.
ALTER TABLE orders
  ADD CONSTRAINT chk_order_amount_consistent
  CHECK (total_amount = provider_earning + platform_fee);

-- Disesuaikan: base_price diganti listing_base_amount, options_amount ditambahkan.
ALTER TABLE orders
  ADD CONSTRAINT chk_order_amount_non_negative
  CHECK (listing_base_amount >= 0 AND options_amount >= 0
         AND platform_fee >= 0 AND total_amount >= 0
         AND provider_earning >= 0);

-- Fee yang dikembalikan tidak boleh melebihi fee yang dipungut.
ALTER TABLE orders
  ADD CONSTRAINT chk_platform_fee_refund_bound
  CHECK (platform_fee_refunded >= 0 AND platform_fee_refunded <= platform_fee);


-- ------------------------------------------------------------
-- 6. Ledger harus bergerak, dan rating harus valid          [H6]
-- ------------------------------------------------------------
-- Baris ledger yang kedua deltanya nol tidak punya makna dan cuma
-- mengotori rekonsiliasi.

ALTER TABLE wallet_transactions
  ADD CONSTRAINT chk_ledger_delta_not_both_zero
  CHECK (amount_available_delta <> 0 OR amount_pending_delta <> 0);

ALTER TABLE reviews
  ADD CONSTRAINT chk_review_rating_range
  CHECK (rating BETWEEN 1 AND 5);

ALTER TABLE order_checkins
  ADD CONSTRAINT chk_checkin_distance_non_negative
  CHECK (distance_meters >= 0 AND radius_threshold_meters > 0);


-- ------------------------------------------------------------
-- 6b. Konsistensi kolom lokasi order
-- ------------------------------------------------------------
-- location_accuracy_m hanya bermakna kalau koordinat berasal dari GPS.
-- Kalau sumbernya alamat tersimpan atau pin manual, tidak ada akurasi GPS
-- untuk dicatat, jadi harus NULL. Ini mencegah data pengukuran Bab IV
-- tercampur antara yang benar-benar dari GPS dan yang bukan.

ALTER TABLE orders
  ADD CONSTRAINT chk_order_location_accuracy
  CHECK (
    (location_source = 'CURRENT_LOCATION')
    OR (location_accuracy_m IS NULL)
  );

-- Panduan harga: kalau keduanya diisi, min tidak boleh melebihi max.
ALTER TABLE subcategories
  ADD CONSTRAINT chk_subcategory_price_range
  CHECK (
    suggested_price_min IS NULL
    OR suggested_price_max IS NULL
    OR suggested_price_min <= suggested_price_max
  );


-- ------------------------------------------------------------
-- 7. Penugasan pekerja wajib terisi begitu order diterima  [H24]
-- ------------------------------------------------------------
-- D42. Penugasan dilakukan saat ACCEPT, bukan setelah pembayaran.
--
-- Alasannya: accept adalah JANJI KETERSEDIAAN. Kalau assign ditunda sampai
-- setelah bayar, provider bisa menerima lima order untuk jam yang sama
-- padahal hanya punya tiga pekerja, dan dua di antaranya harus dibatalkan
-- SETELAH uang masuk escrow. Itu persis beban refund yang D19 dirancang
-- untuk dihindari.
--
-- Berlaku sama untuk kedua mode, karena klaim Available Now (D70) mengisi
-- assigned_worker_id pada transisi yang sama dengan ACCEPTED.

ALTER TABLE orders
  ADD CONSTRAINT chk_order_worker_assigned
  CHECK (
    status IN ('PENDING_ACCEPTANCE', 'REJECTED', 'EXPIRED', 'CANCELLED')
    OR assigned_worker_id IS NOT NULL
  );


-- ------------------------------------------------------------
-- 8. Eksklusivitas keanggotaan pekerja                     [H23]
-- ------------------------------------------------------------
-- D36. Satu orang hanya boleh punya SATU keanggotaan aktif.
--
-- Kenapa PARTIAL dan bukan unique biasa pada user_id: kalau unique biasa,
-- orang yang keluar dari satu usaha tidak akan pernah bisa bergabung ke
-- usaha lain, karena baris lamanya tetap ada. Dengan predikat ACTIVE,
-- keanggotaan jadi eksklusif TAPI TIDAK PERMANEN.
--
-- Efek samping yang menguntungkan: orang boleh melamar ke beberapa usaha
-- sekaligus, dan begitu satu menerima, lamaran lain otomatis gugur karena
-- bertabrakan dengan index ini. Tidak perlu logika tambahan.
--
-- Kenapa aturan ini ada sama sekali: kalau boleh lintas usaha, is_available
-- jadi ambigu (orang yang sama idle di usaha A padahal sedang dikirim oleh
-- usaha B), dan yang lebih berat, H4 di atas PECAH karena index mengunci
-- per BARIS pekerja, bukan per orang.

CREATE UNIQUE INDEX uniq_active_worker_membership
  ON provider_workers (user_id)
  WHERE membership_status = 'ACTIVE';


-- ------------------------------------------------------------
-- 9. Integritas pemetaan, kru, dan harga opsi     [H32, H44, H54]
-- ------------------------------------------------------------
-- Ketiganya sebenarnya sudah dinyatakan @@unique di schema.prisma dan akan
-- dibuat prisma migrate. Blok ini memakai IF NOT EXISTS supaya aman
-- dijalankan berurutan, sekaligus jadi dokumentasi terpusat bahwa ketiga
-- aturan ini memang disengaja.

-- H32 (D50). Satu pekerja tidak boleh dipetakan dua kali ke listing yang sama.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_worker_listing
  ON worker_listings (worker_id, listing_id);

-- H44 (D69). Satu pekerja tidak boleh tercatat dua kali sebagai pendamping
-- pada order yang sama.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_order_crew_member
  ON order_crew (order_id, worker_id);

-- H54 (D72). Satu opsi satu harga per listing.
-- CATATAN: option_value NULL untuk BOOLEAN dan PER_UNIT. Di PostgreSQL,
-- NULL tidak pernah sama dengan NULL, jadi unique biasa TIDAK mencegah dua
-- baris ber-option_value NULL pada attribute_key yang sama. Karena itu
-- ditambah satu partial unique khusus baris NULL.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_listing_option_price
  ON listing_option_prices (listing_id, attribute_key, option_value);

CREATE UNIQUE INDEX uniq_listing_option_price_null_value
  ON listing_option_prices (listing_id, attribute_key)
  WHERE option_value IS NULL;

-- Delta harga tidak boleh negatif. Opsi hanya menambah, tidak pernah
-- mengurangi, supaya total tidak bisa jatuh di bawah harga listing.
ALTER TABLE listing_option_prices
  ADD CONSTRAINT chk_option_price_delta_non_negative
  CHECK (price_delta >= 0);


-- ------------------------------------------------------------
-- 10. Integritas token akun                           [H33, H62]
-- ------------------------------------------------------------
-- Sudah dinyatakan @unique di schema.prisma. Ditulis ulang dengan
-- IF NOT EXISTS sebagai dokumentasi.
--
-- Token DI-HASH, bukan dienkripsi (D63). Kalau isi basis data bocor, hash
-- tidak bisa dipakai, sama alasannya dengan password. Bandingkan dengan
-- orders.verification_code_encrypted yang HARUS reversible karena client
-- perlu melihatnya berulang kali.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_verification_token_hash
  ON verification_tokens (token_hash);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_refresh_token_hash
  ON refresh_tokens (token_hash);

-- Masa berlaku token harus di masa depan saat dibuat.
ALTER TABLE verification_tokens
  ADD CONSTRAINT chk_verification_token_expiry
  CHECK (expires_at > created_at);

ALTER TABLE refresh_tokens
  ADD CONSTRAINT chk_refresh_token_expiry
  CHECK (expires_at > created_at);


-- ------------------------------------------------------------
-- 11. Sesi chat wajib punya identitas                      [H63]
-- ------------------------------------------------------------
-- D77 (arahan Pembimbing 1). chat_sessions.user_id jadi NULLABLE supaya
-- tamu bisa bertanya sebelum punya akun. Tapi sesi tanpa identitas sama
-- sekali tidak boleh ada, karena rate limiting per sesi bergantung padanya.

ALTER TABLE chat_sessions
  ADD CONSTRAINT chk_chat_session_identity
  CHECK (user_id IS NOT NULL OR guest_token IS NOT NULL);

-- Sesi tamu wajib punya batas waktu, sesi terdaftar tidak perlu.
ALTER TABLE chat_sessions
  ADD CONSTRAINT chk_guest_session_expiry
  CHECK (guest_token IS NULL OR expires_at IS NOT NULL);


-- ------------------------------------------------------------
-- 11b. Pesan dalam order                                   [H69]
-- ------------------------------------------------------------
-- D79. Pesan dalam order antara client dan penyedia, satu percakapan per order.
--
-- ADMIN dan SYSTEM sengaja TIDAK boleh mengirim. Admin membaca saja saat
-- menangani dispute, dan komunikasinya lewat disputes.resolution_note.
-- Kalau ADMIN boleh mengirim, percakapan jadi tiga sisi dan kolom read_at
-- (yang artinya "dibaca sisi lawan") jadi ambigu.
--
-- senderRole memakai enum order_actor_type yang sudah ada, tidak perlu enum
-- baru, tapi HARUS dibatasi lewat CHECK karena enumnya punya lima nilai.

ALTER TABLE order_messages
  ADD CONSTRAINT chk_order_message_sender_role
  CHECK (sender_role IN ('CLIENT', 'PROVIDER', 'WORKER'));

-- Pesan kosong tidak punya makna, dan batas panjang mencegah satu pesan
-- raksasa membebani muatan Socket.IO.
ALTER TABLE order_messages
  ADD CONSTRAINT chk_order_message_content_length
  CHECK (char_length(content) BETWEEN 1 AND 2000);

-- CATATAN: MASA AKTIF pesan (hanya boleh mengirim antara ACCEPTED dan sebelum
-- settlement_due_at lewat) TIDAK dijaga di sini, melainkan di service layer
-- (H70), karena bergantung pada status order yang berubah-ubah dan pada
-- perbandingan waktu terhadap now(). CHECK constraint tidak boleh memakai
-- fungsi yang tidak immutable seperti now().
--
-- Begitu juga dengan PESERTA (H71): pengirim wajib client pemilik order,
-- pemilik provider, atau assigned_worker_id. Pendamping dan pekerja lain di
-- usaha yang sama DITOLAK. Ini pemeriksaan join yang tidak bisa dinyatakan
-- sebagai CHECK constraint per baris.


-- ------------------------------------------------------------
-- 11c. FAQ listing                                          [H73]
-- ------------------------------------------------------------
-- D78. Provider menulis tanya jawab di muka, terbaca semua calon client.

ALTER TABLE listing_faqs
  ADD CONSTRAINT chk_listing_faq_content
  CHECK (char_length(question) BETWEEN 1 AND 200
         AND char_length(answer) BETWEEN 1 AND 2000);

-- CATATAN: BATAS JUMLAH butir per listing (listing_faq_max_items) dijaga
-- service layer, karena CHECK constraint per baris tidak bisa menghitung
-- jumlah baris lain dalam tabel yang sama.


-- ------------------------------------------------------------
-- 12. Index GIN untuk atribut dinamis                      [H18]
-- ------------------------------------------------------------
-- Tanpa ini, fitur filter berbasis atribut dinamis akan melakukan
-- full table scan dan hasil stress testing-mu akan jelek.
--
-- CATATAN: kalau versi Prisma-mu sudah mendukung
--   @@index([attributes(ops: JsonbOps)], type: Gin)
-- maka index ini sudah dibuat oleh prisma migrate dan blok di bawah
-- bisa dilewati. Cek dulu dengan: \di idx_listing_attributes

CREATE INDEX IF NOT EXISTS idx_listing_attributes
  ON listings USING GIN (attributes);


-- ============================================================
-- KUERI VERIFIKASI
-- Jalankan setelah seeding dan setelah pengujian, untuk Bab IV.
-- ============================================================

-- V1. Rekonsiliasi ledger terhadap cache saldo.
--     Hasil yang benar: NOL baris. Kalau ada baris keluar, ada bug.
--
-- SELECT w.id,
--        w.balance_available,
--        COALESCE(SUM(t.amount_available_delta), 0) AS ledger_available,
--        w.balance_pending,
--        COALESCE(SUM(t.amount_pending_delta), 0)   AS ledger_pending
-- FROM wallets w
-- LEFT JOIN wallet_transactions t ON t.wallet_id = w.id
-- GROUP BY w.id, w.balance_available, w.balance_pending
-- HAVING w.balance_available <> COALESCE(SUM(t.amount_available_delta), 0)
--     OR w.balance_pending   <> COALESCE(SUM(t.amount_pending_delta), 0);


-- V2. Akurasi validasi geolokasi, untuk tabel hasil di Bab IV.
--     Disesuaikan: sekarang bisa dipecah per pekerja, bukan per provider.
--
-- SELECT radius_threshold_meters,
--        COUNT(*)                                        AS total_percobaan,
--        COUNT(*) FILTER (WHERE is_valid)                AS valid,
--        COUNT(*) FILTER (WHERE NOT is_valid)            AS tidak_valid,
--        ROUND(AVG(distance_meters), 2)                  AS rata_jarak_meter,
--        ROUND(AVG(accuracy_meters), 2)                  AS rata_akurasi_gps,
--        ROUND(100.0 * COUNT(*) FILTER (WHERE is_valid) / COUNT(*), 2) AS persen_valid
-- FROM order_checkins
-- GROUP BY radius_threshold_meters;


-- V3. Performa dan akurasi intent extraction chatbot, untuk Bab IV.
--     Disesuaikan D77: dipecah antara sesi tamu dan sesi terdaftar.
--
-- SELECT CASE WHEN s.user_id IS NULL THEN 'tamu' ELSE 'terdaftar' END AS jenis_sesi,
--        m.gemini_model,
--        COUNT(*)                              AS jumlah_pesan,
--        ROUND(AVG(m.intent_confidence), 3)    AS rata_confidence,
--        ROUND(AVG(m.latency_ms))              AS rata_latensi_ms,
--        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY m.latency_ms) AS p95_latensi_ms,
--        COUNT(*) FILTER (WHERE m.extracted_intent IS NULL) AS gagal_ekstraksi
-- FROM chat_messages m
-- JOIN chat_sessions s ON s.id = m.session_id
-- WHERE m.role = 'ASSISTANT'
-- GROUP BY 1, 2;


-- V4. Pendapatan platform, untuk fitur Laporan Pendapatan Platform.
--     Disesuaikan D73: komposisi nominal ikut ditampilkan.
--
-- SELECT DATE_TRUNC('month', settled_at) AS bulan,
--        COUNT(*)                        AS jumlah_order,
--        SUM(listing_base_amount)        AS nilai_harga_dasar,
--        SUM(options_amount)             AS nilai_opsi_tambahan,
--        SUM(total_amount)               AS nilai_transaksi,
--        SUM(platform_fee)               AS fee_dipungut,
--        SUM(platform_fee_refunded)      AS fee_dikembalikan,
--        SUM(platform_fee - platform_fee_refunded) AS pendapatan_bersih
-- FROM orders
-- WHERE status = 'SETTLED'
-- GROUP BY 1
-- ORDER BY 1;


-- V5. Tidak ada PEKERJA yang terikat dua pekerjaan sekaligus.
--     Hasil yang benar: NOL baris.
--     Disesuaikan D40: dikelompokkan per assigned_worker_id, bukan provider.
--
-- SELECT assigned_worker_id, COUNT(*)
-- FROM orders
-- WHERE assigned_worker_id IS NOT NULL
--   AND (status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
--        OR (booking_mode = 'AVAILABLE_NOW' AND status IN ('ACCEPTED', 'PAID')))
-- GROUP BY assigned_worker_id
-- HAVING COUNT(*) > 1;


-- V6. Setiap provider punya minimal satu pekerja aktif yang bersedia
--     ditugaskan (D39, H27). Hasil yang benar: NOL baris.
--
-- SELECT p.id, p.business_name, p.provider_type
-- FROM provider_profiles p
-- WHERE p.verification_status = 'VERIFIED'
--   AND NOT EXISTS (
--     SELECT 1 FROM provider_workers w
--     WHERE w.provider_profile_id = p.id
--       AND w.membership_status = 'ACTIVE'
--       AND w.accepts_assignments = TRUE
--   );


-- V7. Tidak ada listing ACTIVE tanpa pekerja terpetakan (D53, H39).
--     Hasil yang benar: NOL baris.
--
-- SELECT l.id, l.title
-- FROM listings l
-- WHERE l.status = 'ACTIVE'
--   AND l.deleted_at IS NULL
--   AND NOT EXISTS (
--     SELECT 1
--     FROM worker_listings wl
--     JOIN provider_workers w ON w.id = wl.worker_id
--     WHERE wl.listing_id = l.id
--       AND w.membership_status = 'ACTIVE'
--   );


-- V8. Tidak ada pekerja yang jadi pendamping pada order berjalan sekaligus
--     memegang order lain sebagai penanggung jawab (D69, H45).
--     Hasil yang benar: NOL baris.
--     Ini yang TIDAK dijaga database, jadi wajib diperiksa manual.
--
-- SELECT c.worker_id, o1.id AS order_pendamping, o2.id AS order_penanggung_jawab
-- FROM order_crew c
-- JOIN orders o1 ON o1.id = c.order_id
-- JOIN orders o2 ON o2.assigned_worker_id = c.worker_id
-- WHERE o1.status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
--   AND o2.status IN ('ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'AWAITING_VERIFICATION')
--   AND o1.id <> o2.id;


-- V9. Konversi sesi chat tamu jadi pendaftaran akun (D77, H68).
--     Bukan pemeriksaan integritas, melainkan METRIK untuk Bab IV yang
--     menjawab "apa gunanya chatbot ini" dengan angka.
--
-- SELECT COUNT(*)                                          AS total_sesi_tamu,
--        COUNT(*) FILTER (WHERE claimed_at IS NOT NULL)    AS berlanjut_daftar,
--        ROUND(100.0 * COUNT(*) FILTER (WHERE claimed_at IS NOT NULL)
--              / NULLIF(COUNT(*), 0), 2)                   AS persen_konversi,
--        ROUND(AVG(message_count), 1)                      AS rata_pesan_per_sesi
-- FROM chat_sessions
-- WHERE guest_token IS NOT NULL;


-- V10. Usulan taksonomi dari lapangan yang jadi taksonomi resmi (D74).
--      Bukti terukur bahwa Hybrid Approach bisa tumbuh mengikuti kebutuhan
--      nyata TANPA perubahan skema.
--
-- SELECT request_type,
--        COUNT(*)                                        AS total_usulan,
--        COUNT(*) FILTER (WHERE status = 'APPROVED')     AS disetujui,
--        COUNT(*) FILTER (WHERE status = 'MERGED')       AS sudah_ada,
--        COUNT(*) FILTER (WHERE status = 'REJECTED')     AS ditolak,
--        ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'APPROVED')
--              / NULLIF(COUNT(*), 0), 2)                 AS persen_disetujui
-- FROM taxonomy_requests
-- GROUP BY request_type;


-- V11. Tidak ada pesan dari pihak yang bukan peserta order (D79, H71).
--      Hasil yang benar: NOL baris.
--      Ini yang TIDAK dijaga basis data, jadi wajib diperiksa manual.
--
-- SELECT m.id, m.order_id, m.sender_user_id, m.sender_role
-- FROM order_messages m
-- JOIN orders o ON o.id = m.order_id
-- LEFT JOIN provider_profiles p ON p.id = o.provider_profile_id
-- LEFT JOIN provider_workers w  ON w.id = o.assigned_worker_id
-- WHERE m.sender_user_id <> o.client_id
--   AND m.sender_user_id <> p.user_id
--   AND (w.user_id IS NULL OR m.sender_user_id <> w.user_id);


-- V12. Tidak ada listing yang melebihi batas jumlah FAQ (D78, H73).
--      Ganti angka 10 sesuai platform_settings.listing_faq_max_items.
--      Hasil yang benar: NOL baris.
--
-- SELECT listing_id, COUNT(*) AS jumlah_faq
-- FROM listing_faqs
-- WHERE is_active = TRUE
-- GROUP BY listing_id
-- HAVING COUNT(*) > 10;
