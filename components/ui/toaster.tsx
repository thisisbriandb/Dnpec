"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "bg-card text-foreground border border-border rounded-lg shadow-medium text-sm font-sans",
          title: "font-medium",
          description: "text-muted-foreground text-xs",
          actionButton: "bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-md",
          cancelButton: "bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-md",
          error: "!border-status-bad/30 !bg-status-bad-bg",
          success: "!border-status-ok/30 !bg-status-ok-bg",
          warning: "!border-status-warn/30 !bg-status-warn-bg",
          info: "!border-status-info/30 !bg-status-info-bg",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
