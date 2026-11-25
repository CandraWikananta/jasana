import { expect, test } from "@playwright/test"

// H149: Next menyimpan halaman yang ditinggalkan tetap terpasang tapi tersembunyi (Cache Components),
// jadi yang diperiksa seluruh dokumen, bukan hanya yang terlihat. Tanpa login, tanpa panggilan API.
const PAGES = [
  { path: "/masuk", fields: { identifier: "uji@contoh.id", password: "Rahasia-123" } },
  { path: "/daftar", fields: { full_name: "Nama Uji", email: "uji@contoh.id", phone: "081234567890", password: "Rahasia-123" } },
  { path: "/lupa-sandi", fields: { email: "uji@contoh.id" } },
  { path: "/atur-ulang-sandi?token=uji", fields: { password: "Rahasia-123" } },
]

for (const { path, fields } of PAGES) {
  test(`isian ${path} tidak tertinggal setelah halaman ditinggalkan`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" })
    for (const [name, value] of Object.entries(fields)) await page.locator(`input[name="${name}"]`).fill(value)

    await page.getByRole("banner").getByRole("link").first().click()
    await page.waitForURL((url) => url.pathname === "/")

    for (const [name, value] of Object.entries(fields)) {
      // Isian lama masih ada di dokumen (tersembunyi) tapi kosong; kalau tidak ada sama sekali juga aman.
      await expect
        .poll(() =>
          page.locator(`input[name="${name}"]`).evaluateAll((inputs, typed) => inputs.filter((i) => (i as HTMLInputElement).value === typed).length, value),
        )
        .toBe(0)
    }
  })
}
