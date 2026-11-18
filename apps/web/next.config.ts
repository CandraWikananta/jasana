import type { NextConfig } from "next";
import { parseEnv, publicEnvSchema, serverEnvSchema } from "./src/lib/env.schema";

// PRD Frontend 9.4: variabel kosong membuat next dev, build, dan start gagal di sini,
// sebelum halaman mana pun dirender.
parseEnv(publicEnvSchema, process.env);
parseEnv(serverEnvSchema, process.env);

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Hanya bucket publik Supabase (foto listing). Signed URL privat (/object/sign/) sengaja
    // tidak cocok, supaya dokumen e-KYC dan bukti tidak pernah lewat optimizer (CLAUDE.md jebakan 13).
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
