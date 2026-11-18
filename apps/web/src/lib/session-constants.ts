// Dipakai bersama client, Route Handler, dan proxy.ts, jadi bukan dari env server.

/**
 * Cookie penanda sesi (usulan D baru, W0 bagian 3). Isinya hanya "1", bukan token, dan sengaja
 * bisa dibaca JavaScript: proxy.ts memakainya untuk pengalihan kasar dan client memakainya
 * supaya tamu tidak memanggil refresh. Refresh token sendiri ada di cookie httpOnly
 * SESSION_COOKIE_NAME dengan Path=/api/session, yang tidak terkirim ke halaman.
 */
export const SESSION_FLAG_COOKIE = "jasana_sesi"

/** Nama kunci navigator.locks untuk refresh antar tab (CLAUDE.md web jebakan 2). */
export const REFRESH_LOCK_NAME = "jasana-refresh"

export const SESSION_ROUTES = {
  login: "/api/session/login",
  refresh: "/api/session/refresh",
  logout: "/api/session/logout",
} as const
