import type { Me } from "@/types/api/auth"

// Area ditentukan kapabilitas, bukan role (D220, D4, D35). users.role hanya CLIENT atau ADMIN.
// getViewer(order, me) untuk aksi order (Matriks-UI-Order Bagian 7) dibangun di atas ini nanti.

export type Area = "pelanggan" | "usaha" | "pekerja" | "admin"

export interface Capabilities {
  isAdmin: boolean
  isEmailVerified: boolean
  /** Punya provider_profiles apa pun statusnya, termasuk DRAFT dan PENDING (PRD Frontend 4.1). */
  hasProviderProfile: boolean
  /** Provider dalam arti CLAUDE.md: profil VERIFIED. */
  isVerifiedProvider: boolean
  providerType: "INDIVIDUAL" | "BUSINESS" | null
  /** Keanggotaan pekerja ACTIVE. */
  isWorker: boolean
  /** Pemilik yang juga pekerja di usahanya sendiri (D33). */
  isOwnerWorker: boolean
  areas: Area[]
}

export function getCapabilities(me: Me | null | undefined): Capabilities {
  if (!me) {
    return {
      isAdmin: false,
      isEmailVerified: false,
      hasProviderProfile: false,
      isVerifiedProvider: false,
      providerType: null,
      isWorker: false,
      isOwnerWorker: false,
      areas: [],
    }
  }

  const isAdmin = me.role === "ADMIN"
  const hasProviderProfile = me.provider !== null
  const isWorker = me.worker !== null

  // Setiap pengguna yang masuk adalah pelanggan, termasuk provider dan pekerja (dual-role).
  const areas: Area[] = ["pelanggan"]
  if (hasProviderProfile) areas.push("usaha")
  if (isWorker) areas.push("pekerja")
  if (isAdmin) areas.push("admin")

  return {
    isAdmin,
    isEmailVerified: me.email_verified,
    hasProviderProfile,
    isVerifiedProvider: me.provider?.verification_status === "VERIFIED",
    providerType: me.provider?.provider_type ?? null,
    isWorker,
    isOwnerWorker: me.worker?.is_owner === true,
    areas,
  }
}
