"use client"

import * as React from "react"
import { useEffect } from "react"
import { LayoutDashboard, Bell, User } from "lucide-react"
import { Sidebar, type NavGroup } from "@/components/ui/sidebar"
import { PortailTopbar } from "./portail-topbar"

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

  const navGroups: NavGroup[] = [
    {
      items: [
        { href: "/portail/dashboard",     label: "Tableau de bord", icon: LayoutDashboard },
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

  const initials = company.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  const header = (
    <div className="flex items-center gap-2.5">
      <div
        className="flex size-8 items-center justify-center rounded-lg shrink-0 text-white text-sm font-bold"
        style={{ background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)" }}
      >
        {initials}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white tracking-wide">{company.name}</p>
        <p className="truncate text-[10px] text-sidebar-foreground/45 tracking-wide">
          DNPEC · Espace Entreprise
        </p>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar groups={navGroups} header={header} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortailTopbar profile={profile} unreadCount={unreadCount} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
