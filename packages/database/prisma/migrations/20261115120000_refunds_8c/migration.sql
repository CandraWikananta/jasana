-- Sesi 8c. Kolom refund untuk usulan D141 dan D142, dihasilkan dari schema.prisma.
-- D141: initiated_by null berarti dipicu sistem (refund pembayaran telat D119).
-- D142: catatan transfer dan admin yang menandai refund manual selesai.

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "completed_by" UUID,
ADD COLUMN     "completion_note" TEXT,
ALTER COLUMN "initiated_by" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_completed_by_fkey" FOREIGN KEY ("completed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ------------------------------------------------------------
-- Satu order hanya boleh punya satu REFUND_DEDUCTION        [H101]
-- ------------------------------------------------------------
-- D132. REFUND_DEDUCTION ditulis di transisi pemicu (T9, T11, T20
-- parsial, T21), paling banyak sekali per order. Pasangan H3 untuk
-- refund: tanpa ini, bug atau pemanggilan ganda bisa memotong saldo
-- pending dua kali. Partial index, jadi ditulis tangan.

CREATE UNIQUE INDEX uniq_refund_deduction_per_order
  ON wallet_transactions (order_id)
  WHERE order_id IS NOT NULL
    AND type = 'REFUND_DEDUCTION';
