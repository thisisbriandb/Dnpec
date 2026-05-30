import * as React from "react"
import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-card border border-border bg-card p-4", className)}>
      <div className="mb-3 flex items-center gap-2">
        <Skeleton className="size-8 rounded-md" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-2.5 w-1/3" />
        </div>
      </div>
      <Skeleton className="h-12" />
    </div>
  )
}

function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-card border border-border bg-card p-4 space-y-3", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  )
}

function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn("h-3", i === 0 ? "w-32" : i === columns - 1 ? "w-16" : "w-24")} />
        </td>
      ))}
    </tr>
  )
}

function SkeletonSidebarItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 rounded-md px-3 py-2", className)}>
      <Skeleton className="size-4 rounded shrink-0 bg-white/10" />
      <Skeleton className="h-3 flex-1 bg-white/10" />
    </div>
  )
}

export { Skeleton, SkeletonCard, SkeletonStatCard, SkeletonTableRow, SkeletonSidebarItem }
