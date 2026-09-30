/**
 * Skema Zod modul auth. Field body `snake_case` mengikuti PRD 4.1.
 *
 * Field yang tidak dikenal DIBUANG oleh Zod (perilaku bawaan `z.object`),
 * bukan ditolak. Jadi body yang menyelipkan `role: "ADMIN"` atau
 * `email_verified_at` saat registrasi tidak berpengaruh apa pun.
 */

import { z } from 'zod';

/** Email dinormalisasi huruf kecil, supaya `A@x.com` dan `a@x.com` satu akun. */
export const emailField = z
  .string({ required_error: 'email wajib diisi' })
  .trim()
  .toLowerCase()
  .max(255, 'email maksimal 255 karakter')
  .email('email tidak sah');

/**
 * bcrypt hanya membaca 72 BYTE pertama. Tanpa batas atas, dua password yang
 * sama di 72 byte awal dianggap identik, dan orang yang mengira password
 * panjangnya lebih aman ternyata tidak.
 */
export const passwordField = z
  .string({ required_error: 'password wajib diisi' })
  .min(8, 'password minimal 8 karakter')
  .refine((value) => Buffer.byteLength(value, 'utf8') <= 72, 'password maksimal 72 byte');

/**
 * Nomor ponsel Indonesia, dinormalisasi ke bentuk +628xxxxxxxx.
 *
 * `users.phone` unik, jadi tanpa normalisasi `0812...`, `62812...`, dan
 * `+62 812-...` bisa terdaftar sebagai tiga akun berbeda untuk satu nomor.
 */
export const phoneField = z
  .string({ required_error: 'phone wajib diisi' })
  .transform((value) => value.replace(/[\s\-().]/g, ''))
  .transform((value) => {
    if (value.startsWith('+62')) return value;
    if (value.startsWith('62')) return `+${value}`;
    if (value.startsWith('0')) return `+62${value.slice(1)}`;
    return value;
  })
  .pipe(z.string().regex(/^\+628\d{7,11}$/, 'phone harus nomor ponsel Indonesia yang sah'));

export const fullNameField = z
  .string({ required_error: 'full_name wajib diisi' })
  .trim()
  .min(2, 'full_name minimal 2 karakter')
  .max(100, 'full_name maksimal 100 karakter');

/** Token dari tautan email. Bentuknya tidak diperiksa di sini, service yang menilai. */
const linkToken = z.string({ required_error: 'token wajib diisi' }).trim().min(1).max(256);

const refreshToken = z
  .string({ required_error: 'refresh_token wajib diisi' })
  .trim()
  .min(1)
  .max(256);

export const registerSchema = z.object({
  full_name: fullNameField,
  email: emailField,
  phone: phoneField,
  password: passwordField,
});

/**
 * Login dengan email ATAU nomor ponsel (skema basis data: phone adalah
 * alternatif kredensial login). Password di sini tidak diberi aturan panjang,
 * supaya pesan galat tidak membocorkan kebijakan password ke penebak.
 */
export const loginSchema = z
  .object({
    email: emailField.optional(),
    phone: phoneField.optional(),
    password: z.string({ required_error: 'password wajib diisi' }).min(1).max(256),
  })
  .refine((body) => (body.email === undefined) !== (body.phone === undefined), {
    message: 'isi salah satu dari email atau phone',
    path: ['email'],
  });

export const refreshSchema = z.object({ refresh_token: refreshToken });

export const logoutSchema = z.object({ refresh_token: refreshToken });

export const tokenSchema = z.object({ token: linkToken });

export const forgotPasswordSchema = z.object({ email: emailField });

export const resetPasswordSchema = z.object({
  token: linkToken,
  new_password: passwordField,
});

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
