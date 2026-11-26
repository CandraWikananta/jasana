import { expect, test, type Locator, type Page } from "@playwright/test"
import { fail, GUEST_SESSION_ID, GUEST_TOKEN, message, mockChat, mockLogin, mockSignup, ok, reply } from "./asisten-mocks"

// W8b, kriteria W8 (PRD Frontend 11) dan usulan D273: tamu yang mendaftar atau masuk di tengah percakapan
// melanjutkan percakapan yang sama. Seluruh /chat/*, daftar, dan masuk ditiru.

const panel = (page: Page) => page.getByRole("dialog", { name: "Asisten Jasana" })
// Next menyimpan halaman sebelumnya tersembunyi di DOM, jadi hanya yang terlihat.
const input = (scope: Page | Locator) => scope.getByLabel("Pesan untuk Asisten").filter({ visible: true })
const log = (scope: Page | Locator) => scope.getByRole("region", { name: "Percakapan" }).filter({ visible: true })
const guestStored = (page: Page) => page.evaluate(() => sessionStorage.getItem("jasana_asisten_tamu"))

/** Riwayat sesi yang sama, kini dibaca sebagai akun (tanpa X-Guest-Token). */
const CLAIMED_HISTORY = [message("USER", "halo"), message("ASSISTANT", "Halo! Aku asisten Jasana.", { intent: "sapaan" })]

/** Pesan tamu pertama dijawab, berikutnya kena batas tamu. Pesan akun (tanpa token tamu) selalu dijawab. */
function limitOnSecond(mock: Awaited<ReturnType<typeof mockChat>>) {
  mock.onSend = (route, { content, token }, i) =>
    i === 0 || token === null
      ? ok(route, reply(content, "Halo! Aku asisten Jasana.", { remaining: 1 }), undefined, 201)
      : fail(route, 429, "GUEST_CHAT_LIMIT_REACHED")
  mock.onHistory = (route, _id, token) =>
    token === null ? ok(route, CLAIMED_HISTORY, { page: 1, limit: 100, total: 2 }) : fail(route, 404, "NOT_FOUND")
}

async function say(scope: Page | Locator, text: string) {
  await input(scope).fill(text)
  await input(scope).press("Enter")
}

test.describe("desktop, dari panel widget", () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test("kena batas, Daftar, lalu kembali ke halaman asal dengan percakapan yang sama", async ({ page }) => {
    const mock = await mockChat(page)
    limitOnSecond(mock)
    const calls = await mockSignup(page)

    await page.goto("/cari?q=servis")
    await page.locator("[data-assistant-launcher]").getByRole("button").click()
    await say(panel(page), "halo")
    await expect(log(panel(page)).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await say(panel(page), "servis AC besok pagi")
    await expect(panel(page).getByText("Batas percakapan tamu sudah tercapai")).toBeVisible()

    await panel(page).getByRole("link", { name: "Daftar" }).click()
    await expect(page).toHaveURL("/daftar?next=%2Fcari%3Fq%3Dservis")
    expect(JSON.parse((await guestStored(page))!)).toEqual({ sessionId: GUEST_SESSION_ID, token: GUEST_TOKEN, resume: true })

    await page.getByLabel("Nama lengkap").fill("Putu Ayu")
    await page.getByLabel("Email").fill("putu@contoh.id")
    await page.getByLabel("Nomor ponsel").fill("081234567890")
    await page.getByLabel("Kata sandi", { exact: true }).fill("rahasiaku123")
    await page.getByRole("button", { name: "Daftar" }).click()
    await expect(page.getByText("Akunmu sudah dibuat")).toBeVisible()
    expect(calls).toEqual({ register: 1, login: 1 })
    // Masih di /daftar: klaim belum jalan, karena widget tidak dipasang di halaman auth.
    expect(mock.claims).toHaveLength(0)

    await page.getByRole("link", { name: "Lanjut" }).click()
    await expect(page).toHaveURL("/cari?q=servis")
    await expect(panel(page)).toBeVisible()
    await expect(log(panel(page)).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    // Pertanyaan yang tertahan batas tamu tidak tersimpan di server, jadi kembali ke kotak tulis.
    await expect(input(panel(page))).toHaveValue("servis AC besok pagi")
    await expect(input(panel(page))).toBeFocused()
    expect(mock.claims).toEqual([{ sessionId: GUEST_SESSION_ID, token: GUEST_TOKEN, bearer: "Bearer uji" }])
    expect(await guestStored(page)).toBeNull()

    await input(panel(page)).press("Enter")
    await expect.poll(() => mock.sent.length).toBe(3)
    // Pesan berikutnya di sesi yang sama, sebagai akun.
    expect(mock.sent[2]!.token).toBeNull()
    await expect(panel(page).getByText("Batas percakapan tamu sudah tercapai")).toHaveCount(0)
    expect(mock.created).toBe(1)
  })

  test("masuk lewat header tanpa dari percakapan: diklaim diam-diam, panel tidak membuka sendiri", async ({ page }) => {
    const mock = await mockChat(page)
    limitOnSecond(mock)
    await page.addInitScript(
      ([sessionId, token]) => {
        if (!sessionStorage.getItem("sudah")) sessionStorage.setItem("jasana_asisten_tamu", JSON.stringify({ sessionId, token }))
        sessionStorage.setItem("sudah", "1")
      },
      [GUEST_SESSION_ID, GUEST_TOKEN],
    )
    await mockLogin(page)
    await page.goto("/")
    await expect.poll(() => mock.claims.length).toBe(1)
    await expect(panel(page)).toHaveCount(0)
    await page.locator("[data-assistant-launcher]").getByRole("button").click()
    await expect(log(panel(page)).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
  })
})

test.describe("halaman /asisten", () => {
  /** Tamu sudah punya sesi di tab ini, lalu masuk. Penanda hanya dipasang sekali, seperti tab sungguhan. */
  async function signedInWithGuest(page: Page) {
    await page.addInitScript(
      ([sessionId, token]) => {
        if (!sessionStorage.getItem("sudah")) sessionStorage.setItem("jasana_asisten_tamu", JSON.stringify({ sessionId, token }))
        sessionStorage.setItem("sudah", "1")
      },
      [GUEST_SESSION_ID, GUEST_TOKEN],
    )
    await mockLogin(page)
  }

  test("berhasil: percakapan tamu jadi percakapan akun di URL", async ({ page }) => {
    const mock = await mockChat(page)
    limitOnSecond(mock)
    await signedInWithGuest(page)
    await page.goto("/asisten")
    await expect(page).toHaveURL(`/asisten?percakapan=${GUEST_SESSION_ID}`)
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    expect(mock.claims).toHaveLength(1)
    expect(await guestStored(page)).toBeNull()
    await page.reload()
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    expect(mock.claims).toHaveLength(1)
  })

  test("sudah diklaim di tab lain: dibuka sebagai akun", async ({ page }) => {
    const mock = await mockChat(page)
    limitOnSecond(mock)
    mock.onClaim = (route) => fail(route, 409, "CHAT_SESSION_ALREADY_CLAIMED")
    await signedInWithGuest(page)
    await page.goto("/asisten")
    await expect(page).toHaveURL(`/asisten?percakapan=${GUEST_SESSION_ID}`)
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    expect(await guestStored(page)).toBeNull()
  })

  test("percakapan tamu sudah berakhir: pemberitahuan, dan pertanyaan yang tertahan tetap di kotak tulis", async ({ page }) => {
    const mock = await mockChat(page)
    limitOnSecond(mock)
    mock.onClaim = (route) => fail(route, 409, "CHAT_SESSION_ENDED")
    await mockSignup(page)
    await page.goto("/asisten")
    await say(page, "halo")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await say(page, "cuci sofa minggu depan")
    await page.getByRole("main").getByRole("link", { name: "Masuk" }).click()
    await expect(page).toHaveURL("/masuk?next=%2Fasisten")
    await page.getByLabel("Email atau nomor ponsel").fill("putu@contoh.id")
    await page.getByLabel("Kata sandi", { exact: true }).fill("rahasiaku123")
    await page.getByRole("button", { name: "Masuk" }).click()
    await expect(page).toHaveURL("/asisten")
    await expect(page.getByText("Percakapan tamu sudah berakhir")).toBeVisible()
    await expect(input(page)).toHaveValue("cuci sofa minggu depan")
    expect(await guestStored(page)).toBeNull()

    await input(page).press("Enter")
    await expect(page).toHaveURL(/percakapan=/)
    await expect(page.getByText("Percakapan tamu sudah berakhir")).toHaveCount(0)
  })

  test("klaim gagal sementara: sesi tamu tetap tersimpan, Coba lagi melanjutkan", async ({ page }) => {
    const mock = await mockChat(page)
    limitOnSecond(mock)
    mock.onClaim = (route, claim, i) => (i === 0 ? fail(route, 503, "SERVICE_UNAVAILABLE") : ok(route, { id: claim.sessionId }))
    await signedInWithGuest(page)
    await page.goto("/asisten")
    await expect(page.getByText("Percakapanmu belum tersimpan ke akun")).toBeVisible()
    expect(await guestStored(page)).toContain(GUEST_TOKEN)
    await page.getByRole("button", { name: "Coba lagi" }).click()
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    expect(mock.claims).toHaveLength(2)
    expect(await guestStored(page)).toBeNull()
  })
})
