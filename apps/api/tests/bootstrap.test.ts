/**
 * Uji GAGAL START di level PROSES (PRD Bagian 5.6).
 *
 * Kenapa perlu, padahal env.test.ts sudah menguji `loadEnv`: yang diklaim PRD
 * bukan "fungsi validasi melempar", melainkan "APLIKASI GAGAL START". Dua hal
 * itu berbeda. Kalau suatu saat ada yang membungkus `loadEnv()` dengan
 * try/catch lalu memakai nilai cadangan, env.test.ts tetap hijau sementara
 * klaimnya sudah tidak benar. Uji di sini menjalankan `server.ts` sebagai
 * proses sungguhan dan memeriksa exit code-nya.
 *
 * CATATAN soal cara membuat variabel "kosong". `dotenv` tidak menimpa kunci
 * yang sudah ada di `process.env`, tapi TETAP mengisi yang belum ada. Jadi
 * menghapus variabel tidak cukup, karena akan diisi ulang dari `.env` di akar.
 * Yang dipakai di sini string kosong: kuncinya tetap ada, jadi dotenv tidak
 * menimpanya, dan validator melihatnya sebagai kosong.
 */

import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const apiDir = resolve(__dirname, '..');

interface RunResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

/**
 * Menjalankan server sebagai proses terpisah.
 *
 * `readyMarker` dipakai kasus positif: begitu penanda muncul di stdout, proses
 * dimatikan dan dianggap berhasil start. Tanpa itu proses akan hidup terus
 * karena memang sedang listen.
 */
function runServer(
  overrides: Record<string, string>,
  readyMarker?: string,
): Promise<RunResult> {
  return new Promise((resolvePromise) => {
    /**
     * `node --import tsx`, BUKAN `npx tsx` dan BUKAN `shell: true`.
     *
     * Lewat npx dan shell, rantainya jadi tiga lapis
     * (cmd.exe -> npx-cli.js -> tsx/cli.mjs -> node), dan `child.kill()` di
     * Windows hanya mematikan lapisan teratas. Cucunya tetap hidup memegang
     * port, lalu proses uji berikutnya gagal EADDRINUSE dan terlihat seperti
     * bug aplikasi padahal bocornya di harness. Dengan bentuk ini hanya ada
     * satu proses, dan kill benar-benar mematikannya.
     */
    const child = spawn(process.execPath, ['--import', 'tsx', 'src/server.ts'], {
      cwd: apiDir,
      env: { ...process.env, ...overrides },
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const finish = (code: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolvePromise({ code, stdout, stderr });
    };

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(null);
    }, 45_000);

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
      if (readyMarker && stdout.includes(readyMarker)) {
        child.kill('SIGKILL');
        // Start berhasil, jadi diperlakukan sebagai exit 0.
        finish(0);
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => finish(code));
  });
}

describe('bootstrap proses', () => {
  /**
   * KONTROL POSITIF, dan ini bukan formalitas.
   *
   * Tanpa kasus ini seluruh uji negatif di bawah bisa lulus karena alasan yang
   * salah, misalnya `tsx` tidak terpasang sehingga proses apa pun gagal start.
   * Kasus ini membuktikan harness-nya memang bisa membedakan berhasil dan gagal.
   */
  it('start normal kalau environment lengkap', async () => {
    const result = await runServer(
      { NODE_ENV: 'development', PORT: '4997' },
      'Jasana API berjalan',
    );

    // Keluaran diikutkan ke pesan assertion, supaya kegagalan langsung
    // menunjukkan sebabnya. EADDRINUSE dan galat konfigurasi terlihat sangat
    // berbeda, tapi keduanya sama-sama exit code bukan nol.
    expect(
      result.code,
      `server gagal start.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    ).toBe(0);
    expect(result.stdout).toContain('Jasana API berjalan');
  }, 60_000);

  it('GAGAL START kalau DATABASE_URL kosong', async () => {
    const result = await runServer({ DATABASE_URL: '', PORT: '4998' });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('DATABASE_URL');
    // Yang membaca pesan ini sedang menyiapkan lingkungan.
    expect(result.stderr).toContain('aplikasi tidak dijalankan');
    // Tidak boleh sampai listen.
    expect(result.stdout).not.toContain('Jasana API berjalan');
  }, 60_000);

  it('GAGAL START kalau JWT_SECRET terlalu pendek', async () => {
    const result = await runServer({ JWT_SECRET: 'pendek', PORT: '4998' });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toMatch(/JWT_SECRET/);
    expect(result.stdout).not.toContain('Jasana API berjalan');
  }, 60_000);

  it('GAGAL START kalau kunci AES bukan 64 hex', async () => {
    const result = await runServer({
      VERIFICATION_CODE_AES_KEY: 'bukan-hex',
      PORT: '4998',
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('VERIFICATION_CODE_AES_KEY');
    expect(result.stdout).not.toContain('Jasana API berjalan');
  }, 60_000);

  it('menyebut SELURUH variabel yang salah sekaligus, bukan satu per satu', async () => {
    // Kalau hanya yang pertama dilaporkan, orang harus menjalankan ulang
    // berkali-kali untuk menemukan sisanya.
    const result = await runServer({
      SMTP_HOST: '',
      GEMINI_API_KEY: '',
      PORT: '4998',
    });

    expect(result.code).not.toBe(0);
    expect(result.stderr).toContain('SMTP_HOST');
    expect(result.stderr).toContain('GEMINI_API_KEY');
  }, 60_000);
});
