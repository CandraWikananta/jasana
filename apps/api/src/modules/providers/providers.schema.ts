/**
 * Skema Zod modul provider.
 *
 * `provider_type` hanya diterima di dua tempat: saat apply (D46) dan lewat
 * pengajuan perubahan tipe (D47). Skema PATCH /providers/me sengaja tidak
 * memuatnya, jadi field itu dibuang Zod dan tidak berpengaruh. Kalau bisa
 * diganti dari settings, seseorang bisa lolos verifikasi sebagai INDIVIDUAL
 * lalu menaikkan diri jadi BUSINESS tanpa menyerahkan dokumen usaha.
 */

import { z } from 'zod';

const providerType = z.enum(['INDIVIDUAL', 'BUSINESS'], {
  errorMap: () => ({ message: 'provider_type harus INDIVIDUAL atau BUSINESS' }),
});

const optionalText = (max: number) => z.string().trim().min(1).max(max).nullable().optional();

/** Koordinat sebagai number, disimpan Decimal(10,8) dan Decimal(11,8). */
const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

/** Decimal(5,2) di basis data. */
const serviceRadiusKm = z.number().positive('service_radius_km harus lebih dari nol').max(999.99);

const bothOrNeitherCoordinate = (body: { base_latitude?: unknown; base_longitude?: unknown }) =>
  (body.base_latitude === undefined) === (body.base_longitude === undefined);

const coordinatePairMessage = {
  message: 'base_latitude dan base_longitude harus dikirim berpasangan',
  path: ['base_longitude'],
};

const profileFields = {
  business_name: optionalText(150),
  bio: optionalText(2000),
  base_address: optionalText(500),
  base_latitude: latitude.nullable().optional(),
  base_longitude: longitude.nullable().optional(),
  service_radius_km: serviceRadiusKm.optional(),
};

export const applyProviderSchema = z
  .object({ provider_type: providerType, ...profileFields })
  .refine(bothOrNeitherCoordinate, coordinatePairMessage)
  .refine((body) => body.provider_type !== 'BUSINESS' || Boolean(body.business_name), {
    message: 'business_name wajib diisi untuk provider BUSINESS',
    path: ['business_name'],
  });

export const updateProviderSchema = z
  .object(profileFields)
  .refine(bothOrNeitherCoordinate, coordinatePairMessage)
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: 'Isi minimal satu field yang ingin diubah',
  });

export const kycDocumentSchema = z.object({
  document_type: z.enum(['KTP', 'SELFIE_KTP', 'NPWP', 'CERTIFICATE', 'BUSINESS_LICENSE'], {
    errorMap: () => ({
      message: 'document_type harus KTP, SELFIE_KTP, NPWP, CERTIFICATE, atau BUSINESS_LICENSE',
    }),
  }),
});

export const typeUpgradeSchema = z.object({
  provider_type: providerType,
  business_name: z.string().trim().min(1).max(150).optional(),
});

export const providerParamsSchema = z.object({
  id: z.string().uuid('id provider tidak sah'),
});

export type ApplyProviderBody = z.infer<typeof applyProviderSchema>;
export type UpdateProviderBody = z.infer<typeof updateProviderSchema>;
export type TypeUpgradeBody = z.infer<typeof typeUpgradeSchema>;
