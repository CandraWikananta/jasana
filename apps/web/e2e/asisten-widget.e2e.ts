import { expect, test, type Locator, type Page } from "@playwright/test"
import { ACCOUNT_SESSION_ID, GUEST_SESSION_ID, mockChat, mockLogin } from "./asisten-mocks"

// W8b, usulan D271 dan D272. Seluruh /chat/* ditiru (tanpa Gemini). Halaman publik memuat data dari API di
// port 3000, jadi API harus berjalan.

const API = "http://localhost:3000/api/v1"
const launcher = (page: Page) => page.locator("[data-assistant-launcher]")
const panel = (page: Page) => page.getByRole("dialog", { name: "Asisten Jasana" })
// Next menyimpan halaman sebelumnya tersembunyi di DOM, jadi hanya yang terlihat.
const input = (scope: Page | Locator) => scope.getByLabel("Pesan untuk Asisten").filter({ visible: true })
const log = (scope: Page | Locator) => scope.getByRole("region", { name: "Percakapan" }).filter({ visible: true })

/** Nilai CSS yang memakai var() dibaca sebagai piksel lewat elemen uji. */
function px(page: Page, property: "bottom" | "right", value: string) {
  return page.evaluate(
    ([prop, v]) => {
      const probe = document.createElement("div")
      probe.style.position = "fixed"
      probe.style[prop as "bottom"] = v!
      document.body.append(probe)
      const result = parseFloat(getComputedStyle(probe)[prop as "bottom"])
      probe.remove()
      return result
    },
    [property, value],
  )
}

async function firstListingId(page: Page): Promise<string> {
  const res = await page.request.get(`${API}/listings`, { params: { limit: 1 } })
  const body = (await res.json()) as { data: { id: string }[] }
  return body.data[0]!.id
}

test.describe("HP", () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test("tautan ke /asisten, di atas navigasi bawah, dan toast di atasnya", async ({ page }) => {
    await mockChat(page)
    await page.goto("/cari")
    const link = launcher(page).getByRole("link", { name: "Tanya Asisten" })
    await expect(link).toHaveAttribute("href", "/asisten")
    await expect(launcher(page).getByRole("button")).toBeHidden()
    const tamu = (await link.boundingBox())!
    expect(844 - (tamu.y + tamu.height)).toBe(16)

    await mockLogin(page)
    await page.goto("/cari")
    const nav = page.getByRole("navigation", { name: "Navigasi utama" })
    await expect(nav).toBeVisible()
    const box = (await link.boundingBox())!
    const navBox = (await nav.boundingBox())!
    expect(navBox.y - (box.y + box.height)).toBe(16)
    // Toast di atas ujung tombol, scroll-padding juga (WCAG 2.4.11).
    const toast = await px(page, "bottom", "var(--toast-offset-bottom)")
    expect(844 - toast).toBeLessThanOrEqual(box.y - 12)
    const scrollPad = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingBottom))
    expect(844 - scrollPad).toBeLessThanOrEqual(box.y)
  })

  test("detail jasa: tidak tampil di bawah lg, bar Pesan aksi utamanya", async ({ page }) => {
    const id = await firstListingId(page)
    await page.goto(`/listing/${id}`)
    await expect(page.getByRole("link", { name: "Pesan" }).last()).toBeVisible()
    await expect(launcher(page)).toBeHidden()
  })

  test("akun: tautan membuka percakapan terakhir di tab ini", async ({ page }) => {
    await mockChat(page)
    await mockLogin(page)
    await page.goto("/asisten")
    await input(page).fill("halo")
    await input(page).press("Enter")
    await expect(page).toHaveURL(/percakapan=/)
    await page.getByRole("banner").getByRole("link").first().click()
    await page.waitForURL((url) => url.pathname === "/")
    await expect(launcher(page).getByRole("link")).toHaveAttribute("href", `/asisten?percakapan=${ACCOUNT_SESSION_ID}`)
  })
})

test.describe("desktop", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("tampil di publik dan pelanggan, tidak di /asisten, auth, dan usaha", async ({ page }) => {
    await mockChat(page)
    const id = await firstListingId(page)
    for (const path of ["/", "/cari", `/listing/${id}`]) {
      await page.goto(path)
      await expect(launcher(page).getByRole("button", { name: "Tanya Asisten" }), path).toBeVisible()
    }
    for (const path of ["/asisten", "/masuk", "/daftar"]) {
      await page.goto(path)
      await expect(page.locator("main")).toBeVisible()
      await expect(launcher(page), path).toHaveCount(0)
    }
    await mockLogin(page)
    await page.goto("/akun")
    await expect(launcher(page).getByRole("button")).toBeVisible()
    await page.goto("/usaha")
    await expect(page.locator("main")).toBeVisible()
    await expect(launcher(page)).toHaveCount(0)
  })

  test("panel non-modal: fokus masuk ke kotak tulis, Esc menutup dan mengembalikan fokus", async ({ page }) => {
    await mockChat(page)
    await page.goto("/cari")
    const button = launcher(page).getByRole("button", { name: "Tanya Asisten" })
    await expect(button).toHaveAttribute("aria-expanded", "false")
    await button.click()
    await expect(panel(page)).toBeVisible()
    await expect(input(panel(page))).toBeFocused()
    await expect(button).toBeHidden()
    // Non-modal: halaman di belakangnya tetap bisa dipakai, panel tidak menutup sendiri.
    await page.getByRole("heading", { level: 1 }).click()
    await expect(panel(page)).toBeVisible()
    // Toast pindah ke kiri panel.
    const panelBox = (await panel(page).boundingBox())!
    const right = await px(page, "right", "var(--toast-offset-right)")
    expect(1280 - right).toBeLessThanOrEqual(panelBox.x)

    await input(panel(page)).focus()
    await page.keyboard.press("Escape")
    await expect(panel(page)).toBeHidden()
    await expect(button).toBeFocused()
    await expect(button).toHaveAttribute("aria-expanded", "false")
  })

  test("satu percakapan dengan halaman penuh, panel bertahan saat pindah halaman, draf ikut", async ({ page }) => {
    const mock = await mockChat(page)
    await page.goto("/cari")
    await launcher(page).getByRole("button").click()
    await input(panel(page)).fill("servis AC")
    await input(panel(page)).press("Enter")
    await expect(log(panel(page)).getByText("Halo! Aku asisten Jasana.")).toBeVisible()

    await page.getByRole("banner").getByRole("link").first().click()
    await page.waitForURL((url) => url.pathname === "/")
    await expect(log(panel(page)).getByText("Halo! Aku asisten Jasana.")).toBeVisible()

    await input(panel(page)).fill("draf dari panel")
    await panel(page).getByRole("link", { name: "Buka di halaman penuh" }).click()
    await page.waitForURL((url) => url.pathname === "/asisten")
    await expect(page.getByRole("region", { name: "Percakapan" }).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await expect(input(page)).toHaveValue("draf dari panel")
    expect(mock.created).toBe(1)
    expect(mock.sent.every((s) => s.token !== null)).toBe(true)

    await input(page).fill("dari halaman")
    await input(page).press("Enter")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toHaveCount(2)
    await page.goBack()
    await launcher(page).getByRole("button").click()
    await expect(log(panel(page)).getByText("Halo! Aku asisten Jasana.")).toHaveCount(2)
    expect(mock.created).toBe(1)
    expect(await page.evaluate(() => sessionStorage.getItem("jasana_asisten_tamu"))).toContain(GUEST_SESSION_ID)
  })

  test("contoh di beranda dan pencarian tanpa hasil mengisi kotak tulis tanpa mengirim", async ({ page }) => {
    const mock = await mockChat(page)
    await page.goto("/")
    await page.getByRole("link", { name: "Motor mogok di Sanur, bisa datang sore ini?" }).click()
    await page.waitForURL((url) => url.pathname === "/asisten")
    await expect(input(page)).toHaveValue("Motor mogok di Sanur, bisa datang sore ini?")
    await expect(page).toHaveURL("/asisten")
    expect(mock.created).toBe(0)
    expect(mock.sent).toHaveLength(0)

    await page.goto("/cari?q=zzqqxxjasatidakada")
    await expect(page.getByText("Tidak ada jasa yang cocok")).toBeVisible()
    await expect(page.getByRole("main").getByRole("link", { name: "Tanya Asisten" })).toHaveAttribute(
      "href",
      "/asisten?isi=zzqqxxjasatidakada",
    )
  })
})
