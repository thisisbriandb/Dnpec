"use client"

import * as React from "react"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { Area, AreaChart, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface SparklinePoint {
  value: number
}

interface StatCardProps {
  label: string
  value?: string | number | null
  delta?: number | null
  deltaLabel?: string
  sparkline?: SparklinePoint[]
  sparklineColor?: "ok" | "warn" | "bad" | "info"
  loading?: boolean
  className?: string
  icon?: React.ReactNode
}

const SPARKLINE_COLORS: Record<string, string> = {
  ok:   "var(--status-ok)",
  warn: "var(--status-warn)",
  bad:  "var(--status-bad)",
  info: "var(--status-info)",
}

function StatCard({
  label,
  value,
  delta,
  deltaLabel,
  sparkline,
  sparklineColor = "info",
  loading = false,
  className,
  icon,
}: StatCardProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "rounded-card border border-border bg-card p-4 space-y-3",
          className
        )}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    )
  }

  const trendColor =
    delta == null ? ""
    : delta > 0 ? "text-status-ok-text"
    : delta < 0 ? "text-status-bad-text"
    : "text-muted-foreground"

  const TrendIcon =
    delta == null ? null
    : delta > 0 ? TrendingUp
    : delta < 0 ? TrendingDown
    : Minus

  const strokeColor = SPARKLINE_COLORS[sparklineColor] ?? SPARKLINE_COLORS.info

  return (
    <div
      className={cn(
        "group relative rounded-card border border-border bg-card p-4 overflow-hidden transition-shadow hover:shadow-medium",
        className
      )}
    >
      {/* Sparkline background */}
      {sparkline && sparkline.length > 0 && (
        <div className="absolute inset-x-0 bottom-0 h-14 opacity-30">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkline} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`spark-${sparklineColor}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={`url(#spark-${sparklineColor})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Content */}
      <div className="relative space-y-1.5">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-muted-foreground">{icon}</span>
          )}
          <p className="text-legend text-muted-foreground truncate">{label}</p>
        </div>

        <p className="text-mono text-title font-semibold tabular-nums text-foreground">
          {value ?? "—"}
        </p>

        {(delta != null || deltaLabel) && (
          <div className={cn("flex items-center gap-1 text-legend", trendColor)}>
            {TrendIcon && <TrendIcon className="size-3" />}
            <span>
              {delta != null && (
                <>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)} %
                  {deltaLabel && " "}
                </>
              )}
              {deltaLabel && <span className="text-muted-foreground">{deltaLabel}</span>}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export { StatCard, type StatCardProps, type SparklinePoint }
