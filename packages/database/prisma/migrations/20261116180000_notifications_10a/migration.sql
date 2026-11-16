-- Sesi 10a. Notifikasi in-app dan retry email [D177, D178, H37]
-- ------------------------------------------------------------
-- 1. Nilai enum ORDER_MESSAGE untuk notifikasi pesan dalam order (10b).
--    ADD VALUE boleh di dalam transaksi sejak PostgreSQL 12, asalkan nilai
--    barunya tidak dipakai di transaksi yang sama. Migrasi ini tidak memakainya.
ALTER TYPE "notification_type" ADD VALUE 'ORDER_MESSAGE';

-- 2. Hitungan retry email. Pengiriman pertama tidak ikut dihitung.
ALTER TABLE "notifications" ADD COLUMN "email_attempts" INTEGER NOT NULL DEFAULT 0;

-- 3. Ditulis tangan, Prisma tidak bisa menyatakan CHECK. Baris IN_APP tidak
--    pernah dikirim ulang, jadi hitungannya selalu nol.
ALTER TABLE notifications
  ADD CONSTRAINT chk_notification_email_attempts
  CHECK (email_attempts >= 0 AND (channel = 'EMAIL' OR email_attempts = 0));
