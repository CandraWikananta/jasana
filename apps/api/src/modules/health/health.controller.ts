/**
 * Controller health check.
 *
 * Tidak menyentuh Prisma, sesuai aturan lapisan. Tugasnya hanya memanggil
 * service lalu memilih status HTTP.
 */

import type { RequestHandler } from 'express';
import { getHealthStatus } from './health.service';
import { sendOk } from '../../lib/envelope';
import { errorEnvelope } from '../../lib/envelope';
import { httpStatusFor } from '@jasana/shared';

export const health: RequestHandler = async (req, res, next) => {
  try {
    const status = await getHealthStatus();

    if (status.database === 'down') {
      // Penyebab aslinya masuk log, tapi TIDAK dikirim ke client: pesan galat
      // koneksi memuat host dan nama basis data.
      req.log?.error(
        { request_id: req.id, database_error: status.database_error },
        'Health check gagal, basis data tidak dapat dihubungi',
      );

      const { database_error: _ignored, ...safe } = status;

      res
        .status(httpStatusFor('SERVICE_UNAVAILABLE'))
        .json({
          ...errorEnvelope(
            'SERVICE_UNAVAILABLE',
            'Basis data tidak dapat dihubungi',
          ),
          data: safe,
        });
      return;
    }

    sendOk(res, status);
  } catch (error) {
    next(error);
  }
};
