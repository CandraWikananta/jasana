import { NextResponse, type NextRequest } from "next/server"
import { loginHref } from "@/lib/safe-next"
import { SESSION_FLAG_COOKIE } from "@/lib/session-constants"

// BUKAN PENGAMAN (CLAUDE.md web jebakan 4, PRD Frontend 4.3). Proxy hanya mengalihkan tamu dari
// area login ke /masuk berdasarkan ADA TIDAKNYA cookie penanda, supaya tamu tidak melihat layar
// kosong dulu. Penanda bisa dipalsukan siapa pun, dan bypass seperti CVE-2025-29927 bisa
// melewati proxy. Kapabilitas dicek di layout area dari /auth/me, dan penentu akhirnya Express.
//
// Lokasi src/proxy.ts, bukan akar apps/web, karena app/ ada di src/ (dokumentasi Next 16).
export function proxy(request: NextRequest) {
  if (request.cookies.get(SESSION_FLAG_COOKIE)?.value) return NextResponse.next()
  const { pathname, search } = request.nextUrl
  return NextResponse.redirect(new URL(loginHref(pathname + search), request.url))
}

export const config = {
  // Area login PRD Frontend 4.1. "/pesan/:path*" tidak mencocokkan "/pesanan" (pola berjangkar per segmen).
  matcher: [
    "/pesan/:path*",
    "/pesanan/:path*",
    "/akun/:path*",
    "/notifikasi/:path*",
    "/usaha/:path*",
    "/pekerja/:path*",
    "/admin/:path*",
  ],
}
