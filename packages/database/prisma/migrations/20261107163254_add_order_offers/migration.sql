-- CreateTable
CREATE TABLE "order_offers" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "worker_id" UUID NOT NULL,
    "distance_meters" INTEGER NOT NULL,
    "offered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "declined_at" TIMESTAMPTZ(6),
    "sla_missed_at" TIMESTAMPTZ(6),

    CONSTRAINT "order_offers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_offers_worker_id_sla_missed_at_idx" ON "order_offers"("worker_id", "sla_missed_at");

-- CreateIndex
CREATE UNIQUE INDEX "order_offers_order_id_worker_id_key" ON "order_offers"("order_id", "worker_id");

-- AddForeignKey
ALTER TABLE "order_offers" ADD CONSTRAINT "order_offers_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_offers" ADD CONSTRAINT "order_offers_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "provider_workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- H94 (D102), constraint manual, sama dengan docs/migration-constraints.sql bagian 11d.
-- Penerima yang menolak dianggap sudah merespons, jadi tidak sekaligus SLA miss.
ALTER TABLE "order_offers"
  ADD CONSTRAINT chk_order_offer_outcome
  CHECK (declined_at IS NULL OR sla_missed_at IS NULL);
