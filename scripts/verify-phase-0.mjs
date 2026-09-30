/**
 * Bukti Fase 0 selesai, dalam satu perintah.
 *
 *   npm run verify:phase-0
 *
 * Kriteria selesai Fase 0 menurut PRD Bagian 9:
 *   "Kueri verifikasi V1 sampai V12 berjalan tanpa galat, /health
 *    mengembalikan 200"
 *
 * Skrip ini memeriksa kedua kriteria itu PLUS seluruh keluaran yang
 * didaftarkan pada baris Fase 0 di tabel yang sama: monorepo, prisma migrate,
 * migration-constraints.sql, health check, error handler, logger Pino,
 * validasi env, dan envelope respons.
 *
 * Keluar dengan kode 1 kalau ada satu saja yang gagal, jadi tidak bisa lolos
 * tanpa disadari, dan bisa dipakai di CI.
 *
 * Kenapa ada skrip terpisah dan bukan cukup `npm test`: sebagian bukti Fase 0
 * bukan unit test, melainkan keadaan basis data sungguhan (constraint
 * terpasang, migrasi sinkron) dan versi dependensi yang dipin. Ketiganya tidak
 * bisa dibuktikan dari dalam Vitest.
 */

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const isWindows = process.platform === 'win32';

const results = [];

function record(id, title, ok, detail) {
  results.push({ id, title, ok, detail });
  const mark = ok ? 'LULUS ' : 'GAGAL ';
  console.log(`\n[${mark}] ${id}. ${title}`);
  for (const line of String(detail).split('\n')) {
    if (line.trim()) console.log(`         ${line}`);
  }
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? root,
    encoding: 'utf8',
    shell: isWindows,
    env: { ...process.env, ...(options.env ?? {}) },
    maxBuffer: 32 * 1024 * 1024,
  });
  return {
    code: result.status,
    out: `${result.stdout ?? ''}${result.stderr ?? ''}`,
  };
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

// ---------------------------------------------------------------
// 1. Monorepo dan versi Prisma yang dipin
// ---------------------------------------------------------------
function checkPinnedPrisma(id = 1) {
  const read = (pkg) =>
    JSON.parse(readFileSync(resolve(root, 'node_modules', pkg, 'package.json'), 'utf8'))
      .version;

  const wanted = '6.19.3';
  const found = {
    prisma: read('prisma'),
    '@prisma/client': read('@prisma/client'),
  };
  const ok = Object.values(found).every((v) => v === wanted);

  record(
    id,
    `Prisma dipin di ${wanted}`,
    ok,
    Object.entries(found)
      .map(([name, version]) => `${name} = ${version}${version === wanted ? '' : '  <- TIDAK COCOK'}`)
      .join('\n'),
  );
}

function checkWorkspaces() {
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const expected = ['apps/*', 'packages/*'];
  const ok = expected.every((w) => pkg.workspaces?.includes(w));
  record(
    2,
    'Monorepo npm workspaces sesuai PRD Bagian 2.3',
    ok,
    `workspaces = ${JSON.stringify(pkg.workspaces)}`,
  );
}

/**
 * schema.prisma wajib SAMA PERSIS dengan dokumen rujukan.
 *
 * Dokumen desain adalah sumber kebenaran, jadi kalau kode dan dokumen
 * berbeda, itu temuan, bukan variasi yang bisa dibiarkan.
 */
function checkSchemaUnchanged() {
  const docHash = sha256(resolve(root, 'docs/schema.prisma'));
  const pkgHash = sha256(resolve(root, 'packages/database/prisma/schema.prisma'));
  const ok = docHash === pkgHash;
  record(
    3,
    'schema.prisma identik dengan docs/schema.prisma',
    ok,
    `docs     = ${docHash.slice(0, 16)}\npackages = ${pkgHash.slice(0, 16)}\n` +
      (ok ? 'tidak satu byte pun berubah' : 'BERBEDA, skema sudah diubah dari dokumen'),
  );
}

/**
 * Isi migrasi kedua wajib sama dengan migration-constraints.sql.
 *
 * Kalau seseorang mengedit salah satunya belakangan, dua belas pengaman di
 * basis data tidak lagi mencerminkan dokumen, dan itu justru kasus yang paling
 * sulit disadari.
 */
function checkConstraintsMigrationContent() {
  const migrationsDir = resolve(root, 'packages/database/prisma/migrations');
  const folder = readdirSync(migrationsDir).find((name) =>
    name.endsWith('_add_integrity_constraints'),
  );

  if (!folder) {
    record(4, 'Migrasi constraint berisi migration-constraints.sql', false,
      'folder migrasi add_integrity_constraints tidak ditemukan');
    return;
  }

  const docHash = sha256(resolve(root, 'docs/migration-constraints.sql'));
  const migHash = sha256(resolve(migrationsDir, folder, 'migration.sql'));
  const ok = docHash === migHash;
  record(
    4,
    'Migrasi constraint berisi migration-constraints.sql',
    ok,
    `folder   = ${folder}\ndocs     = ${docHash.slice(0, 16)}\nmigrasi  = ${migHash.slice(0, 16)}\n` +
      (ok ? 'isinya identik' : 'BERBEDA, salah satunya sudah diedit'),
  );
}

// ---------------------------------------------------------------
// 2. Basis data
// ---------------------------------------------------------------
function checkMigrationStatus() {
  const { code, out } = run('npm', ['run', 'db:status']);
  const inSync = /Database schema is up to date/i.test(out);
  const count = /(\d+) migrations? found/i.exec(out)?.[1] ?? '?';
  const ok = code === 0 && inSync;
  record(
    5,
    'Migrasi diterapkan dan skema sinkron',
    ok,
    `${count} migrasi ditemukan\n${inSync ? 'skema sinkron dengan schema.prisma' : 'SKEMA TIDAK SINKRON'}`,
  );
}

function checkConstraints() {
  const { code, out } = run('npm', ['run', 'db:check-constraints']);
  const ok = code === 0;
  const checks = (out.match(/^ {2}ADA(\(p\))? /gm) ?? []).length;
  const partial = (out.match(/^ {2}ADA\(p\) /gm) ?? []).length;
  const bersih = /BERSIH/.test(out);
  record(
    6,
    'Dua belas pengaman migration-constraints.sql terpasang',
    ok,
    `${checks} constraint dan index terpasang, ${partial} di antaranya partial unique index\n` +
      `${bersih ? 'index lama uniq_inflight_order_per_provider sudah dibuang (D40)' : 'index lama MASIH ADA'}\n` +
      (ok ? '' : out.split('\n').filter((l) => /HILANG|SALAH|MASIH ADA/.test(l)).join('\n')),
  );
}

/** Kriteria selesai Fase 0, bagian pertama. */
function checkVerificationQueries() {
  const { code, out } = run('npm', ['run', 'db:verify']);
  const ok = code === 0;
  const lulus = (out.match(/LULUS/g) ?? []).length;
  const jalan = (out.match(/\[(wajib 0 baris|tabel hasil)\]/g) ?? []).length;
  record(
    7,
    'KRITERIA PRD: kueri V1 sampai V12 berjalan tanpa galat',
    ok && jalan === 12,
    `${jalan} dari 12 kueri berjalan tanpa galat\n` +
      `${lulus} kueri integritas nol baris (V1, V5, V6, V7, V8, V11, V12)\n` +
      'catatan: basis data masih kosong, jadi nol baris belum bermakna\n' +
      'sampai ada data seed di fase berikutnya. Yang membuktikan pengamannya\n' +
      'bekerja adalah butir 6 di atas.',
  );
}

// ---------------------------------------------------------------
// 3. Kode
// ---------------------------------------------------------------
function checkTypecheck() {
  const { code, out } = run('npm', ['run', 'typecheck']);
  const errors = (out.match(/error TS\d+/g) ?? []).length;
  const ok = code === 0 && errors === 0;
  record(
    8,
    'TypeScript strict lolos di seluruh workspace',
    ok,
    ok ? 'tidak ada galat tipe di apps/api, packages/database, packages/shared'
       : `${errors} galat tipe`,
  );
}

function checkTests() {
  const { code, out } = run('npm', ['test']);
  const passed = /Tests {2}(\d+) passed/.exec(out)?.[1];
  const failed = /(\d+) failed/.exec(out)?.[1];
  const ok = code === 0 && !failed;
  record(
    9,
    'Seluruh test lolos, termasuk error handler dan gagal-start',
    ok,
    `${passed ?? '?'} test lolos${failed ? `, ${failed} GAGAL` : ''}\n` +
      'mencakup envelope 4.1, kode infrastruktur A.2 (400, 403, 404, 413, 503),\n' +
      'dan gagal-start di level proses (PRD 5.6)',
  );
}

// ---------------------------------------------------------------
// 4. Kriteria selesai Fase 0, bagian kedua: /health 200
// ---------------------------------------------------------------
async function checkHealthEndpoint() {
  const port = 4996;
  // `node --import tsx` tanpa shell, supaya kill benar-benar mematikan
  // prosesnya dan tidak meninggalkan proses yatim yang menahan port.
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
    cwd: resolve(root, 'apps/api'),
    env: { ...process.env, PORT: String(port), NODE_ENV: 'development' },
  });

  let stdout = '';
  child.stdout.on('data', (c) => { stdout += c.toString(); });
  child.stderr.on('data', (c) => { stdout += c.toString(); });

  try {
    // Tunggu server siap, maksimal 40 detik.
    const deadline = Date.now() + 40_000;
    let ready = false;
    while (Date.now() < deadline) {
      if (stdout.includes('Jasana API berjalan')) { ready = true; break; }
      await new Promise((r) => setTimeout(r, 400));
    }
    if (!ready) {
      record(10, 'KRITERIA PRD: GET /health mengembalikan 200', false,
        `server tidak siap dalam 40 detik\n${stdout.slice(-400)}`);
      return;
    }

    const response = await fetch(`http://localhost:${port}/health`);
    const body = await response.json();
    const requestId = response.headers.get('x-request-id');

    const ok =
      response.status === 200 &&
      body.success === true &&
      body.data?.status === 'ok' &&
      body.data?.database === 'up' &&
      Boolean(requestId);

    record(
      10,
      'KRITERIA PRD: GET /health mengembalikan 200',
      ok,
      `status       = ${response.status}\n` +
        `database     = ${body.data?.database}\n` +
        `envelope     = success:${body.success}, ada field data\n` +
        `X-Request-Id = ${requestId ?? 'TIDAK ADA'}`,
    );
  } catch (error) {
    record(10, 'KRITERIA PRD: GET /health mengembalikan 200', false, String(error));
  } finally {
    child.kill('SIGKILL');
  }
}

// ---------------------------------------------------------------
async function main() {
  console.log('='.repeat(72));
  console.log('BUKTI FASE 0 SELESAI  -  Jasana Backend');
  console.log('Kriteria PRD Bagian 9: V1..V12 berjalan tanpa galat, /health 200');
  console.log('='.repeat(72));

  checkPinnedPrisma();
  checkWorkspaces();
  checkSchemaUnchanged();
  checkConstraintsMigrationContent();
  checkMigrationStatus();
  checkConstraints();
  checkVerificationQueries();
  checkTypecheck();
  checkTests();
  await checkHealthEndpoint();

  const gagal = results.filter((r) => !r.ok);

  console.log(`\n${'='.repeat(72)}`);
  console.log('RINGKASAN');
  console.log('='.repeat(72));
  for (const r of results) {
    console.log(`  ${r.ok ? 'LULUS ' : 'GAGAL '}  ${r.id}. ${r.title}`);
  }
  console.log('='.repeat(72));

  if (gagal.length > 0) {
    console.error(`\nFASE 0 BELUM SELESAI, ${gagal.length} dari ${results.length} butir gagal.\n`);
    process.exit(1);
  }
  console.log(`\nFASE 0 SELESAI. ${results.length} dari ${results.length} butir lulus.`);
  console.log('Kedua kriteria PRD Bagian 9 terpenuhi.\n');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
