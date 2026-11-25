"use client"

import { MessagesSquare } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/features/auth/queries"
import { ApiError } from "@/lib/api-client"
import { getErrorMessage } from "@/lib/error-messages"
import { formatTanggalJam } from "@/lib/time"
import { cn } from "@/lib/utils"
import { useChatSessions } from "../queries"

export function HistorySheet({
  open,
  onOpenChange,
  activeId,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  activeId: string | null
  onSelect: (sessionId: string) => void
}) {
  const { data: me } = useMe()
  const sessions = useChatSessions(me?.id, open)
  // Sesi yang dibuat tetapi pesannya tidak pernah sampai tidak punya isi untuk dibuka.
  const rows = sessions.data?.pages.flatMap((page) => page.data).filter((s) => s.message_count > 0) ?? []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" aria-describedby={undefined} className="gap-0 pb-safe">
        <SheetHeader className="pr-14">
          <SheetTitle>Riwayat percakapan</SheetTitle>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-1 pb-4">
          {sessions.isPending ? (
            <HistorySkeleton />
          ) : sessions.isError && rows.length === 0 ? (
            <ErrorState
              message={getErrorMessage(sessions.error instanceof ApiError ? sessions.error.code : null)}
              onRetry={() => void sessions.refetch()}
            />
          ) : rows.length === 0 && !sessions.hasNextPage ? (
            <EmptyState
              icon={MessagesSquare}
              title="Belum ada percakapan"
              description="Percakapanmu dengan Asisten tersimpan di sini."
              action={
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Mulai bertanya
                </Button>
              }
            />
          ) : (
            <>
              <ul className="flex flex-col gap-1">
                {rows.map((session) => {
                  const active = session.id === activeId
                  return (
                    <li key={session.id}>
                      <button
                        type="button"
                        aria-current={active ? "true" : undefined}
                        onClick={() => onSelect(session.id)}
                        className={cn(
                          "flex w-full flex-col gap-0.5 rounded-md px-3 py-2.5 text-left transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                          active ? "bg-brand-subtle text-brand-subtle-foreground" : "hover:bg-muted",
                        )}
                      >
                        <span className="text-sm font-semibold">{session.title ?? formatTanggalJam(session.started_at)}</span>
                        <span className={cn("text-sm tabular-nums", !active && "text-muted-foreground")}>
                          {session.message_count} pesan{session.status === "ENDED" && " · Sudah berakhir"}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              {sessions.hasNextPage && (
                <Button
                  variant="outline"
                  className="mt-3 w-full"
                  loading={sessions.isFetchingNextPage}
                  onClick={() => void sessions.fetchNextPage()}
                >
                  {sessions.isFetchingNextPage ? "Memuat…" : "Muat lebih banyak"}
                </Button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-1" aria-busy="true" aria-label="Memuat riwayat">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex flex-col gap-1.5 px-3 py-2.5">
          <Skeleton className="h-4.5 w-48" />
          <Skeleton className="h-4.5 w-16" />
        </div>
      ))}
    </div>
  )
}
