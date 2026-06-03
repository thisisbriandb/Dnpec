"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  CheckCircle2, XCircle, Bell, PauseCircle, RefreshCw, Info,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatRelative } from "@/lib/format"
import { markNotificationRead, markAllNotificationsRead } from "@/app/actions/notifications"

interface Notification {
  id:         string
  type:       string
  title:      string
  body:       string
  created_at: string
  read_at:    string | null
}

const TYPE_ICON: Record<string, React.ElementType> = {
  inscription_validee: CheckCircle2,
  inscription_rejetee: XCircle,
  inscription_soumise: Bell,
  compte_suspendu:     PauseCircle,
  compte_reactif:      RefreshCw,
}

interface NotificationsClientProps {
  notifications: Notification[]
}

export function NotificationsClient({ notifications }: NotificationsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id)
      router.refresh()
    })
  }

  function handleReadAll() {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  const unread = notifications.filter((n) => !n.read_at).length

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      {unread > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[13px] text-muted-foreground">
            <span className="font-semibold text-foreground">{unread}</span>{" "}
            notification{unread > 1 ? "s" : ""} non lue{unread > 1 ? "s" : ""}
          </p>
          <button
            type="button"
            onClick={handleReadAll}
            disabled={isPending}
            className="text-[12px] font-medium text-primary hover:underline disabled:opacity-50"
          >
            Tout marquer comme lu
          </button>
        </div>
      )}

      {/* List */}
      <div className="bg-white rounded-2xl border border-border shadow-subtle overflow-hidden divide-y divide-border/50">
        {notifications.map((n) => {
          const Icon = TYPE_ICON[n.type] ?? Info
          const isUnread = !n.read_at

          return (
            <div
              key={n.id}
              className={cn(
                "flex items-start gap-4 px-5 py-4 transition-colors",
                isUnread ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "hover:bg-muted/30",
                isUnread && "cursor-pointer",
              )}
              onClick={() => isUnread && handleRead(n.id)}
              role={isUnread ? "button" : undefined}
            >
              {/* Icon */}
              <div
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl mt-0.5",
                  n.type === "inscription_validee" && "bg-status-ok-bg",
                  n.type === "inscription_rejetee" && "bg-status-bad-bg",
                  n.type === "compte_suspendu"     && "bg-muted",
                  n.type === "compte_reactif"      && "bg-status-ok-bg",
                  !TYPE_ICON[n.type]               && "bg-muted",
                  n.type === "inscription_soumise" && "bg-status-info-bg",
                )}
              >
                <Icon
                  className={cn(
                    "size-4",
                    n.type === "inscription_validee" && "text-status-ok-text",
                    n.type === "inscription_rejetee" && "text-status-bad-text",
                    n.type === "compte_suspendu"     && "text-muted-foreground",
                    n.type === "compte_reactif"      && "text-status-ok-text",
                    n.type === "inscription_soumise" && "text-status-info-text",
                    !TYPE_ICON[n.type]               && "text-muted-foreground",
                  )}
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={cn("text-[13px] leading-snug", isUnread ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                    {n.title}
                  </p>
                  {isUnread && (
                    <span className="mt-1 size-2 rounded-full bg-primary shrink-0" />
                  )}
                </div>
                <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1.5">{formatRelative(n.created_at)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
