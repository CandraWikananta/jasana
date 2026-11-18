// Env uji. Modul env.ts dan env.server.ts memvalidasi saat dimuat, jadi nilainya diisi sebelum impor apa pun.
process.env.NEXT_PUBLIC_API_BASE_URL = "http://api.test/api/v1"
process.env.NEXT_PUBLIC_SOCKET_URL = "http://api.test"
process.env.API_INTERNAL_BASE_URL = "http://internal.test/api/v1"
process.env.SESSION_COOKIE_NAME = "jasana_refresh"
process.env.SESSION_COOKIE_SECURE = "false"
