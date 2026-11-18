import { parseEnv, publicEnvSchema } from "./env.schema"

// Variabel yang boleh sampai ke browser. Tiap nilai ditulis sebagai referensi literal
// process.env.NEXT_PUBLIC_* karena Next hanya meng-inline bentuk itu ke bundle client.
export const publicEnv = parseEnv(publicEnvSchema, {
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
})
