"use client"

import * as React from "react"
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
} from "lucide-react"
import { Sidebar, SidebarHeaderDNPEC, type NavGroup } from "@/components/ui/sidebar"
import { CommandPalette, useCommandPalette } from "@/components/ui/command-palette"
import { Topbar } from "./topbar"
import type { AppRole } from "@/lib/status"

function buildNavGroups(): NavGroup[] {
  return [
    {
      label: "Vue globale",
      items: [
        { href: "/direction/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      ],
    },
    {
      label: "Entreprises",
      items: [
        { href: "/direction/entreprises", label: "Répertoire", icon: Building2 },
      ],
    },
    {
      label: "Collecte",
      items: [
        { href: "/direction/formulaires", label: "Formulaires", icon: FileText },
        { href: "/direction/campagnes", label: "Campagnes", icon: Megaphone },
        { href: "/direction/validations", label: "Validations soumissions", icon: CheckSquare },
      ],
    },
    {
      label: "Analyses",
      items: [
        { href: "/direction/analyses", label: "Analyses & Indices", icon: BarChart3 },
        { href: "/direction/exports", label: "Exports", icon: Download },
      ],
    },
    {
      label: "Administration",
      items: [
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
