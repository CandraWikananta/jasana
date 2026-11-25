import { expect, test, type Page } from "@playwright/test"
import {
  ACCOUNT_SESSION_ID,
  card,
  fail,
  GUEST_SESSION_ID,
  GUEST_TOKEN,
  message,
  mockChat,
  mockLogin,
  ok,
  reply,
  session,
} from "./asisten-mocks"

// W8a. Seluruh /chat/* ditiru: tidak memanggil Gemini, tidak memakai jatah login, tidak menulis basis data.

const DENPASAR = { latitude: -8.6705, longitude: 115.2126 }
const input = (page: Page) => page.getByLabel("Pesan untuk Asisten")
const log = (page: Page) => page.getByRole("region", { name: "Percakapan" })

async function open(page: Page, path = "/asisten") {
  await page.goto(path)
  await expect(page.getByRole("heading", { level: 1, name: "Asisten Jasana" })).toBeVisible()
}

async function say(page: Page, text: string) {
  await input(page).fill(text)
  await input(page).press("Enter")
}

test.describe("tamu", () => {
  test("sesi dibuat saat pesan pertama, dan token hanya di sessionStorage", async ({ page }) => {
    const mock = await mockChat(page)
    // Riwayat kosong dari server pernah menimpa pesan pertama, jadi sesi baru tidak boleh memuatnya.
    let historyLoads = 0
    mock.onHistory = (route) => {
      historyLoads++
      return ok(route, [], { page: 1, limit: 100, total: 0 })
    }
    await open(page)
    await expect(page.getByRole("heading", { name: "Ceritakan jasa yang kamu butuhkan" })).toBeVisible()
    expect(mock.created).toBe(0)

    await say(page, "halo")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await say(page, "halo lagi")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toHaveCount(2)
    expect(mock.created).toBe(1)
    expect(historyLoads).toBe(0)
    expect(mock.sent.map((s) => [s.content, s.token])).toEqual([
      ["halo", GUEST_TOKEN],
      ["halo lagi", GUEST_TOKEN],
    ])
    expect(mock.sent[0]).not.toHaveProperty("latitude")

    const storage = await page.evaluate(() => ({
      session: Object.values(sessionStorage).join(),
      local: Object.values(localStorage).join(),
      cookie: document.cookie,
    }))
    expect(storage.session).toContain(GUEST_TOKEN)
    expect(storage.local).not.toContain(GUEST_TOKEN)
    expect(storage.cookie).not.toContain(GUEST_TOKEN)
  })

  test("contoh mengisi kotak tulis tanpa mengirim, dan pesan ganda tertahan selagi menunggu", async ({ page }) => {
    const mock = await mockChat(page)
    mock.onSend = () => undefined
    await open(page)
    await page.getByRole("button", { name: "AC bocor, servis besok pagi" }).click()
    await expect(input(page)).toHaveValue("AC bocor, servis besok pagi")
    await expect(input(page)).toBeFocused()
    expect(mock.sent).toHaveLength(0)

    await input(page).press("Shift+Enter")
    expect(mock.sent).toHaveLength(0)
    await input(page).press("Enter")
    await expect(page.getByText("Asisten sedang menulis…")).toBeAttached()
    await say(page, "lagi")
    await expect(input(page)).toHaveValue("lagi")
    expect(mock.sent).toHaveLength(1)
    await expect(page.getByText("Masih memproses…")).toBeVisible({ timeout: 8000 })
  })

  test("rekomendasi: tiga kartu dulu, badan dan aksi bersaudara, tanpa elemen interaktif bersarang", async ({ page }) => {
    const mock = await mockChat(page)
    const cards = [1, 2, 3, 4, 5].map((n) => card(n))
    mock.onSend = (route, { content }) =>
      ok(route, reply(content, "Ini 5 pilihan Servis AC.", { intent: "cari_jasa", cards, remaining: 19 }), undefined, 201)
    await open(page)
    await say(page, "servis AC")
    await expect(page.getByRole("article")).toHaveCount(3)
    await expect(page.getByRole("link", { name: "Lihat Servis AC panggilan 1", exact: true })).toHaveAttribute(
      "href",
      `/listing/${cards[0]!.id}`,
    )
    await expect(page.getByRole("link", { name: "Pesan Servis AC panggilan 1", exact: true })).toHaveAttribute(
      "href",
      `/pesan/${cards[0]!.id}`,
    )
    expect(await page.locator("a a, a button, button a, button button").count()).toBe(0)

    await page.getByRole("button", { name: "Tampilkan 2 jasa lainnya" }).click()
    await expect(page.getByRole("article")).toHaveCount(5)
    await expect(page.getByRole("link", { name: "Lihat Servis AC panggilan 4" })).toBeFocused()
    // Satu perhentian Tab per tujuan: dari Lihat langsung ke Pesan, lalu kartu berikutnya.
    await page.keyboard.press("Tab")
    await expect(page.getByRole("link", { name: "Pesan Servis AC panggilan 4" })).toBeFocused()
    await page.keyboard.press("Tab")
    await expect(page.getByRole("link", { name: "Lihat Servis AC panggilan 5" })).toBeFocused()
  })

  test("keluaran model tampil sebagai teks", async ({ page }) => {
    const mock = await mockChat(page)
    const payload = `<img src=x onerror="window.__xss=1"> **tebal** [x](javascript:alert(1))`
    mock.onSend = (route, { content }) =>
      ok(route, reply(content, payload, { intent: "perlu_klarifikasi", remaining: 19 }), undefined, 201)
    await open(page)
    await say(page, "<script>window.__xss=1</script>")
    await expect(log(page).getByText(payload)).toBeVisible()
    expect(await log(page).locator("img, script, a").count()).toBe(0)
    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  })

  test("lokasi: dikirim ulang dengan koordinat, bisa dihapus, dan tidak disimpan", async ({ page, context }) => {
    await context.grantPermissions(["geolocation"])
    await context.setGeolocation(DENPASAR)
    const mock = await mockChat(page)
    mock.onSend = (route, { content, latitude }) =>
      latitude === undefined
        ? ok(route, reply(content, "Izinkan akses lokasi.", { intent: "cari_jasa", remaining: 4 }), undefined, 201)
        : ok(route, reply(content, "Ini 1 pilihan.", { intent: "cari_jasa", cards: [card(1)], remaining: 3 }), undefined, 201)
    await open(page)
    await say(page, "servis AC")
    await expect(page.getByText("Sisa 4 pesan")).toBeVisible()
    await page.getByRole("button", { name: "Pakai lokasiku dan kirim lagi" }).click()
    await expect(log(page).getByText("Ini 1 pilihan.")).toBeVisible()
    await expect(page.getByText("Memakai lokasimu")).toBeVisible()
    expect(mock.sent.map((s) => [s.content, s.latitude, s.longitude])).toEqual([
      ["servis AC", undefined, undefined],
      ["servis AC", DENPASAR.latitude, DENPASAR.longitude],
    ])
    await page.getByRole("button", { name: "Hapus lokasi" }).click()
    await say(page, "lagi")
    await expect.poll(() => mock.sent.length).toBe(3)
    expect(mock.sent[2]).not.toHaveProperty("latitude")
    expect(await page.evaluate(() => Object.values(sessionStorage).join())).not.toContain("-8.67")
  })

  test("lokasi ditolak: percakapan tetap jalan", async ({ page, context }) => {
    await context.clearPermissions()
    const mock = await mockChat(page)
    await page.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_ok, error) => error?.({ code: 1 } as GeolocationPositionError)
    })
    await open(page)
    await page.getByRole("button", { name: "Pakai lokasiku" }).click()
    await expect(page.getByText("Lokasimu belum terbaca.")).toBeVisible()
    await say(page, "halo")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    expect(mock.sent[0]).not.toHaveProperty("latitude")
  })

  test("Gemini gagal: arahkan ke pencarian, dan Kirim lagi mengganti pasangan gagal", async ({ page }) => {
    const mock = await mockChat(page)
    const normal = mock.onSend
    mock.onSend = (route, sent, i) => (i === 0 ? fail(route, 502, "GEMINI_UNAVAILABLE") : normal(route, sent, i))
    await open(page)
    await say(page, "halo")
    await expect(page.getByText("Asisten sedang tidak tersedia")).toBeVisible()
    await expect(log(page).getByRole("link", { name: "Cari jasa" })).toHaveAttribute("href", "/cari")
    await log(page).getByRole("button", { name: "Kirim lagi" }).click()
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await expect(page.getByText("Asisten sedang tidak tersedia")).toHaveCount(0)
    await expect(log(page).getByRole("listitem")).toHaveCount(2)
    expect(mock.created).toBe(1)
  })

  test("rem harian tamu: ke pencarian atau masuk, tanpa Kirim lagi", async ({ page }) => {
    const mock = await mockChat(page)
    mock.onSend = (route) => fail(route, 503, "CHATBOT_TEMPORARILY_UNAVAILABLE")
    await open(page)
    await say(page, "halo")
    await expect(page.getByText("Asisten sedang tidak tersedia")).toBeVisible()
    await expect(log(page).getByRole("link", { name: "Masuk" })).toHaveAttribute("href", "/masuk?next=%2Fasisten")
    await expect(log(page).getByRole("button", { name: "Kirim lagi" })).toHaveCount(0)
  })

  for (const [name, setup] of [
    ["ditolak server", (mock) => (mock.onSend = (route) => fail(route, 429, "GUEST_CHAT_LIMIT_REACHED"))],
    [
      "kuota tinggal nol",
      (mock) => (mock.onSend = (route, { content }) => ok(route, reply(content, "Halo!", { remaining: 0 }), undefined, 201)),
    ],
  ] as [string, (mock: Awaited<ReturnType<typeof mockChat>>) => unknown][]) {
    test(`batas tamu (${name}): kotak tulis diganti ajakan mendaftar yang menerima fokus`, async ({ page }) => {
      setup(await mockChat(page))
      await open(page)
      await say(page, "halo")
      await expect(page.getByText("Batas percakapan tamu sudah tercapai")).toBeVisible()
      await expect(input(page)).toHaveCount(0)
      await expect(page.getByRole("link", { name: "Daftar" })).toHaveAttribute("href", "/daftar?next=%2Fasisten")
      await expect(page.getByRole("status").filter({ hasText: "Batas percakapan" })).toBeFocused()
    })
  }

  test("429 menyebut kapan bisa mencoba lagi", async ({ page }) => {
    const mock = await mockChat(page)
    mock.onSend = (route) => fail(route, 429, "RATE_LIMIT_EXCEEDED", { "Retry-After": "600" })
    await open(page)
    await say(page, "halo")
    await expect(page.getByText("Terlalu banyak permintaan. Coba lagi dalam 10 menit.")).toBeVisible()
    await expect(page.getByRole("button", { name: "Kirim lagi" })).toBeVisible()
  })

  test("jaringan putus: Kirim lagi tidak menggandakan gelembung", async ({ page }) => {
    const mock = await mockChat(page)
    const normal = mock.onSend
    mock.onSend = (route, sent, i) => (i === 0 ? route.abort() : normal(route, sent, i))
    await open(page)
    await say(page, "halo")
    await page.getByRole("button", { name: "Kirim lagi" }).click()
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await expect(log(page).getByRole("listitem")).toHaveCount(2)
  })

  test("sesi berakhir: mulai baru membawa teks yang belum terkirim", async ({ page }) => {
    const mock = await mockChat(page)
    mock.onSend = (route) => fail(route, 409, "CHAT_SESSION_ENDED")
    await open(page)
    await say(page, "servis AC besok")
    await page.getByRole("button", { name: "Mulai percakapan baru" }).click()
    await expect(input(page)).toHaveValue("servis AC besok")
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0)
  })

  test("muat ulang memulihkan percakapan; kartu terakhir otomatis, yang lama lewat tombol", async ({ page }) => {
    const mock = await mockChat(page)
    const ids = [card(1).id, card(2).id]
    mock.onHistory = (route, id) => {
      expect(id).toBe(GUEST_SESSION_ID)
      return ok(
        route,
        [
          message("USER", "cuci mobil"),
          message("ASSISTANT", "Ini 2 pilihan Cuci Mobil.", { intent: "cari_jasa", recommended_listing_ids: ids }),
          message("USER", "servis AC"),
          message("ASSISTANT", "Ini 2 pilihan Servis AC.", { intent: "cari_jasa", recommended_listing_ids: ids }),
        ],
        { page: 1, limit: 100, total: 4 },
      )
    }
    await page.route("**/api/v1/listings/*", (route) =>
      route.request().url().endsWith(ids[0]!)
        ? ok(route, { ...card(1), photos: [], faqs: [], option_prices: [], reviews: [], attributes: {} })
        : fail(route, 404, "NOT_FOUND"),
    )
    await page.addInitScript(
      ([sessionId, token]) => sessionStorage.setItem("jasana_asisten_tamu", JSON.stringify({ sessionId, token })),
      [GUEST_SESSION_ID, GUEST_TOKEN],
    )
    await open(page)
    await expect(log(page).getByText("Ini 2 pilihan Servis AC.")).toBeVisible()
    await expect(page.getByRole("article")).toHaveCount(1)
    await expect(page.getByText("1 jasa sudah tidak tersedia.")).toBeVisible()
    // Riwayat tidak dibacakan ulang.
    await expect(page.locator("p[role=status]")).toHaveText("")
    await page.getByRole("button", { name: "Tampilkan 2 jasa" }).click()
    await expect(page.getByRole("article")).toHaveCount(2)
    expect(mock.created).toBe(0)
  })

  test("dimuat ulang selagi menunggu: jawaban yang menyusul bisa dimuat", async ({ page }) => {
    const mock = await mockChat(page)
    const question = message("USER", "halo")
    let loads = 0
    mock.onHistory = (route) => {
      const list = loads++ === 0 ? [question] : [question, message("ASSISTANT", "Jawaban menyusul.", { intent: "sapaan" })]
      return ok(route, list, { page: 1, limit: 100, total: list.length })
    }
    await page.addInitScript(
      ([sessionId, token]) => sessionStorage.setItem("jasana_asisten_tamu", JSON.stringify({ sessionId, token })),
      [GUEST_SESSION_ID, GUEST_TOKEN],
    )
    await open(page)
    await expect(page.getByText("Belum ada jawaban.")).toBeVisible()
    await page.getByRole("button", { name: "Muat jawaban" }).click()
    await expect(log(page).getByText("Jawaban menyusul.")).toBeVisible()
    await expect(page.getByText("Belum ada jawaban.")).toHaveCount(0)
    expect(mock.sent).toHaveLength(0)
  })

  test("percakapan lama yang sudah kedaluwarsa bisa dimulai lagi", async ({ page }) => {
    const mock = await mockChat(page)
    mock.onHistory = (route) => fail(route, 409, "CHAT_SESSION_ENDED")
    await page.addInitScript(
      ([sessionId, token]) => {
        if (!sessionStorage.getItem("sudah")) sessionStorage.setItem("jasana_asisten_tamu", JSON.stringify({ sessionId, token }))
        sessionStorage.setItem("sudah", "1")
      },
      [GUEST_SESSION_ID, GUEST_TOKEN],
    )
    await open(page)
    await page.getByRole("button", { name: "Mulai percakapan baru" }).click()
    await say(page, "halo")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
  })
})

test.describe("gulir", () => {
  test.use({ viewport: { width: 390, height: 844 } })
  const scrollState = (page: Page) =>
    log(page).evaluate((el) => ({ top: el.scrollTop, rest: el.scrollHeight - el.clientHeight - el.scrollTop }))

  test("kirim ke bawah, jawaban tinggi terbaca dari awal, dan pembaca di atas tidak ditarik", async ({ page }) => {
    const mock = await mockChat(page)
    let release: (() => void) | undefined
    mock.onSend = async (route, { content }, i) => {
      if (i < 8) return ok(route, reply(content, `Jawaban ${i}.\nBaris kedua.`, { remaining: 15 }), undefined, 201)
      if (i === 9) await new Promise<void>((resolve) => (release = resolve))
      return ok(
        route,
        reply(content, `Ini pilihan ${i}.`, { intent: "cari_jasa", cards: [1, 2, 3].map((n) => card(n)), remaining: 10 }),
        undefined,
        201,
      )
    }
    await open(page)
    for (let i = 0; i < 8; i++) {
      await say(page, `pesan ${i}`)
      await expect(log(page).getByText(`Jawaban ${i}.`)).toBeVisible()
    }
    await expect.poll(async () => (await scrollState(page)).rest).toBeLessThan(2)

    await say(page, "servis AC")
    const answer = log(page).getByText("Ini pilihan 8.")
    await expect(answer).toBeVisible()
    await expect
      .poll(async () => Math.round((await answer.boundingBox())!.y - (await log(page).boundingBox())!.y))
      .toBe(16)

    await say(page, "lagi")
    await expect.poll(async () => (await scrollState(page)).rest).toBeLessThan(2)
    await log(page).evaluate((el) => el.scrollTo({ top: 0 }))
    await expect.poll(async () => (await scrollState(page)).top).toBe(0)
    release!()
    const button = page.getByRole("button", { name: "Jawaban baru" })
    await expect(button).toBeVisible()
    expect((await scrollState(page)).top).toBe(0)
    await button.click()
    await expect(log(page).getByText("Ini pilihan 9.")).toBeInViewport()
    await expect(button).toHaveCount(0)
  })

  test("meninggalkan halaman lalu kembali: percakapan, draf, dan posisi gulir tetap", async ({ page }) => {
    const mock = await mockChat(page)
    mock.onSend = (route, { content }) =>
      ok(route, reply(content, "Ini 3 pilihan.", { intent: "cari_jasa", cards: [1, 2, 3].map((n) => card(n)), remaining: 10 }), undefined, 201)
    await open(page)
    await say(page, "satu")
    await expect(page.getByRole("article")).toHaveCount(3)
    await say(page, "dua")
    await expect(page.getByRole("article")).toHaveCount(6)
    await input(page).fill("draf")
    await page.waitForTimeout(800)
    await log(page).evaluate((el) => el.scrollTo({ top: 120 }))
    await page.getByRole("banner").getByRole("link").first().click()
    await page.waitForURL((url) => url.pathname === "/")
    await page.goBack()
    await expect(log(page)).toBeVisible()
    await expect(page.getByRole("article")).toHaveCount(6)
    await expect(input(page)).toHaveValue("draf")
    expect((await scrollState(page)).top).toBe(120)
    expect(mock.created).toBe(1)
  })
})

test.describe("akun", () => {
  test("sesi baru masuk URL, riwayat berhalaman, dan percakapan baru", async ({ page }) => {
    const mock = await mockChat(page)
    await mockLogin(page)
    const row = (n: number) => session(`33333333-3333-4333-8333-0000000000${10 + n}`, { message_count: n })
    mock.onSessions = (route, p) =>
      ok(route, p === 1 ? Array.from({ length: 20 }, (_, i) => row(i)) : [row(20), row(21)], { page: p, limit: 20, total: 22 })
    mock.onHistory = (route) =>
      ok(route, [message("USER", "lama"), message("ASSISTANT", "Percakapan lama.", { intent: "sapaan" })], { page: 1, limit: 100, total: 2 })
    await open(page)
    // Lokasi akun dari alamat utama, jadi tidak ditawarkan di kotak tulis (D77).
    await expect(page.getByRole("button", { name: "Pakai lokasiku" })).toHaveCount(0)
    await say(page, "halo")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await expect(page).toHaveURL(`/asisten?percakapan=${ACCOUNT_SESSION_ID}`)
    // Sesi yang baru dibuat tidak memasang ulang percakapannya: fokus dan ketikan berikutnya tetap.
    await expect(input(page)).toBeFocused()
    expect(mock.sent[0]!.token).toBeNull()
    expect(await page.evaluate(() => sessionStorage.length)).toBe(0)

    await page.getByRole("button", { name: "Riwayat" }).click()
    const sheet = page.getByRole("dialog", { name: "Riwayat percakapan" })
    // Sesi tanpa pesan (row 0) tidak ditampilkan.
    await expect(sheet.getByRole("listitem")).toHaveCount(19)
    await sheet.getByRole("button", { name: "Muat lebih banyak" }).click()
    await expect(sheet.getByRole("listitem")).toHaveCount(21)
    await expect(sheet.getByRole("button", { name: "Muat lebih banyak" })).toHaveCount(0)
    await sheet.getByRole("button", { name: "21 pesan" }).click()
    await expect(log(page).getByText("Percakapan lama.")).toBeVisible()
    await expect(page).toHaveURL(`/asisten?percakapan=${row(21).id}`)

    await page.goBack()
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await page.getByRole("button", { name: "Percakapan baru" }).click()
    await expect(page.getByRole("heading", { name: "Ceritakan jasa yang kamu butuhkan" })).toBeVisible()
    await expect(page).toHaveURL("/asisten")
  })

  test("butuh lokasi: tawarkan lokasi perangkat dan atur alamat", async ({ page }) => {
    const mock = await mockChat(page)
    await mockLogin(page)
    mock.onSend = (route, { content }) => ok(route, reply(content, "Atur alamat.", { intent: "cari_jasa" }), undefined, 201)
    await open(page)
    await say(page, "servis AC")
    await expect(page.getByRole("button", { name: "Pakai lokasiku dan kirim lagi" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Atur alamat" })).toHaveAttribute("href", "/akun/alamat")
  })

  for (const [status, code] of [
    [404, "NOT_FOUND"],
    [422, "VALIDATION_ERROR"],
  ] as const) {
    test(`percakapan tidak dikenal (${code})`, async ({ page }) => {
      const mock = await mockChat(page)
      await mockLogin(page)
      mock.onHistory = (route) => fail(route, status, code)
      await open(page, "/asisten?percakapan=apa-saja")
      await expect(page.getByText("Percakapan tidak ditemukan")).toBeVisible()
      await page.getByRole("button", { name: "Mulai percakapan baru" }).click()
      await expect(page.getByRole("heading", { name: "Ceritakan jasa yang kamu butuhkan" })).toBeVisible()
    })
  }

  test("keluar membuang percakapan dan draf dari layar", async ({ page }) => {
    await mockChat(page)
    await mockLogin(page)
    await page.route("**/api/session/logout", (route) =>
      route.fulfill({
        headers: { "set-cookie": "jasana_sesi=; Path=/; Max-Age=0" },
        json: { success: true, data: { revoked: true } },
      }),
    )
    await open(page)
    await say(page, "rahasia akun")
    await expect(log(page).getByText("Halo! Aku asisten Jasana.")).toBeVisible()
    await input(page).fill("draf rahasia")
    await page.getByRole("button", { name: "Menu akun" }).click()
    await page.getByRole("menuitem", { name: "Keluar" }).click()
    await page.waitForURL((url) => url.pathname === "/")
    await expect.poll(() => page.evaluate(() => document.documentElement.textContent?.includes("rahasia akun"))).toBe(false)
    expect(await page.locator("textarea").evaluateAll((els) => els.map((e) => (e as HTMLTextAreaElement).value).join())).toBe("")
  })
})
