import { describe, expect, it } from "vitest"
import { describeUserAgent } from "./user-agent"

const WEBKIT = "AppleWebKit/537.36 (KHTML, like Gecko)"

describe("describeUserAgent", () => {
  it.each([
    [`Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${WEBKIT} Chrome/140.0.0.0 Safari/537.36`, "Chrome di Windows", false],
    [
      `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ${WEBKIT} Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0`,
      "Edge di Windows",
      false,
    ],
    [
      `Mozilla/5.0 (Linux; Android 14; SM-S921B) ${WEBKIT} SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36`,
      "Samsung Internet di Android",
      true,
    ],
    [
      `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ${WEBKIT} Version/18.0 Mobile/15E148 Safari/604.1`,
      "Safari di iPhone",
      true,
    ],
    [
      `Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) ${WEBKIT} CriOS/140.0.0.0 Mobile/15E148 Safari/604.1`,
      "Chrome di iPhone",
      true,
    ],
    ["Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0", "Firefox di Mac", false],
    ["PostmanRuntime/7.43.0", "Perangkat tidak dikenal", false],
    [null, "Perangkat tidak dikenal", false],
  ])("%s", (ua, label, mobile) => {
    expect(describeUserAgent(ua)).toEqual({ label, mobile })
  })
})
