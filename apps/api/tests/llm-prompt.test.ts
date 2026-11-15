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
  personalizationSnapshot: null,
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
  it('tamu: tanpa blok personalization_snapshot sama sekali (H66)', () => {
    const text = buildUserInput(input());
    expect(text).not.toContain('personalization_snapshot');
    expect(text).toContain('Pesan pengguna sekarang:\nac kamar ga dingin');
    expect(text).toContain('Riwayat percakapan, lama ke baru:\n(belum ada)');
    expect(text).toContain('last_intent:\n(belum ada)');
  });

  it('terdaftar: snapshot dimasukkan', () => {
    const snapshot = { kategori_favorit: ['Perbaikan'], rentang_harga: [100000, 300000] };
    const text = buildUserInput(input({ personalizationSnapshot: snapshot }));
    expect(text).toContain(`(personalization_snapshot):\n${JSON.stringify(snapshot)}`);
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
