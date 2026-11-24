import type { Metadata } from "next"
import { ProfileView } from "@/features/account/components/profile-view"

export const metadata: Metadata = { title: "Akun" }

export default function AkunPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1 font-bold">Akun</h1>
      <ProfileView />
    </div>
  )
}
