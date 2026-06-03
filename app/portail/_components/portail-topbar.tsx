"use client"

import * as React from "react"
import { useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, LogOut, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { signOut } from "@/app/actions/auth"
import { useTheme } from "@/lib/theme"

const BREADCRUMB_MAP: Record<string, string> = {
  "/portail/dashboard":     "Tableau de bord",
  "/portail/notifications": "Notifications",
  "/portail/profil":        "Mon profil",
}

interface PortailTopbarProps {
  profile:     { full_name: string; email: string }
  unreadCount: number
}

export function PortailTopbar({ profile, unreadCount }: PortailTopbarProps) {
  const pathname    = usePathname()
  const { appTheme, toggleAppTheme } = useTheme()
  const [, startSignOut] = useTransition()
  const pageLabel   = BREADCRUMB_MAP[pathname] ?? "Portail"
  const isHome      = pathname === "/portail/dashboard"
  const initials    = profile.full_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border bg-background px-4 shrink-0">
      {/* Breadcrumb */}
      <nav className="flex-1 flex items-center gap-1.5 text-sm min-w-0">
        <Link href="/portail/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">
          Portail
        </Link>
        {!isHome && (
          <>
            <span className="text-muted-foreground/50 select-none">/</span>
            <span className="font-medium text-foreground truncate">{pageLabel}</span>
          </>
        )}
      </nav>

      {/* App theme */}
      <Tooltip>
        <TooltipTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          onClick={toggleAppTheme}
        >
          {appTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {appTheme === "dark" ? "Mode clair" : "Mode sombre"}
        </TooltipContent>
      </Tooltip>

      {/* Bell → link to notifications */}
      <Link
        href="/portail/notifications"
        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
        aria-label="Notifications"
      >
        <Bell className="size-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-status-bad" />
        )}
      </Link>

      {/* Avatar */}
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline-ring cursor-pointer">
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
            {profile.full_name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5 flex flex-col gap-0.5">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-2 cursor-pointer text-status-bad-text focus:text-status-bad-text focus:bg-status-bad-bg"
            onClick={() => startSignOut(() => { signOut() })}
          >
            <LogOut className="size-3.5" />
            Déconnexion
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
