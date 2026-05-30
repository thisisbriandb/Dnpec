import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
  size?: "sm" | "md" | "lg"
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "sm" && "gap-2 py-8",
        size === "md" && "gap-3 py-12",
        size === "lg" && "gap-4 py-16",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex items-center justify-center rounded-xl bg-muted text-muted-foreground",
            size === "sm" && "size-10",
            size === "md" && "size-12",
            size === "lg" && "size-16"
          )}
        >
          <Icon
            className={cn(
              size === "sm" && "size-5",
              size === "md" && "size-6",
              size === "lg" && "size-8"
            )}
            strokeWidth={1.5}
          />
        </div>
      )}
      <div className={cn("space-y-1", size === "lg" && "space-y-2")}>
        <p
          className={cn(
            "font-medium text-foreground",
            size === "sm" && "text-sm",
            size === "md" && "text-sm",
            size === "lg" && "text-base"
          )}
        >
          {title}
        </p>
        {description && (
          <p
            className={cn(
              "text-muted-foreground max-w-sm",
              size === "sm" && "text-xs",
              size === "md" && "text-sm",
              size === "lg" && "text-sm"
            )}
          >
            {description}
          </p>
        )}
      </div>
      {action && (
        <Button
          variant="outline"
          size={size === "sm" ? "sm" : "default"}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  )
}

export { EmptyState, type EmptyStateProps }
