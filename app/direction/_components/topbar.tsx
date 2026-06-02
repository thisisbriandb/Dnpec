"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Bell, Search, LogOut, User, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ROLE_LABELS, type AppRole } from "@/lib/status"
import { signOut } from "@/app/actions/auth"
import { useTheme } from "@/lib/theme"

const BREADCRUMB_MAP: Record<string, string> = {
  "/direction/dashboard":                    "Tableau de bord",
  "/direction/entreprises":                  "Répertoire",
  "/direction/entreprises/inscriptions":     "Inscriptions en attente",
  "/direction/entreprises/nouveau":          "Nouvelle entreprise",
  "/direction/formulaires":                  "Formulaires",
  "/direction/campagnes":                    "Campagnes",
  "/direction/campagnes/nouvelle":           "Nouvelle campagne",
  "/direction/validations":                  "Validations soumissions",
  "/direction/analyses":                     "Analyses & Indices",
  "/direction/exports":                      "Exports",
  "/direction/audit":                        "Audit",
  "/direction/parametres":                   "Paramètres",
}

function getBreadcrumbs(pathname: string): { label: string; href: string }[] {
  const crumbs: { label: string; href: string }[] = [
    { label: "Direction", href: "/direction/dashboard" },
  ]

  if (pathname === "/direction/dashboard") return crumbs

  const parts = pathname.split("/").filter(Boolean)
  let current = ""
  for (const part of parts.slice(1)) {
    current += "/" + part
    const label = BREADCRUMB_MAP[pathname] ?? BREADCRUMB_MAP["/direction" + current]
    if (label) crumbs.push({ label, href: "/direction" + current })
    else if (!part.match(/^[0-9a-f-]{36}$/)) {
      crumbs.push({ label: part.charAt(0).toUpperCase() + part.slice(1), href: "/direction" + current })
    }
  }
  return crumbs
}

interface TopbarProps {
  profile: { full_name: string; email: string; role: AppRole }
  unreadCount: number
  onOpenCommandPalette: () => void
}

export function Topbar({ profile, unreadCount, onOpenCommandPalette }: TopbarProps) {
  const pathname = usePathname()
  const crumbs = getBreadcrumbs(pathname)
  const { appTheme, toggleAppTheme } = useTheme()
  const initials = profile.full_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border bg-background px-4 shrink-0">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="flex-1 flex items-center gap-1.5 text-sm min-w-0">
        {crumbs.map((crumb, i) => (
          <React.Fragment key={crumb.href}>
            {i > 0 && <span className="text-muted-foreground/50 select-none">/</span>}
            {i === crumbs.length - 1 ? (
              <span className="font-medium text-foreground truncate">{crumb.label}</span>
            ) : (
              <Link href={crumb.href} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* ⌘K */}
      <button
        type="button"
        onClick={onOpenCommandPalette}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-2 text-muted-foreground hidden sm:flex"
        )}
      >
        <Search className="size-3.5" />
        <span>Rechercher</span>
        <kbd className="ml-1 rounded border border-border bg-muted px-1 text-[10px] font-mono">⌘K</kbd>
      </button>

      {/* App theme toggle */}
      <Tooltip>
        <TooltipTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          onClick={toggleAppTheme}
        >
          {appTheme === "dark" ? (
            <Sun className="size-4" />
          ) : (
            <Moon className="size-4" />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {appTheme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
        </TooltipContent>
      </Tooltip>

      {/* Bell */}
      <Tooltip>
        <TooltipTrigger
          className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}
          onClick={() => {}}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span
              className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-status-bad"
              aria-label={`${unreadCount} notifications non lues`}
            />
          )}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {unreadCount > 0
            ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
            : "Aucune notification"}
        </TooltipContent>
      </Tooltip>

      {/* Avatar menu */}
      <DropdownMenu>
        <DropdownMenuTrigger
          className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted transition-colors focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:block text-sm font-medium max-w-32 truncate">
            {profile.full_name}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5 flex flex-col gap-0.5">
            <p className="text-sm font-medium truncate">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
            <Badge variant="outline" className="mt-1 w-fit text-[10px] h-4">
              {ROLE_LABELS[profile.role]}
            </Badge>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
            <DropdownMenuItem className="gap-2 cursor-pointer">
              <User className="size-3.5" />
              Profil
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <form action={signOut}>
            <DropdownMenuItem
              className="gap-2 cursor-pointer text-status-bad-text focus:text-status-bad-text focus:bg-status-bad-bg"
              render={<button type="submit" className="w-full" />}
            >
              <LogOut className="size-3.5" />
              Déconnexion
            </DropdownMenuItem>
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
