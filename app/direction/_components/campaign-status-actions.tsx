"use client"

import { useTransition } from "react"
import { toast } from "sonner"
import { Play, XCircle, Archive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { updateCampaignStatus } from "@/app/actions/campaigns"

type CampaignStatus = "draft" | "scheduled" | "active" | "closed" | "archived"

interface Props {
  campaignId: string
  currentStatus: string
}

const TRANSITIONS: Record<string, { label: string; toStatus: CampaignStatus; icon: React.ElementType; variant: "default" | "outline" | "destructive" }[]> = {
  draft: [
    { label: "Activer", toStatus: "active", icon: Play, variant: "default" },
    { label: "Archiver", toStatus: "archived", icon: Archive, variant: "outline" },
  ],
  scheduled: [
    { label: "Activer", toStatus: "active", icon: Play, variant: "default" },
    { label: "Archiver", toStatus: "archived", icon: Archive, variant: "outline" },
  ],
  active: [
    { label: "Clôturer", toStatus: "closed", icon: XCircle, variant: "outline" },
  ],
  closed: [
    { label: "Archiver", toStatus: "archived", icon: Archive, variant: "outline" },
  ],
}

const STATUS_SUCCESS_LABELS: Record<CampaignStatus, string> = {
  draft: "Repassée en brouillon.",
  scheduled: "Campagne planifiée.",
  active: "Campagne activée.",
  closed: "Campagne clôturée.",
  archived: "Campagne archivée.",
}

export function CampaignStatusActions({ campaignId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition()

  const actions = TRANSITIONS[currentStatus] ?? []

  if (actions.length === 0) return null

  function handleAction(toStatus: CampaignStatus) {
    startTransition(async () => {
      const result = await updateCampaignStatus(campaignId, toStatus)
      if ("error" in result) {
        toast.error(result.error)
      } else {
        toast.success(STATUS_SUCCESS_LABELS[toStatus])
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      {actions.map(({ label, toStatus, icon: Icon, variant }) => (
        <Button
          key={toStatus}
          variant={variant}
          size="sm"
          disabled={isPending}
          onClick={() => handleAction(toStatus)}
        >
          <Icon className="size-3.5" />
          {label}
        </Button>
      ))}
    </div>
  )
}
