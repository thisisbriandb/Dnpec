"use client"

import * as React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  FileText,
  Megaphone,
  CheckSquare,
  BarChart3,
  Download,
  Shield,
  Settings,
  Layers,
  UserCog,
} from "lucide-react"
import { Sidebar, SidebarHeaderDNPEC, type NavGroup } from "@/components/ui/sidebar"
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette"
import { Topbar } from "./topbar"
import type { AppRole } from "@/lib/status"

function buildNavGroups(): NavGroup[] {
  return [
    {
      label: "Vue globale",
      collapsible: true,
      defaultOpen: true,
      items: [
        { href: "/direction/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      ],
    },
    {
      label: "Entreprises",
      collapsible: true,
      defaultOpen: true,
      items: [
        { href: "/direction/entreprises",               label: "Répertoire",    icon: Building2  },
        { href: "/direction/entreprises/statistiques",  label: "Statistiques",  icon: BarChart3  },
      ],
    },
    {
      label: "Collecte",
      collapsible: true,
      defaultOpen: true,
      items: [
        { href: "/direction/formulaires", label: "Formulaires", icon: FileText },
        { href: "/direction/campagnes", label: "Campagnes", icon: Megaphone },
        { href: "/direction/validations", label: "Validations soumissions", icon: CheckSquare },
      ],
    },
    {
      label: "Analyses",
      collapsible: true,
      defaultOpen: true,
      items: [
        { href: "/direction/analyses", label: "Analyses & Indices", icon: BarChart3 },
        { href: "/direction/exports", label: "Exports", icon: Download },
      ],
    },
    {
      label: "Administration",
      collapsible: true,
      defaultOpen: true,
      items: [
        {
          href: "/direction/secteurs",
          label: "Secteurs",
          icon: Layers,
          requiredRoles: ["super_admin", "analyste"],
        },
        {
          href: "/direction/utilisateurs",
          label: "Utilisateurs DNPEC",
          icon: UserCog,
          requiredRoles: ["super_admin"],
        },
        {
          href: "/direction/audit",
          label: "Audit",
          icon: Shield,
          requiredRoles: ["super_admin"],
        },
        {
          href: "/direction/parametres",
          label: "Paramètres",
          icon: Settings,
          requiredRoles: ["super_admin"],
        },
      ],
    },
  ]
}

interface DirectionShellClientProps {
  profile: { full_name: string; email: string; role: AppRole }
  pendingCount: number
  unreadCount: number
  children: React.ReactNode
}

export function DirectionShellClient({
  profile,
  pendingCount,
  unreadCount,
  children,
}: DirectionShellClientProps) {
  const router = useRouter()
  const { open, setOpen } = useCommandPalette()
  const navGroups = buildNavGroups()

  // Empêche le scroll du body pendant que le shell direction est monté.
  // Sans ça, le navigateur affiche deux scrollbars : un sur body et un sur <main>.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        groups={navGroups}
        header={<SidebarHeaderDNPEC />}
        userRole={profile.role}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar
          profile={profile}
          unreadCount={unreadCount}
          onOpenCommandPalette={() => setOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        onNavigate={(href) => router.push(href)}
      />
    </div>
  )
}
