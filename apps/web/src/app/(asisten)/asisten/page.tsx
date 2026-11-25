import type { Metadata } from "next"
import { AssistantPage } from "@/features/assistant/components/assistant-page"

export const metadata: Metadata = {
  title: "Asisten Jasana",
  description: "Ceritakan jasa yang kamu butuhkan, Asisten Jasana mencarikan pilihan di sekitarmu.",
}

// Client Component (PRD Frontend 4.2): percakapannya bergantung sesi dan storage browser.
export default function AsistenPage() {
  return <AssistantPage />
}
