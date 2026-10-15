/**
 * Pengenal jenis berkas dari MAGIC BYTES (D80, H78).
 *
 * Jenis berkas ditentukan dari byte pertamanya, TIDAK PERNAH dari
 * `Content-Type` maupun ekstensi nama berkas. Keduanya dikirim client dan
 * bisa dipalsukan: berkas `.exe` yang dinamai `ktp.jpg` dengan
 * `Content-Type: image/jpeg` lolos kalau yang diperiksa hanya header.
 *
 * Hasil deteksi ini juga yang dipakai sebagai `Content-Type` saat berkas
 * dikirim ke Storage dan sebagai ekstensi nama objeknya, sehingga tidak ada
 * satu pun nilai dari client yang ikut tersimpan.
 */

export type AllowedMimeType = 'image/jpeg' | 'image/png' | 'application/pdf';

export interface DetectedFileType {
  mime: AllowedMimeType;
  extension: 'jpg' | 'png' | 'pdf';
}

interface Signature extends DetectedFileType {
  bytes: readonly number[];
}

/** Hanya tiga jenis yang diterima D80. */
const SIGNATURES: readonly Signature[] = [
  // JPEG: SOI (FF D8) diikuti penanda segmen berikutnya (FF).
  { mime: 'image/jpeg', extension: 'jpg', bytes: [0xff, 0xd8, 0xff] },
  // PNG: \x89 P N G \r \n \x1a \n
  {
    mime: 'image/png',
    extension: 'png',
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
  // PDF: "%PDF-"
  { mime: 'application/pdf', extension: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
];

/** `null` kalau byte pertamanya bukan JPEG, PNG, atau PDF. */
export function detectFileType(buffer: Uint8Array): DetectedFileType | null {
  for (const signature of SIGNATURES) {
    if (buffer.length < signature.bytes.length) continue;
    if (signature.bytes.every((byte, index) => buffer[index] === byte)) {
      return { mime: signature.mime, extension: signature.extension };
    }
  }
  return null;
}
