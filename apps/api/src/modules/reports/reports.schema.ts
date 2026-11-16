/**
 * Validasi query laporan admin (D180, usulan D200). `from` dan `to` hari kalender WITA,
 * inklusif, wajib, paling banyak 366 hari. Format ketat juga menutup jalan injeksi, walaupun
 * nilainya tetap dikirim sebagai parameter terikat.
 */

import { z } from 'zod';
import { paginationQuery } from '../../lib/pagination';

export const REPORT_MAX_DAYS = 366;

const witaDate = (field: string) =>
  z
    .string({ required_error: `${field} wajib diisi`, invalid_type_error: `${field} harus tanggal` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${field} harus berformat YYYY-MM-DD`)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
    }, `${field} bukan tanggal yang sah`);

const DAY_MS = 24 * 60 * 60 * 1000;

const period = {
  from: witaDate('from'),
  to: witaDate('to'),
};

function checkRange(value: { from: string; to: string }, ctx: z.RefinementCtx): void {
  const days = (Date.parse(`${value.to}T00:00:00Z`) - Date.parse(`${value.from}T00:00:00Z`)) / DAY_MS + 1;
  if (days < 1) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['to'], message: 'to tidak boleh sebelum from' });
  else if (days > REPORT_MAX_DAYS) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['to'], message: `Rentang laporan paling panjang ${REPORT_MAX_DAYS} hari` });
  }
}

export const periodQuerySchema = z.object(period).superRefine(checkRange);
export type PeriodQuery = z.infer<typeof periodQuerySchema>;

export const pagedPeriodQuerySchema = z.object({ ...period, ...paginationQuery }).superRefine(checkRange);
export type PagedPeriodQuery = z.infer<typeof pagedPeriodQuerySchema>;
