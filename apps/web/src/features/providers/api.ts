import { cache } from "react"
import { apiFetch } from "@/lib/api-client"
import type { PublicProvider } from "@/types/api/provider"

// React.cache: generateMetadata dan halaman profil memakai satu fetch per request.
export const getProvider = cache((id: string) => apiFetch<PublicProvider>(`/providers/${encodeURIComponent(id)}`))
