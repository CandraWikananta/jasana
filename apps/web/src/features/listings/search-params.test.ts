import { describe, expect, it } from "vitest"
import { parseSearchParams, SEARCH_PAGE_SIZE } from "./search-params"

const parse = (qs: string) => parseSearchParams(new URLSearchParams(qs))

describe("parseSearchParams", () => {
  it("URL kosong hanya membawa limit", () => {
    expect(parse("")).toEqual({ limit: SEARCH_PAGE_SIZE })
  })

  it("filter sah diteruskan", () => {
    expect(
      parse("q=%20servis%20ac%20&category_id=ae5c1960-b4f0-4b6c-807a-6a4e1ba8f9e0&booking_mode=AVAILABLE_NOW&available_now=true&lat=-8.65&lng=115.21&sort=distance&page=3"),
    ).toEqual({
      q: "servis ac",
      category_id: "ae5c1960-b4f0-4b6c-807a-6a4e1ba8f9e0",
      booking_mode: "AVAILABLE_NOW",
      available_now: true,
      lat: -8.65,
      lng: 115.21,
      sort: "distance",
      page: 3,
      limit: SEARCH_PAGE_SIZE,
    })
  })

  it("nilai tidak sah dibuang", () => {
    expect(parse("booking_mode=BROADCAST&sort=murah&available_now=1&page=0&q=%20%20")).toEqual({ limit: SEARCH_PAGE_SIZE })
    expect(parse("page=2.5").page).toBeUndefined()
    expect(parse("category_id=abc").category_id).toBeUndefined()
  })

  it("lat tanpa lng, atau koordinat di luar batas, dianggap tanpa lokasi", () => {
    expect(parse("lat=-8.65").lat).toBeUndefined()
    expect(parse("lat=95&lng=115").lat).toBeUndefined()
    expect(parse("lat=abc&lng=115").lng).toBeUndefined()
    expect(parse("lat=&lng=").lat).toBeUndefined()
  })

  it("sort=distance dibuang kalau tanpa lokasi", () => {
    expect(parse("sort=distance").sort).toBeUndefined()
    expect(parse("sort=price_asc").sort).toBe("price_asc")
  })
})
