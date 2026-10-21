/**
 * Pembersihan berkas yatim di bucket foto listing (PRD 7.1, H80, D80).
 *
 * Foto listing diunggah langsung ke Storage lewat signed URL. Kalau frontend
 * tidak pernah memanggil POST /providers/me/listings/:id/photos, atau
 * barisnya dihapus, berkasnya nyangkut tanpa baris perujuk. Berkas yang
 * lebih tua dari `orphan_upload_cleanup_hours` dan tidak dirujuk satu pun
 * baris `listing_photos` dihapus. Batas umur itu yang melindungi unggahan
 * yang sedang berjalan.
 *
 * Path objek selalu `<user_id>/<uuid>` (listings.service), jadi cukup dua
 * tingkat: daftar folder di akar, lalu isi tiap folder.
 */

import { prisma } from '@jasana/database';
import { LISTING_PHOTO_BUCKET } from '../config/constants';
import { logger } from '../lib/logger';
import { storage } from '../lib/supabase';
import { getNumberSetting } from '../modules/settings/settings.service';

export async function cleanOrphanListingPhotos(now = new Date()): Promise<{ scanned: number; removed: number }> {
  const hours = await getNumberSetting('orphan_upload_cleanup_hours');
  const cutoff = now.getTime() - hours * 60 * 60 * 1000;

  const folders = (await storage.list(LISTING_PHOTO_BUCKET, '')).filter((entry) => entry.id === null);
  const old: { path: string; url: string }[] = [];
  let scanned = 0;
  for (const folder of folders) {
    for (const file of await storage.list(LISTING_PHOTO_BUCKET, folder.name)) {
      if (file.id === null) continue;
      scanned += 1;
      if (file.created_at !== null && Date.parse(file.created_at) < cutoff) {
        const path = `${folder.name}/${file.name}`;
        old.push({ path, url: storage.publicUrl(LISTING_PHOTO_BUCKET, path) });
      }
    }
  }

  const referenced = new Set(
    (
      await prisma.listingPhoto.findMany({
        where: { fileUrl: { in: old.map((file) => file.url) } },
        select: { fileUrl: true },
      })
    ).map((row) => row.fileUrl),
  );
  const orphans = old.filter((file) => !referenced.has(file.url)).map((file) => file.path);

  await storage.remove(LISTING_PHOTO_BUCKET, orphans);
  logger.info({ job: 'orphan-listing-photos', scanned, removed: orphans.length }, 'Pembersihan berkas yatim selesai');
  return { scanned, removed: orphans.length };
}
