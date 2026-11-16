/**
 * Validasi PATCH /admin/settings (D181, usulan D198 dan D199). Dibangun dari registri, jadi
 * kunci baru otomatis ikut tervalidasi. Hanya kunci terdaftar, bilangan bulat, dalam rentang.
 */

import { z } from 'zod';
import { SETTING_KEYS, SETTING_REGISTRY, type NumericSettingKey } from './settings.service';

const shape = Object.fromEntries(
  SETTING_KEYS.map((key) => {
    const { min, max } = SETTING_REGISTRY[key];
    return [
      key,
      z
        .number({ invalid_type_error: `${key} harus angka` })
        .int(`${key} harus bilangan bulat`)
        .min(min, `${key} minimal ${min}`)
        .max(max, `${key} maksimal ${max}`)
        .optional(),
    ];
  }),
) as Record<NumericSettingKey, z.ZodOptional<z.ZodNumber>>;

export const updateSettingsSchema = z
  .object(shape)
  .strict()
  .refine((body) => Object.keys(body).length > 0, { message: 'Minimal satu parameter diubah' });
