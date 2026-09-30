import { Router } from 'express';
import { health } from './health.controller';

/**
 * `GET /health` (PRD Bagian 4.3, akses publik).
 *
 * Dipasang dua kali oleh `app.ts`: di akar untuk probe infrastruktur, dan di
 * bawah `/api/v1` supaya konsisten dengan daftar endpoint. Keduanya
 * penanganan yang sama.
 */
export const healthRouter = Router();

healthRouter.get('/health', health);
