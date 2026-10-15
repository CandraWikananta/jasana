/**
 * Penerima unggahan multipart (D80). Hanya untuk dokumen e-KYC dan bukti
 * dispute. Foto listing TIDAK lewat sini, melainkan signed URL.
 *
 * `memoryStorage`, BUKAN `diskStorage`: berkas hanya hidup di memori selama
 * permintaan berjalan, tidak ada berkas sementara yang tertinggal di server
 * kalau proses berhenti di tengah jalan.
 *
 * Middleware ini hanya menerima dan membatasi UKURAN. Pemeriksaan jenis
 * berkas lewat magic bytes ada di service, karena itu aturan bisnis yang
 * harus bisa diuji tanpa HTTP.
 *
 * Batas ukuran dibaca dari `platform_settings` pada setiap permintaan, jadi
 * instance multer dibuat per permintaan. Batas body JSON 1 MB tidak berlaku
 * di sini, karena express.json hanya membaca `application/json`.
 */

import type { RequestHandler } from 'express';
import multer from 'multer';
import { AppError, Errors } from '../lib/errors';

interface SingleFileOptions {
  /** Nama field berkas di form. */
  field: string;
  /** Batas ukuran dalam MB, dibaca saat permintaan masuk. */
  maxSizeMb: () => Promise<number>;
}

function translate(error: unknown, field: string, maxSizeMb: number): unknown {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new AppError('PAYLOAD_TOO_LARGE', `Ukuran berkas melebihi batas ${maxSizeMb} MB`);
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return Errors.validation([
        { path: error.field ?? field, message: `Hanya satu berkas pada field ${field} yang diterima` },
      ]);
    }
    return Errors.validation([{ path: error.field ?? '(root)', message: error.message }]);
  }
  // Galat busboy untuk body multipart yang rusak, misalnya boundary hilang.
  if (error instanceof Error) {
    return Errors.validation([{ path: '(root)', message: 'Body multipart tidak sah' }]);
  }
  return error;
}

export function singleFileUpload(options: SingleFileOptions): RequestHandler {
  return (req, res, next) => {
    options.maxSizeMb().then((maxSizeMb) => {
      const receive = multer({
        storage: multer.memoryStorage(),
        limits: {
          fileSize: Math.floor(maxSizeMb * 1024 * 1024),
          files: 1,
          // Satu berkas plus beberapa field teks pendek, tidak lebih.
          fields: 5,
          fieldSize: 1024,
          parts: 6,
        },
      }).single(options.field);

      receive(req, res, (error: unknown) => {
        if (error) {
          next(translate(error, options.field, maxSizeMb));
          return;
        }
        next();
      });
    }, next);
  };
}
