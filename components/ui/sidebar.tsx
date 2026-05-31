"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  PanelLeft,
  Lock,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { AppRole } from "@/lib/status"

/* ── Types ────────────────────────────────────────────────────── */
interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string | number
  requiredRoles?: AppRole[]
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

interface SidebarProps {
  groups: NavGroup[]
  header?: React.ReactNode
  footer?: React.ReactNode
  userRole?: AppRole
  defaultCollapsed?: boolean
  className?: string
}

/* ── Sidebar context ──────────────────────────────────────────── */
const SidebarContext = React.createContext<{
  collapsed: boolean
  setCollapsed: (v: boolean) => void
}>({ collapsed: false, setCollapsed: () => {} })

function useSidebar() {
  return React.useContext(SidebarContext)
}

/* ── Main Sidebar ─────────────────────────────────────────────── */
function Sidebar({
  groups,
  header,
  footer,
  userRole,
  defaultCollapsed = false,
  className,
}: SidebarProps) {
  const [collapsed, setCollapsed] = React.useState(defaultCollapsed)
  const pathname = usePathname()

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      <TooltipProvider delay={collapsed ? 400 : 600}>
        <motion.aside
          animate={{ width: collapsed ? 56 : 232 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className={cn(
            "relative flex h-full flex-col overflow-hidden",
            "bg-sidebar text-sidebar-foreground",
            "border-r border-sidebar-border",
            className
          )}
        >
          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
            className={cn(
              "absolute right-1.5 top-3.5 z-10 flex size-6 items-center justify-center rounded-md",
              "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              "transition-colors focus-visible:outline-2 focus-visible:outline-sidebar-ring"
            )}
          >
            <PanelLeft className="size-3.5" />
          </button>

          {/* Header */}
          <div
            className={cn(
              "flex items-center border-b border-sidebar-border py-3 transition-all",
              collapsed ? "justify-center px-3" : "px-4"
            )}
            style={{ minHeight: 52 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {collapsed ? (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.12 }}
                >
                  {header && typeof header !== "string" ? (
                    <span className="flex size-7 items-center justify-center">
                      {/* Collapsed icon slot */}
                    </span>
                  ) : null}
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex-1 overflow-hidden"
                >
                  {header}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2" aria-label="Navigation principale">
            {groups.map((group, gi) => (
              <div key={gi} className={cn("mb-1", !collapsed && group.label && "mt-2")}>
                {/* Group label */}
                {!collapsed && group.label && (
                  <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
                    {group.label}
                  </p>
                )}
                <ul role="list" className="space-y-0.5 px-1.5">
                  {group.items.map((item) => (
                    <SidebarNavItem
                      key={item.href}
                      item={item}
                      pathname={pathname}
                      collapsed={collapsed}
                      userRole={userRole}
                    />
                  ))}
                </ul>
              </div>
            ))}
          </nav>

          {/* Footer */}
          {footer && (
            <div
              className={cn(
                "border-t border-sidebar-border py-2",
                collapsed ? "px-1.5" : "px-1.5"
              )}
            >
              {footer}
            </div>
          )}
        </motion.aside>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

/* ── Nav item ─────────────────────────────────────────────────── */
function SidebarNavItem({
  item,
  pathname,
  collapsed,
  userRole,
}: {
  item: NavItem
  pathname: string
  collapsed: boolean
  userRole?: AppRole
}) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
  const isRestricted =
    item.requiredRoles && userRole && !item.requiredRoles.includes(userRole)

  const content = (
    <li>
      <Link
        href={isRestricted ? "#" : item.href}
        aria-current={isActive ? "page" : undefined}
        aria-disabled={isRestricted || undefined}
        onClick={isRestricted ? (e) => e.preventDefault() : undefined}
        className={cn(
          "relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
          "focus-visible:outline-2 focus-visible:outline-sidebar-ring focus-visible:outline-offset-1",
          isActive && !isRestricted
            ? "bg-sidebar-accent text-sidebar-primary-foreground font-medium"
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
          isRestricted && "cursor-not-allowed opacity-50",
          collapsed ? "justify-center" : ""
        )}
      >
        {/* Active left accent bar */}
        {isActive && !isRestricted && (
          <span
            className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-r bg-sidebar-primary"
            aria-hidden="true"
          />
        )}

        {/* Icon */}
        <item.icon
          className={cn(
            "shrink-0 transition-colors",
            collapsed ? "size-4.5" : "size-4",
            isActive ? "text-sidebar-primary" : "text-sidebar-foreground/70"
          )}
          strokeWidth={isActive ? 2 : 1.75}
        />

        {/* Label */}
        {!collapsed && (
          <span className="flex-1 truncate">{item.label}</span>
        )}

        {/* Badge */}
        {!collapsed && item.badge != null && (
          <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sidebar-primary px-1 text-[10px] font-semibold text-sidebar-primary-foreground">
            {item.badge}
          </span>
        )}

        {/* Lock for restricted */}
        {isRestricted && !collapsed && (
          <Lock className="size-3 shrink-0 opacity-60" />
        )}
      </Link>
    </li>
  )

  if (collapsed || isRestricted) {
    return (
      <Tooltip>
        <TooltipTrigger className="block w-full text-left">
          {content}
        </TooltipTrigger>
        <TooltipContent side="right">
          {isRestricted ? `${item.label} — Accès restreint` : item.label}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

/* ── Sidebar header presets ───────────────────────────────────── */
function SidebarHeaderDNPEC() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-7 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold shrink-0">
        D
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">DNPEC</p>
        <p className="truncate text-[10px] text-sidebar-foreground/50">Minist. du Plan</p>
      </div>
    </div>
  )
}

export { Sidebar, SidebarHeaderDNPEC, useSidebar, type NavItem, type NavGroup, type SidebarProps }
