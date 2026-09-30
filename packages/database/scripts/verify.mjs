/**
 * Menjalankan kueri verifikasi V1 sampai V12 lalu mencetak hasilnya.
 *
 * V1, V5, V6, V7, V8, V11, dan V12 WAJIB nol baris. Kalau salah satu
 * mengembalikan baris, skrip keluar dengan kode 1 supaya bisa dipakai di CI
 * dan tidak lolos tanpa disadari.
 *
 * V2, V3, V4, V9, dan V10 bukan pemeriksaan integritas melainkan tabel hasil
 * untuk Bab IV, jadi tidak ada ekspektasi jumlah baris.
 *
 * Pemakaian:
 *   npm run db:verify
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const here = dirname(fileURLToPath(import.meta.url));
const sqlPath = resolve(here, '../prisma/verification-queries.sql');

/** Memecah berkas SQL pada penanda `-- @query <id> | <harapan> | <judul>`. */
function parseQueries(sql) {
  const marker = /^--\s*@query\s+(\S+)\s*\|\s*(zero|table)\s*\|\s*(.*)$/;
  const queries = [];
  let current = null;

  for (const line of sql.split(/\r?\n/)) {
    const found = marker.exec(line.trim());
    if (found) {
      if (current) queries.push(current);
      current = { id: found[1], expectation: found[2], title: found[3].trim(), sql: '' };
      continue;
    }
    if (current) current.sql += line + '\n';
  }
  if (current) queries.push(current);

  return queries
    .map((q) => ({ ...q, sql: q.sql.trim() }))
    .filter((q) => q.sql.length > 0);
}

/** BigInt dari COUNT(*) tidak bisa di-JSON.stringify begitu saja. */
function printable(value) {
  if (typeof value === 'bigint') return value.toString();
  if (value === null || value === undefined) return null;
  if (typeof value === 'object' && typeof value.toFixed === 'function') {
    return value.toString();
  }
  return value;
}

function printRows(rows) {
  const flat = rows.map((row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [k, printable(v)])),
  );
  console.table(flat);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL belum diisi. Salin .env.example jadi .env lebih dulu.');
    process.exit(1);
  }

  const queries = parseQueries(readFileSync(sqlPath, 'utf8'));
  const prisma = new PrismaClient();
  const failures = [];

  console.log(`\nMenjalankan ${queries.length} kueri verifikasi\n${'='.repeat(64)}`);

  try {
    for (const query of queries) {
      const mustBeZero = query.expectation === 'zero';
      const label = mustBeZero ? 'wajib 0 baris' : 'tabel hasil';

      let rows;
      try {
        rows = await prisma.$queryRawUnsafe(query.sql);
      } catch (error) {
        failures.push(`${query.id} gagal dieksekusi: ${error.message}`);
        console.log(`\n${query.id}  ${query.title}  [${label}]`);
        console.log(`  GALAT: ${error.message.split('\n')[0]}`);
        continue;
      }

      const verdict = mustBeZero ? (rows.length === 0 ? 'LULUS' : 'GAGAL') : 'DATA';
      console.log(`\n${query.id}  ${query.title}  [${label}]`);
      console.log(`  ${verdict}, ${rows.length} baris`);

      if (rows.length > 0) printRows(rows);
      if (mustBeZero && rows.length > 0) {
        failures.push(`${query.id} mengembalikan ${rows.length} baris, seharusnya 0`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\n${'='.repeat(64)}`);
  if (failures.length > 0) {
    console.error('VERIFIKASI GAGAL');
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log('Seluruh kueri integritas lulus. V1, V5, V6, V7, V8, V11, V12 nol baris.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
