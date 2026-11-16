-- Sesi 9c. Batas waktu wajib hanya untuk sesi tamu yang BELUM diklaim [H63, H68]
-- ------------------------------------------------------------
-- D155: klaim mengisi user_id dan claimed_at, lalu mengosongkan expires_at.
-- guest_token tetap disimpan karena V9 menghitung sesi tamu dari kolom itu.
-- Constraint lama (guest_token IS NULL OR expires_at IS NOT NULL) menolak
-- kombinasi itu. Definisi tamu disamakan dengan D164 dan V3: user_id NULL.
-- Sesi yang belum diklaim tetap wajib punya expires_at, sesi terdaftar dan
-- sesi hasil klaim tidak. Ditulis tangan, Prisma tidak bisa menyatakan CHECK.

ALTER TABLE chat_sessions DROP CONSTRAINT chk_guest_session_expiry;

ALTER TABLE chat_sessions
  ADD CONSTRAINT chk_guest_session_expiry
  CHECK (user_id IS NOT NULL OR guest_token IS NULL OR expires_at IS NOT NULL);
