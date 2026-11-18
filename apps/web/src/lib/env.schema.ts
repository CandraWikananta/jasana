import { z } from "zod"

// PRD Frontend 9.4. Seluruh variabel wajib tanpa nilai bawaan, sama seperti backend:
// lupa mengisi di staging harus membuat aplikasi gagal start, bukan diam-diam memakai default.
// Skema dipisah dari env.ts dan env.server.ts supaya next.config.ts bisa memvalidasi saat boot
// tanpa mengimpor "server-only".

const requiredString = (name: string) =>
  z.string({ required_error: `${name} wajib diisi` }).trim().min(1, `${name} wajib diisi`)

const url = (name: string) =>
  requiredString(name)
    // .url() saja menerima "localhost:3000" sebagai URL berskema "localhost:".
    .regex(/^https?:\/\/[^/\s]+/, `${name} harus URL lengkap, misalnya http://localhost:3000`)
    .url(`${name} harus URL lengkap, misalnya http://localhost:3000`)
    .transform((value) => value.replace(/\/$/, ""))

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: url("NEXT_PUBLIC_API_BASE_URL"),
  NEXT_PUBLIC_SOCKET_URL: url("NEXT_PUBLIC_SOCKET_URL"),
})

export const serverEnvSchema = z.object({
  API_INTERNAL_BASE_URL: url("API_INTERNAL_BASE_URL"),
  // Karakter token cookie RFC 6265 saja, supaya nama penanda turunannya juga sah.
  SESSION_COOKIE_NAME: requiredString("SESSION_COOKIE_NAME").regex(
    /^[A-Za-z0-9_-]+$/,
    "SESSION_COOKIE_NAME hanya boleh huruf, angka, garis bawah, dan tanda hubung",
  ),
  // Tanpa coerce: "", "1", atau "yes" ditolak, bukan dibaca false (catatan D117 di backend).
  SESSION_COOKIE_SECURE: z
    .enum(["true", "false"], {
      errorMap: () => ({ message: "SESSION_COOKIE_SECURE wajib diisi true atau false" }),
    })
    .transform((value) => value === "true"),
})

export type PublicEnv = z.infer<typeof publicEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

export function parseEnv<T extends z.ZodTypeAny>(schema: T, source: Record<string, string | undefined>): z.infer<T> {
  const result = schema.safeParse(source)
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `- ${issue.message}`).join("\n")
    throw new Error(`Variabel lingkungan apps/web tidak sah:\n${lines}\nLihat apps/web/.env.example`)
  }
  return result.data
}
