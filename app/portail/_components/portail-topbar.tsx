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

const PAGE_TITLES: Record<string, string> = {
  "/portail/dashboard":     "Tableau de bord",
  "/portail/campagnes":     "Mes campagnes",
  "/portail/notifications": "Notifications",
  "/portail/profil":        "Mon profil",
}

interface PortailTopbarProps {
  profile:     { full_name: string; email: string }
  unreadCount: number
}

export function PortailTopbar({ profile, unreadCount }: PortailTopbarProps) {
  const pathname = usePathname()
  const { appTheme, toggleAppTheme } = useTheme()
  const [, startSignOut] = useTransition()
  const pageTitle = PAGE_TITLES[pathname] ?? "Portail"
  const initials  = profile.full_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border bg-background px-5 shrink-0 shadow-subtle">
      <h1 className="flex-1 text-[14px] font-semibold text-foreground truncate">{pageTitle}</h1>

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

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline-ring cursor-pointer">
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-[13px] font-medium max-w-32 truncate">
            {profile.full_name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2.5 py-2 flex items-center gap-2.5">
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-[13px] font-semibold truncate">{profile.full_name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{profile.email}</p>
            </div>
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
