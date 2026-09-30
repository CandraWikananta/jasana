/**
 * Skema Zod modul users dan alamat.
 *
 * `email` SENGAJA tidak ada di skema PATCH /users/me. Penggantian email
 * punya jalurnya sendiri yang mewajibkan password dan verifikasi alamat baru
 * (D64). Kalau ikut di sini, field itu dibuang Zod dan tidak berpengaruh.
 */

import { z } from 'zod';
import { emailField, fullNameField, passwordField, phoneField } from '../auth/auth.schema';

const currentPassword = z
  .string({ required_error: 'current_password wajib diisi' })
  .min(1, 'current_password wajib diisi')
  .max(256);

const atLeastOneField = (body: Record<string, unknown>) =>
  Object.values(body).some((value) => value !== undefined);

export const updateMeSchema = z
  .object({
    full_name: fullNameField.optional(),
    phone: phoneField.optional(),
    avatar_url: z.string().trim().url('avatar_url harus URL yang sah').max(2048).nullable().optional(),
  })
  .refine(atLeastOneField, { message: 'Isi minimal satu field yang ingin diubah' });

export const changePasswordSchema = z
  .object({ current_password: currentPassword, new_password: passwordField })
  .refine((body) => body.current_password !== body.new_password, {
    message: 'new_password harus berbeda dari password saat ini',
    path: ['new_password'],
  });

/** D64 pengaman pertama: password saat ini WAJIB. */
export const changeEmailSchema = z.object({
  current_password: currentPassword,
  new_email: emailField,
});

export const confirmEmailChangeSchema = z.object({
  token: z.string({ required_error: 'token wajib diisi' }).trim().min(1).max(256),
});

// ---------------------------------------------------------------------------
// Alamat
// ---------------------------------------------------------------------------

const optionalText = (max: number) => z.string().trim().min(1).max(max).nullable().optional();

/**
 * Koordinat diterima sebagai `number` derajat desimal (PRD 4.1) dan disimpan
 * `Decimal(10,8)` dan `Decimal(11,8)`. Jangan pernah Float, galat
 * pembulatannya bisa menggeser hasil validasi radius.
 */
const latitude = z.number({ required_error: 'latitude wajib diisi' }).min(-90).max(90);
const longitude = z.number({ required_error: 'longitude wajib diisi' }).min(-180).max(180);

export const createAddressSchema = z.object({
  label: optionalText(50),
  address_line: z.string({ required_error: 'address_line wajib diisi' }).trim().min(5).max(500),
  district: optionalText(100),
  city: optionalText(100),
  province: optionalText(100),
  postal_code: z.string().trim().regex(/^\d{5}$/, 'postal_code harus 5 digit').nullable().optional(),
  latitude,
  longitude,
  is_default: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema
  .partial()
  .refine(atLeastOneField, { message: 'Isi minimal satu field yang ingin diubah' });

export const addressParamsSchema = z.object({
  id: z.string().uuid('id alamat tidak sah'),
});

export type UpdateMeBody = z.infer<typeof updateMeSchema>;
export type CreateAddressBody = z.infer<typeof createAddressSchema>;
export type UpdateAddressBody = z.infer<typeof updateAddressSchema>;
