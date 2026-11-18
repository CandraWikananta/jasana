import "server-only"
import { parseEnv, serverEnvSchema } from "./env.schema"

// Hanya untuk Route Handler sesi dan proxy.ts. "server-only" membuat build gagal kalau
// modul ini terseret ke Client Component.
export const serverEnv = parseEnv(serverEnvSchema, process.env)
