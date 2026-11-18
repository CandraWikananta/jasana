import { defineConfig } from "@playwright/test"

// Smoke E2E (PRD Frontend 10.2). API Express harus sudah berjalan di port 3000 dengan data
// simulasi (docs/Data-Simulasi.md). Dev server Next dinyalakan otomatis kalau belum ada.
// Memakai Edge sistem (channel msedge), jadi tidak perlu mengunduh Chromium.
export default defineConfig({
  testDir: "e2e",
  testMatch: "**/*.e2e.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    channel: "msedge",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next dev -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: true,
    timeout: 120_000,
  },
})
