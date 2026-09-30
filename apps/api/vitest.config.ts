import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // Environment disiapkan sebelum modul apa pun diimpor, karena
    // src/config/env.ts memvalidasi saat diimpor.
    setupFiles: ['tests/setup.ts'],
    // Uji integrasi menyentuh basis data yang sama, jadi jangan paralel.
    fileParallelism: false,
  },
});
