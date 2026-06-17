import { AlertTriangle } from "lucide-react"

interface MissingFieldAlertProps {
  message: string
}

export function MissingFieldAlert({ message }: MissingFieldAlertProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-status-warn/30 bg-status-warn-bg px-3 py-2 text-sm text-status-warn-text">
      <AlertTriangle className="size-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
