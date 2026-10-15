/**
 * Unit test pengenal magic bytes (H78). Tanpa HTTP, tanpa basis data.
 */

import { describe, expect, it } from 'vitest';
import { detectFileType } from '../src/lib/file-signature';
import { missingDocuments } from '../src/modules/providers/kyc-rules';
import { FILES } from './helpers/providers';

describe('detectFileType', () => {
  it('mengenali JPEG, PNG, dan PDF dari byte pertamanya', () => {
    expect(detectFileType(FILES.jpeg)).toEqual({ mime: 'image/jpeg', extension: 'jpg' });
    expect(detectFileType(FILES.png)).toEqual({ mime: 'image/png', extension: 'png' });
    expect(detectFileType(FILES.pdf)).toEqual({ mime: 'application/pdf', extension: 'pdf' });
  });

  it('menolak executable Windows, apa pun nama dan Content-Type yang dikirim', () => {
    expect(detectFileType(FILES.exe)).toBeNull();
  });

  it('menolak teks biasa, HTML, dan SVG', () => {
    expect(detectFileType(Buffer.from('ini bukan gambar'))).toBeNull();
    expect(detectFileType(Buffer.from('<html><body>ktp</body></html>'))).toBeNull();
    expect(detectFileType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).toBeNull();
  });

  it('menolak berkas yang lebih pendek dari tanda tangannya', () => {
    expect(detectFileType(Buffer.alloc(0))).toBeNull();
    expect(detectFileType(Buffer.from([0xff, 0xd8]))).toBeNull();
    expect(detectFileType(Buffer.from([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
  });

  it('tanda tangan harus di awal berkas, bukan di tengah', () => {
    const shifted = Buffer.concat([Buffer.from([0x00]), FILES.jpeg]);
    expect(detectFileType(shifted)).toBeNull();
  });
});

describe('missingDocuments (D46)', () => {
  it('INDIVIDUAL cukup KTP dan selfie', () => {
    expect(missingDocuments('INDIVIDUAL', [])).toEqual(['KTP', 'SELFIE_KTP']);
    expect(missingDocuments('INDIVIDUAL', ['KTP', 'SELFIE_KTP'])).toEqual([]);
  });

  it('BUSINESS butuh tambahan NPWP atau izin usaha, salah satu cukup', () => {
    expect(missingDocuments('BUSINESS', ['KTP', 'SELFIE_KTP'])).toEqual(['NPWP_OR_BUSINESS_LICENSE']);
    expect(missingDocuments('BUSINESS', ['KTP', 'SELFIE_KTP', 'NPWP'])).toEqual([]);
    expect(missingDocuments('BUSINESS', ['KTP', 'SELFIE_KTP', 'BUSINESS_LICENSE'])).toEqual([]);
  });

  it('sertifikat tidak menggantikan dokumen wajib', () => {
    expect(missingDocuments('INDIVIDUAL', ['CERTIFICATE', 'KTP'])).toEqual(['SELFIE_KTP']);
  });
});
