/**
 * Sesi 9a: isi prompt ekstraksi intent (D152, H66, H67).
 */

import { describe, expect, it } from 'vitest';
import type { ExtractIntentInput } from '../src/lib/llm-gateway';
import { buildSystemInstruction, buildUserInput } from '../src/lib/llm-prompt';

const SUBCATEGORIES = [
  { key: 'perbaikan/servis-ac', name: 'Servis AC', categoryName: 'Perbaikan' },
  { key: 'kecantikan/makeup-pengantin', name: 'Makeup Pengantin', categoryName: 'Kecantikan' },
];

const input = (overrides: Partial<ExtractIntentInput> = {}): ExtractIntentInput => ({
  message: 'ac kamar ga dingin',
  history: [],
  subcategories: SUBCATEGORIES,
  lastIntent: null,
  personalization: null,
  ...overrides,
});

describe('buildSystemInstruction', () => {
  const prompt = buildSystemInstruction(SUBCATEGORIES);

  it('memuat nama, kategori, dan kunci setiap sub-kategori aktif', () => {
    expect(prompt).toContain('- Servis AC (Perbaikan): perbaikan/servis-ac');
    expect(prompt).toContain('- Makeup Pengantin (Kecantikan): kecantikan/makeup-pengantin');
  });

  it('memuat kelima jenis intent dan aturan klarifikasi hanya untuk sub-kategori', () => {
    for (const jenis of ['cari_jasa', 'perlu_klarifikasi', 'jasa_tidak_tersedia', 'sapaan', 'di_luar_cakupan']) {
      expect(prompt).toContain(`- ${jenis}:`);
    }
    expect(prompt).toContain('perlu_klarifikasi HANYA kalau sub-kategori tidak bisa ditentukan');
    expect(prompt).toContain('"servis AC sekarang" tetap\n  cari_jasa');
  });

  it('tidak memuat data listing maupun penyedia walaupun objek sub-kategori membawanya (D152, H67)', () => {
    const leaky = SUBCATEGORIES.map((s) => ({
      ...s,
      id: '6a3f2c1e-0000-4000-8000-000000000001',
      listingTitle: 'AC Dingin Pak Budi',
      providerName: 'CV Sejuk Selalu',
      phone: '081234567890',
      address: 'Jl. Teuku Umar No. 12',
      price: 175000,
    }));
    const leakyPrompt = buildSystemInstruction(leaky);
    expect(leakyPrompt).toBe(prompt);
    for (const value of ['6a3f2c1e', 'Pak Budi', 'Sejuk Selalu', '081234567890', 'Teuku Umar', '175000']) {
      expect(leakyPrompt).not.toContain(value);
    }
  });

  it('daftar kosong tetap menghasilkan prompt yang jelas', () => {
    expect(buildSystemInstruction([])).toContain('(belum ada sub-kategori aktif)');
  });
});

describe('buildUserInput', () => {
  it('tamu: tanpa blok riwayat sama sekali (H66)', () => {
    const text = buildUserInput(input());
    expect(text).not.toContain('Riwayat sub-kategori');
    expect(text).toContain('Pesan pengguna sekarang:\nac kamar ga dingin');
    expect(text).toContain('Riwayat percakapan, lama ke baru:\n(belum ada)');
    expect(text).toContain('last_intent:\n(belum ada)');
  });

  it('terdaftar tanpa riwayat order: blok riwayat juga tidak muncul', () => {
    expect(buildUserInput(input({ personalization: { riwayat_sub_kategori: [] } }))).not.toContain('Riwayat sub-kategori');
  });

  it('terdaftar: hanya kunci riwayat, dengan aturan rujukan eksplisit, sebelum pesan sekarang (usulan D168)', () => {
    const text = buildUserInput(input({ personalization: { riwayat_sub_kategori: ['perbaikan/servis-ac', 'kecantikan/makeup-pengantin'] } }));
    expect(text).toContain('(paling sering dulu):\nperbaikan/servis-ac\nkecantikan/makeup-pengantin\n');
    expect(text).toContain('HANYA kalau pesan merujuk pesanan sebelumnya secara eksplisit');
    expect(text.indexOf('Riwayat sub-kategori')).toBeLessThan(text.indexOf('Pesan pengguna sekarang:'));
  });

  it('isi snapshot lain tidak bisa ikut walaupun objek sumbernya membawanya', () => {
    const leaky = {
      riwayat_sub_kategori: ['perbaikan/servis-ac'],
      kota_alamat_default: 'Denpasar',
      rata_rating_diberikan: 4.5,
      rentang_harga: { min: 150000, maks: 275000 },
    } as unknown as ExtractIntentInput['personalization'];
    const text = buildUserInput(input({ personalization: leaky }));
    for (const secret of ['Denpasar', '4.5', '150000', '275000', 'rentang', 'rating', 'kota']) expect(text).not.toContain(secret);
  });

  it('riwayat dan last_intent ikut masuk, berurutan, sebelum pesan sekarang', () => {
    const lastIntent = { jenis: 'perlu_klarifikasi', sub_kategori: null };
    const text = buildUserInput(
      input({
        message: 'prewedding',
        history: [
          { role: 'USER', content: 'butuh fotografer' },
          { role: 'ASSISTANT', content: 'Foto untuk apa?' },
        ],
        lastIntent,
      }),
    );
    expect(text).toContain('PENGGUNA: butuh fotografer\nASISTEN: Foto untuk apa?');
    expect(text).toContain(`last_intent:\n${JSON.stringify(lastIntent)}`);
    expect(text.indexOf('ASISTEN: Foto untuk apa?')).toBeLessThan(text.indexOf('Pesan pengguna sekarang:\nprewedding'));
  });
});
