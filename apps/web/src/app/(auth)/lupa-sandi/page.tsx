import type { Metadata } from "next"
import { ResetOnLeave } from "@/components/shared/reset-on-leave"
import { ForgotPasswordForm } from "@/features/auth/components/forgot-password-form"

export const metadata: Metadata = { title: "Lupa kata sandi", robots: { index: false } }

export default function LupaSandiPage() {
  return (
    <>
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-h1 font-bold text-balance">Lupa kata sandi</h1>
        <p className="text-sm text-muted-foreground">Masukkan email akunmu. Kami kirim link untuk membuat kata sandi baru.</p>
      </div>
      <ResetOnLeave>
        <ForgotPasswordForm />
      </ResetOnLeave>
    </>
  )
}
