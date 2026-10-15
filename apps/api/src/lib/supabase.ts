/**
 * Klien Supabase Storage, lewat REST API langsung.
 *
 * Sengaja tanpa `@supabase/supabase-js`: yang dipakai hanya tiga operasi
 * (unggah, hapus, signed URL), dan `fetch` bawaan Node 20 cukup untuk itu.
 *
 * Kunci yang dipakai SERVICE ROLE, jadi modul ini hanya boleh dipanggil dari
 * server. Bucket private tetap bisa ditulis dan dibaca lewat kunci ini,
 * sedangkan pengguna biasa hanya mendapat signed URL berumur pendek.
 *
 * Diekspor sebagai objek `storage` (bukan fungsi lepas) supaya uji bisa
 * menyadapnya dengan `vi.spyOn(storage, 'upload')`, sama polanya dengan
 * `mailer` di lib/mailer.ts.
 */

import { env } from '../config/env';
import { STORAGE_TIMEOUT_MS } from '../config/constants';

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

function baseUrl(): string {
  return `${env.SUPABASE_URL.replace(/\/+$/, '')}/storage/v1`;
}

/** Setiap segmen path di-encode terpisah, garis miring tetap pemisah. */
function objectPath(bucket: string, path: string): string {
  return [bucket, ...path.split('/')].map(encodeURIComponent).join('/');
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    ...extra,
  };
}

async function call(url: string, init: RequestInit, action: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(STORAGE_TIMEOUT_MS) });
  } catch (error) {
    throw new StorageError(
      `${action} gagal: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!response.ok) {
    // Isi balasan Storage hanya untuk log, tidak pernah diteruskan ke client.
    const body = await response.text().catch(() => '');
    throw new StorageError(`${action} ditolak Storage (${response.status}): ${body.slice(0, 300)}`, response.status);
  }
  return response;
}

export const storage = {
  /**
   * Unggah satu objek. `x-upsert: false`, jadi objek yang sudah ada tidak
   * pernah tertimpa diam-diam. Nama objek selalu UUID baru, jadi tabrakan
   * berarti ada yang salah, bukan hal yang perlu ditimpa.
   */
  async upload(bucket: string, path: string, body: Uint8Array, contentType: string): Promise<void> {
    await call(
      `${baseUrl()}/object/${objectPath(bucket, path)}`,
      {
        method: 'POST',
        headers: headers({ 'Content-Type': contentType, 'x-upsert': 'false' }),
        body,
      },
      'Unggah berkas',
    );
  },

  /** Hapus beberapa objek sekaligus. Objek yang tidak ada tidak dianggap galat. */
  async remove(bucket: string, paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    await call(
      `${baseUrl()}/object/${encodeURIComponent(bucket)}`,
      {
        method: 'DELETE',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ prefixes: paths }),
      },
      'Hapus berkas',
    );
  },

  /** Signed URL berumur `expiresInSeconds` untuk objek di bucket private. */
  async createSignedUrl(bucket: string, path: string, expiresInSeconds: number): Promise<string> {
    const response = await call(
      `${baseUrl()}/object/sign/${objectPath(bucket, path)}`,
      {
        method: 'POST',
        headers: headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ expiresIn: expiresInSeconds }),
      },
      'Membuat signed URL',
    );
    const payload = (await response.json().catch(() => null)) as { signedURL?: unknown } | null;
    if (!payload || typeof payload.signedURL !== 'string') {
      throw new StorageError('Balasan signed URL dari Storage tidak dikenali');
    }
    // Storage mengembalikan path relatif terhadap /storage/v1.
    return `${baseUrl()}${payload.signedURL.startsWith('/') ? '' : '/'}${payload.signedURL}`;
  },
};
