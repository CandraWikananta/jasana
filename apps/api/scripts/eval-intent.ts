/**
 * Evaluasi akurasi intent extraction (H15, D153). Dijalankan PENYUSUN, bukan
 * test otomatis, karena memanggil Gemini sungguhan dan memakai kuota. Dari akar
 * repo di PowerShell:
 *
 *   npx tsx apps/api/scripts/eval-intent.ts --check
 *       validasi dataset dan label terhadap sub-kategori aktif, tanpa gateway
 *
 *   $env:LLM_GATEWAY='gemini'; npx tsx apps/api/scripts/eval-intent.ts [--limit n] [--delay-ms n] [--out dir] [--dataset path]
 *
 * Bawaan --delay-ms 8000: kuota 15 RPM (gemini-3.5-flash-lite) berarti satu
 * request per 4 detik, dan satu skenario bisa memakai dua request kalau kena
 * retry 5xx (D165). Bawaan --out apps/api/eval/results/<waktu>/.
 *
 * Sub-kategori dibaca dari basis data DATABASE_URL lewat activeSubcategories(),
 * fungsi yang sama dengan chatbot (hanya SELECT). Nonaktifkan taksonomi demo
 * lebih dulu (H16, scripts/deactivate-demo-taxonomy.mjs), karena daftar itu ikut
 * masuk prompt dan hash-nya tercatat di hasil.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { prisma } from '@jasana/database';
import { env } from '../src/config/env';
import { llmGateway } from '../src/lib/llm-gateway';
import { activeSubcategories } from '../src/modules/catalog/catalog.service';
import {
  buildMeta, catalogIssues, datasetSchema, formatIssues, lastIntentFor, runEval, summarize, writeOutputs,
} from './eval-intent-core';

const API_ROOT = resolve(__dirname, '..');

function flag(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function intFlag(name: string, fallback: number | undefined): number | undefined {
  const raw = flag(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    console.error(`${name} harus bilangan bulat >= 0`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const datasetPath = resolve(flag('--dataset') ?? resolve(API_ROOT, 'eval/intent-dataset.json'));
  const datasetText = readFileSync(datasetPath, 'utf8');
  const parsed = datasetSchema.safeParse(JSON.parse(datasetText));
  if (!parsed.success) {
    console.error(`Dataset tidak sah (${datasetPath}):`);
    for (const issue of formatIssues(parsed.error)) console.error(`  ${issue}`);
    process.exit(1);
  }
  const dataset = parsed.data;

  const subcategories = (await activeSubcategories()).map(({ key, name, categoryName }) => ({ key, name, categoryName }));
  const issues = catalogIssues(dataset, subcategories.map((s) => s.key));
  if (issues.length > 0) {
    console.error('Dataset tidak cocok dengan sub-kategori aktif:');
    for (const issue of issues) console.error(`  ${issue}`);
    process.exit(1);
  }

  const derived = dataset.skenario.filter((s) => lastIntentFor(s).derived).map((s) => s.id);
  const followUpWithoutIntent = dataset.skenario.filter((s) => s.riwayat?.length && lastIntentFor(s).intent === null).map((s) => s.id);
  console.log(`Dataset sah: ${dataset.skenario.length} skenario, ${subcategories.length} sub-kategori aktif.`);
  if (derived.length) console.log(`  last_intent diturunkan dari pertanyaan klarifikasi: ${derived.join(', ')}`);
  if (followUpWithoutIntent.length) {
    console.log(`  PERHATIAN: punya riwayat tanpa intent_terakhir dan tidak bisa diturunkan, last_intent null: ${followUpWithoutIntent.join(', ')}`);
  }
  if (process.argv.includes('--check')) return;

  if (env.LLM_GATEWAY !== 'gemini') console.log('PERHATIAN: LLM_GATEWAY bukan gemini. Hasil fake hanya untuk mencoba pipeline, bukan bahan Bab IV.');
  const delayMs = intFlag('--delay-ms', 8000)!;
  const limit = intFlag('--limit', undefined);
  const startedAt = new Date();
  const out = resolve(flag('--out') ?? resolve(API_ROOT, 'eval/results', startedAt.toISOString().replace(/[:.]/g, '-')));

  const results = await runEval(dataset.skenario, llmGateway, subcategories, {
    delayMs,
    limit,
    onProgress: (r, i, total) => {
      const verdict = r.error ? `GAGAL ${r.error.reason}${r.error.status ? ` ${r.error.status}` : ''}` : r.score.correct ? 'benar' : 'salah';
      console.log(`  [${i + 1}/${total}] ${r.id}: ${verdict}${r.attempts && r.attempts > 1 ? ' (retry)' : ''}`);
    },
  });

  const meta = buildMeta({
    gateway: env.LLM_GATEWAY, configuredModel: env.GEMINI_MODEL, results, datasetText, dataset, subcategories, startedAt,
  });
  const summary = summarize(results);
  writeOutputs(out, meta, summary, results);
  console.log(`\nAkurasi ${summary.total.benar}/${summary.total.n} = ${summary.total.persen ?? '-'} persen (target ${summary.total.target_persen}).`);
  console.log(`Gagal ${summary.gagal}, berhasil setelah retry ${summary.berhasil_setelah_retry}. Hasil: ${out}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
