"use client"

import * as React from "react"
import { useEffect, useTransition } from "react"
import { LayoutDashboard, Bell, User, LogOut, Megaphone } from "lucide-react"
import { Sidebar, type NavGroup } from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { PortailTopbar } from "./portail-topbar"
import { signOut } from "@/app/actions/auth"

interface PortailShellClientProps {
  profile:     { full_name: string; email: string }
  company:     { name: string }
  unreadCount: number
  children:    React.ReactNode
}

export function PortailShellClient({
  profile,
  company,
  unreadCount,
  children,
}: PortailShellClientProps) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [])

  const [, startSignOut] = useTransition()

  const navGroups: NavGroup[] = [
    {
      items: [
        { href: "/portail/dashboard",     label: "Tableau de bord", icon: LayoutDashboard },
        { href: "/portail/campagnes",     label: "Campagnes",       icon: Megaphone },
        {
          href:  "/portail/notifications",
          label: "Notifications",
          icon:  Bell,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        { href: "/portail/profil", label: "Mon profil", icon: User },
      ],
    },
  ]

  const companyInitials = company.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const profileInitials = profile.full_name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const header = (
    <div className="flex items-center gap-2.5">
      <div
        className="flex size-8 items-center justify-center rounded-lg shrink-0 text-white text-sm font-bold"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2563eb 100%)" }}
      >
        {companyInitials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold text-white leading-tight">{company.name}</p>
        <p className="truncate text-[10px] text-sidebar-foreground/45 tracking-wide">
          Espace Entreprise
        </p>
      </div>
    </div>
  )

  const footer = (
    <div className="flex items-center gap-2.5 px-1 py-1 rounded-lg">
      <Avatar size="sm">
        <AvatarFallback>{profileInitials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-sidebar-foreground/85 truncate leading-tight">
          {profile.full_name}
        </p>
        <p className="text-[10px] text-sidebar-foreground/40 truncate">{profile.email}</p>
      </div>
      <button
        type="button"
        onClick={() => startSignOut(() => { signOut() })}
        className="shrink-0 p-1 rounded text-sidebar-foreground/35 hover:text-sidebar-foreground/75 hover:bg-white/6 transition-colors"
        title="Déconnexion"
        aria-label="Déconnexion"
      >
        <LogOut className="size-3.5" />
      </button>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar groups={navGroups} header={header} footer={footer} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortailTopbar profile={profile} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
