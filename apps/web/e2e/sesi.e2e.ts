import { expect, test, type BrowserContext, type Page } from "@playwright/test"

// Kriteria W0 (PRD Frontend 11): refresh di dua tab bersamaan tidak memicu logout (D212, D76).
//
// Batas login API 10 per 15 menit per IP, jadi seluruh skenario berbagi SATU login dalam satu
// konteks browser (dua tab berbagi cookie, seperti dua tab sungguhan). Akun dari Data-Simulasi.md.

const EMAIL = process.env.E2E_EMAIL ?? "demo.client@sim.jasana.test"
const PASSWORD = process.env.E2E_PASSWORD ?? "Simulasi-Jasana-2026"
const API = process.env.E2E_API_BASE_URL ?? "http://localhost:3000/api/v1"
const REFRESH_COOKIE = process.env.E2E_SESSION_COOKIE_NAME ?? "jasana_refresh"
const FLAG_COOKIE = "jasana_sesi"

test.describe.configure({ mode: "serial" })

let context: BrowserContext
let tab1: Page
let tab2: Page
/** Urutan kejadian sesi lintas tab, misalnya "refresh:200", "logout:200". */
let events: string[] = []

const accountMenu = (page: Page) => page.getByRole("button", { name: "Menu akun" })
const loginLink = (page: Page) => page.getByRole("banner").getByRole("link", { name: "Masuk", exact: true })

async function sessionCookies() {
  const cookies = await context.cookies()
  return {
    refresh: cookies.find((cookie) => cookie.name === REFRESH_COOKIE),
    flag: cookies.find((cookie) => cookie.name === FLAG_COOKIE),
  }
}

async function expectSignedIn(page: Page) {
  await expect(accountMenu(page)).toBeVisible()
  // Inisial avatar berasal dari GET /auth/me, jadi ini juga membuktikan request ber-token berhasil.
  await expect(accountMenu(page)).not.toHaveText("")
}

test.beforeAll(async ({ browser }) => {
  context = await browser.newContext()
  context.on("response", (response) => {
    const path = new URL(response.url()).pathname
    if (path.startsWith("/api/session/")) events.push(`${path.split("/").at(-1)}:${response.status()}`)
  })
  tab1 = await context.newPage()
})

test.afterAll(async () => {
  await context?.close()
})

test("Route Handler sesi menolak origin lain (403) tanpa memanggil API", async ({ request }) => {
  for (const name of ["login", "refresh", "logout"]) {
    const res = await request.post(`/api/session/${name}`, {
      headers: { origin: "https://jahat.test" },
      data: { email: EMAIL, password: PASSWORD },
    })
    expect(res.status(), name).toBe(403)
    expect((await res.json()).error.code).toBe("CORS_ORIGIN_NOT_ALLOWED")
  }
})

test("masuk lewat /masuk lalu kembali ke next", async () => {
  await tab1.goto("/masuk?next=/")
  await tab1.getByLabel("Email atau nomor ponsel").fill(EMAIL)
  await tab1.getByLabel("Kata sandi", { exact: true }).fill(PASSWORD)

  // Kata sandi salah (401 tiruan, tidak memakan jatah login API): pesan khusus, tombol aktif lagi.
  await tab1.route("**/api/session/login", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "x", details: [] } }),
    }),
  )
  await tab1.getByRole("button", { name: "Masuk" }).click()
  await expect(tab1.getByText("Email, nomor ponsel, atau kata sandi salah.")).toBeVisible()
  await expect(tab1.getByRole("button", { name: "Masuk" })).toBeEnabled()
  await tab1.unroute("**/api/session/login")

  await tab1.getByRole("button", { name: "Masuk" }).click()

  await expect(tab1).toHaveURL("/")
  await expectSignedIn(tab1)

  const { refresh, flag } = await sessionCookies()
  expect(refresh?.httpOnly).toBe(true)
  expect(refresh?.path).toBe("/api/session")
  expect(refresh?.sameSite).toBe("Lax")
  expect(flag?.value).toBe("1")
  expect(flag?.path).toBe("/")

  // Aturan web nomor 7: tidak ada token di storage browser.
  const storage = await tab1.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }))
  expect(storage).not.toMatch(/eyJ|token/i)
})

test("muat ulang dua tab bersamaan: keduanya tetap masuk, family tidak dicabut", async () => {
  tab2 = await context.newPage()
  await tab2.goto("/")
  await expectSignedIn(tab2)

  for (let round = 0; round < 3; round++) {
    events = []
    await Promise.all([tab1.reload(), tab2.reload()])
    await Promise.all([expectSignedIn(tab1), expectSignedIn(tab2)])
    const refreshes = events.filter((event) => event.startsWith("refresh:"))
    expect(refreshes.length, `putaran ${round}`).toBeGreaterThanOrEqual(2)
    expect(refreshes, `putaran ${round}`).toEqual(refreshes.map(() => "refresh:200"))
  }
})

test("access token kedaluwarsa di dua tab bersamaan: 401 -> refresh -> ulang, tetap masuk", async () => {
  // GET /auth/me pertama di tiap tab dijawab 401 seperti token yang sudah habis.
  const expired = new WeakSet<Page>()
  await context.route(`${API}/auth/me`, async (route, request) => {
    const page = request.frame().page()
    if (request.method() !== "GET" || expired.has(page)) return route.continue()
    expired.add(page)
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      headers: { "access-control-allow-origin": new URL(page.url()).origin },
      body: JSON.stringify({ success: false, error: { code: "UNAUTHORIZED", message: "jwt expired", details: [] } }),
    })
  })

  events = []
  await Promise.all([tab1.reload(), tab2.reload()])
  await Promise.all([expectSignedIn(tab1), expectSignedIn(tab2)])
  await context.unroute(`${API}/auth/me`)

  // Dua refresh saat bootstrap + dua refresh karena 401, seluruhnya diterima.
  const refreshes = events.filter((event) => event.startsWith("refresh:"))
  expect(refreshes.length).toBeGreaterThanOrEqual(4)
  expect(refreshes).toEqual(refreshes.map(() => "refresh:200"))

  // Family masih hidup setelah semua rotasi itu.
  events = []
  await tab1.reload()
  await expectSignedIn(tab1)
  expect(events).toContain("refresh:200")
})

test("keluar setelah access token kedaluwarsa: refresh dulu, refresh token dicabut di API", async ({ request }) => {
  await tab2.close()
  // Jam palsu harus terpasang sebelum dokumen dimuat.
  await context.clock.install()
  await tab1.reload()
  await expectSignedIn(tab1)

  // Access token 15 menit. Setelah 20 menit, client tahu tokennya habis.
  await tab1.clock.fastForward("20:00")

  let sentRefreshToken: string | undefined
  await context.route("**/api/session/logout", async (route) => {
    // Saat request logout ditahan, jar cookie berisi token hasil rotasi terakhir: itu yang dikirim.
    sentRefreshToken = (await sessionCookies()).refresh?.value
    await route.continue()
  })

  events = []
  const logoutResponse = tab1.waitForResponse((response) => response.url().endsWith("/api/session/logout"))
  await accountMenu(tab1).click()
  await tab1.getByRole("menuitem", { name: "Keluar" }).click()
  const logoutBody = await (await logoutResponse).json()
  await context.unroute("**/api/session/logout")

  expect(events).toEqual(["refresh:200", "logout:200"])
  expect(logoutBody.data).toEqual({ revoked: true })
  expect(sentRefreshToken).toBeTruthy()

  // Refresh token yang dipakai saat logout sudah ditolak API.
  const reuse = await request.post(`${API}/auth/refresh`, { data: { refresh_token: sentRefreshToken } })
  expect(reuse.status()).toBe(401)

  await expect(loginLink(tab1)).toBeVisible()
  const { refresh, flag } = await sessionCookies()
  expect(refresh).toBeUndefined()
  expect(flag).toBeUndefined()

  await tab1.goto("/pesanan")
  await expect(tab1).toHaveURL("/masuk?next=%2Fpesanan")
})

test("refresh ditolak: kedua cookie dihapus, proxy tidak tertipu penanda basi", async () => {
  await context.addCookies([
    { name: REFRESH_COOKIE, value: "token-sampah", domain: "localhost", path: "/api/session", httpOnly: true, sameSite: "Lax" },
    { name: FLAG_COOKIE, value: "1", domain: "localhost", path: "/", sameSite: "Lax" },
  ])

  events = []
  await tab1.goto("/")
  await expect(loginLink(tab1)).toBeVisible()
  expect(events).toEqual(["refresh:401"])

  const { refresh, flag } = await sessionCookies()
  expect(refresh).toBeUndefined()
  expect(flag).toBeUndefined()

  await tab1.goto("/pesanan")
  await expect(tab1).toHaveURL("/masuk?next=%2Fpesanan")
})
