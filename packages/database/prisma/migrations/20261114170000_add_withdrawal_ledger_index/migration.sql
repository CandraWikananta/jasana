-- ------------------------------------------------------------
-- Satu withdrawal hanya boleh punya satu WITHDRAWAL dan satu
-- WITHDRAWAL_REVERSAL                                      [H102]
-- ------------------------------------------------------------
-- D134. Pertahanan lapis terakhir di level LEDGER, pasangan H3 untuk
-- withdrawal. Tanpa ini, webhook FAILED yang dikirim ulang Xendit atau
-- bug di kode bisa mengembalikan saldo dua kali.
-- Partial index, jadi ditulis tangan: Prisma tidak bisa menyatakannya.

CREATE UNIQUE INDEX uniq_withdrawal_event_per_withdrawal
  ON wallet_transactions (withdrawal_id, type)
  WHERE withdrawal_id IS NOT NULL
    AND type IN ('WITHDRAWAL', 'WITHDRAWAL_REVERSAL');
