// Bentuk JSON modul auth (apps/api/src/modules/auth/auth.service.ts, users/user.mapper.ts). snake_case.

export interface UserDto {
  id: string
  full_name: string
  email: string
  pending_email: string | null
  phone: string
  role: "CLIENT" | "ADMIN"
  avatar_url: string | null
  email_verified: boolean
  email_verified_at: string | null
  created_at: string
}

export type ProviderVerificationStatus = "DRAFT" | "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED"

/** GET /auth/me. `provider` apa pun statusnya, `worker` hanya keanggotaan ACTIVE. */
export interface Me extends UserDto {
  provider: {
    id: string
    provider_type: "INDIVIDUAL" | "BUSINESS"
    verification_status: ProviderVerificationStatus
  } | null
  worker: { id: string; provider_profile_id: string; is_owner: boolean } | null
}

/** Balasan /api/session/refresh. Refresh token tidak pernah sampai ke JavaScript (D212). */
export interface AccessTokenResult {
  access_token: string
  expires_in: number
}

/** Balasan /api/session/login. */
export interface LoginResult extends AccessTokenResult {
  user: UserDto
}

export type LoginInput = { email: string; password: string } | { phone: string; password: string }

/** POST /auth/register. Nomor ponsel dinormalisasi server ke +628… */
export interface RegisterInput {
  full_name: string
  email: string
  phone: string
  password: string
}

/** PATCH /users/me. Email tidak lewat sini (D64). */
export interface UpdateMeInput {
  full_name: string
  phone: string
}

/** Balasan PATCH /users/me/email. Email lama tetap aktif sampai alamat baru dikonfirmasi (D64). */
export interface EmailChangeResult {
  pending_email: string
  expires_at: string
}

/** Satu baris GET /auth/sessions: satu family refresh token = satu perangkat (D76). */
export interface ActiveSession {
  session_id: string
  user_agent: string | null
  ip_address: string | null
  signed_in_at: string
  last_used_at: string
  expires_at: string
}

/** Balasan POST /auth/register: tanpa token, jadi masuk tetap lewat /api/session/login (D260). */
export interface RegisterResult {
  user: UserDto
  message: string
}
