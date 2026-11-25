import { cn } from "@/lib/utils"

// DS 6.4: gelembung sendiri --primary, gelembung lawan --muted. Isi dari pengguna dan dari model selalu
// teks biasa (PRD Frontend 9.2), tidak pernah HTML maupun markdown.
export function MessageBubble({ own, children }: { own: boolean; children: string }) {
  return (
    <div
      className={cn(
        "max-w-lg rounded-lg px-4 py-2.5 text-base wrap-anywhere whitespace-pre-line",
        own ? "ml-8 self-end bg-primary text-primary-foreground" : "mr-8 self-start bg-muted text-foreground",
      )}
    >
      <span className="sr-only">{own ? "Kamu: " : "Asisten: "}</span>
      {children}
    </div>
  )
}
