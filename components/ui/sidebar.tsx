"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  PanelLeft,
  Lock,
  ChevronRight,
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
  collapsible?: boolean
  defaultOpen?: boolean
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
      <TooltipProvider delay={collapsed ? 300 : 800}>
        <motion.aside
          animate={{ width: collapsed ? 60 : 240 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={cn(
            "relative flex h-full flex-col overflow-hidden select-none",
            "bg-sidebar text-sidebar-foreground",
            "border-r border-sidebar-border",
            className
          )}
        >
          {/* Top accent line */}
          <div
            className="absolute inset-x-0 top-0 h-px z-10 pointer-events-none"
            style={{ background: "linear-gradient(90deg, transparent 0%, #2563EB55 40%, #2563EB80 50%, #2563EB55 60%, transparent 100%)" }}
          />

          {/* Toggle button */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Agrandir la sidebar" : "Réduire la sidebar"}
            className={cn(
              "absolute right-2 top-3.5 z-10 flex size-6 items-center justify-center rounded-md",
              "text-sidebar-foreground/35 hover:text-sidebar-foreground/80",
              "hover:bg-white/8",
              "transition-all duration-200 focus-visible:outline-2 focus-visible:outline-sidebar-ring"
            )}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <PanelLeft className="size-3.5" />
            </motion.div>
          </button>

          {/* Header */}
          <div
            className={cn(
              "flex items-center border-b border-sidebar-border transition-all duration-200",
              collapsed ? "justify-center px-3 py-3.5" : "px-4 py-3.5"
            )}
            style={{ minHeight: 56 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {collapsed ? (
                <motion.div
                  key="icon"
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.75 }}
                  transition={{ duration: 0.15 }}
                >
                  <div
                    className="flex size-8 items-center justify-center rounded-lg text-white text-sm font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
                  >
                    D
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="full"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 overflow-hidden"
                >
                  {header}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav
            className="flex-1 overflow-y-auto overflow-x-hidden py-3"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}
            aria-label="Navigation principale"
          >
            {groups.map((group, gi) => (
              <NavGroupSection
                key={gi}
                group={group}
                pathname={pathname}
                collapsed={collapsed}
                userRole={userRole}
              />
            ))}
          </nav>

          {/* Footer */}
          {footer && (
            <div className={cn("border-t border-sidebar-border py-2", "px-1.5")}>
              {footer}
            </div>
          )}
        </motion.aside>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

/* ── Nav Group Section ────────────────────────────────────────── */
function NavGroupSection({
  group,
  pathname,
  collapsed,
  userRole,
}: {
  group: NavGroup
  pathname: string
  collapsed: boolean
  userRole?: AppRole
}) {
  const hasActiveItem = group.items.some(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )
  const [open, setOpen] = React.useState(group.defaultOpen !== false || hasActiveItem)

  const isCollapsible = !!group.collapsible && !collapsed

  // Auto-expand when sidebar collapses to icon-only mode
  React.useEffect(() => {
    if (collapsed) setOpen(true)
  }, [collapsed])

  // Auto-expand if the user navigates into this group while it's closed
  React.useEffect(() => {
    if (hasActiveItem) setOpen(true)
  }, [pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={cn("mb-0.5", !collapsed && group.label && "mt-2")}>
      {/* Group label */}
      {!collapsed && group.label && (
        isCollapsible ? (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className={cn(
              "group/grouplabel w-full flex items-center justify-between gap-2",
              "mb-1 px-3 py-1.5 mx-1.5 rounded-md",
              "hover:bg-white/8 transition-colors duration-150",
              "focus-visible:outline-2 focus-visible:outline-sidebar-ring"
            )}
            style={{ width: "calc(100% - 12px)" }}
          >
            <span
              className={cn(
                "text-[10px] font-semibold uppercase tracking-widest transition-colors duration-150",
                open
                  ? "text-sidebar-foreground/60"
                  : hasActiveItem
                  ? "text-sidebar-primary/80"
                  : "text-sidebar-foreground/50"
              )}
            >
              {group.label}
            </span>
            <motion.div
              animate={{ rotate: open ? 90 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="shrink-0"
            >
              <ChevronRight
                className={cn(
                  "size-3.5 transition-colors duration-150",
                  open
                    ? "text-sidebar-foreground/50"
                    : hasActiveItem
                    ? "text-sidebar-primary/70"
                    : "text-sidebar-foreground/40"
                )}
              />
            </motion.div>
          </button>
        ) : (
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
            {group.label}
          </p>
        )
      )}

      {/* Collapsed group with active item — subtle dot indicator */}
      {isCollapsible && !open && hasActiveItem && (
        <div className="mx-3 mb-1 h-px rounded-full bg-sidebar-primary/40" />
      )}

      {/* Items */}
      <AnimatePresence initial={false}>
        {(!isCollapsible || open) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: "hidden" }}
          >
            <ul role="list" className="space-y-0.5 px-2 pb-0.5">
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
          "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm",
          "transition-all duration-150",
          "focus-visible:outline-2 focus-visible:outline-sidebar-ring focus-visible:outline-offset-1",
          isActive && !isRestricted
            ? "bg-sidebar-accent text-white font-medium"
            : "text-sidebar-foreground hover:bg-white/6 hover:text-white",
          isRestricted && "cursor-not-allowed opacity-40",
          collapsed ? "justify-center" : ""
        )}
      >
        {/* Active left accent — layoutId lets it slide between nav items */}
        {isActive && !isRestricted && (
          <motion.span
            layoutId="nav-active-accent"
            className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-sidebar-primary"
            transition={{ duration: 0.2, ease: "easeOut" }}
            aria-hidden="true"
          />
        )}

        {/* Active ambient gradient */}
        {isActive && !isRestricted && (
          <span
            className="absolute inset-0 rounded-lg pointer-events-none"
            style={{ background: "linear-gradient(110deg, rgba(37,99,235,0.15) 0%, transparent 70%)" }}
            aria-hidden="true"
          />
        )}

        {/* Icon */}
        <item.icon
          className={cn(
            "relative shrink-0 transition-all duration-150",
            collapsed ? "size-[18px]" : "size-4",
            isActive
              ? "text-sidebar-primary"
              : "text-sidebar-foreground/55 group-hover:text-sidebar-foreground/90"
          )}
          strokeWidth={isActive ? 2.25 : 1.75}
        />

        {/* Label */}
        {!collapsed && (
          <span className="relative flex-1 truncate">{item.label}</span>
        )}

        {/* Badge */}
        {!collapsed && item.badge != null && (
          <span className="relative flex h-4 min-w-[18px] items-center justify-center rounded-full bg-sidebar-primary px-1.5 text-[10px] font-semibold text-white tabular-nums">
            {item.badge}
          </span>
        )}

        {/* Lock for restricted */}
        {isRestricted && !collapsed && (
          <Lock className="relative size-3 shrink-0 opacity-50" />
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
        <TooltipContent side="right" className="text-xs">
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
      <div
        className="relative flex size-8 items-center justify-center rounded-lg shrink-0"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
      >
        <span className="text-white text-sm font-bold tracking-tight">D</span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white tracking-wide">DNPEC</p>
        <p className="truncate text-[10px] text-sidebar-foreground/45 tracking-wide">
          Éco. Finances &amp; Budget
        </p>
      </div>
    </div>
  )
}

export { Sidebar, SidebarHeaderDNPEC, useSidebar, type NavItem, type NavGroup, type SidebarProps }
