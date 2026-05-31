"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Building2,
  FileText,
  Megaphone,
  CheckSquare,
  BarChart3,
  Download,
  Shield,
  Search,
  ArrowRight,
} from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon?: React.ReactNode
  shortcut?: string
  onSelect: () => void
  group?: string
}

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items?: CommandItem[]
  onNavigate?: (href: string) => void
}

const DEFAULT_NAV_ITEMS = [
  { href: "/direction/dashboard", label: "Tableau de bord", icon: <LayoutDashboard className="size-4" />, shortcut: "G D" },
  { href: "/direction/entreprises", label: "Entreprises", icon: <Building2 className="size-4" /> },
  { href: "/direction/formulaires", label: "Formulaires", icon: <FileText className="size-4" /> },
  { href: "/direction/campagnes", label: "Campagnes", icon: <Megaphone className="size-4" /> },
  { href: "/direction/validations", label: "Validations", icon: <CheckSquare className="size-4" /> },
  { href: "/direction/analyses", label: "Analyses & Indices", icon: <BarChart3 className="size-4" /> },
  { href: "/direction/exports", label: "Exports", icon: <Download className="size-4" /> },
  { href: "/direction/audit", label: "Audit", icon: <Shield className="size-4" /> },
]

function CommandPalette({
  open,
  onOpenChange,
  items = [],
  onNavigate,
}: CommandPaletteProps) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Palette de commandes"
      description="Naviguez rapidement entre les sections ou lancez des actions"
    >
      <CommandInput placeholder="Rechercher une page ou une action…" autoFocus />
      <CommandList>
        <CommandEmpty>
          <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
            <Search className="size-8 opacity-40" strokeWidth={1.5} />
            <p className="text-sm">Aucun résultat</p>
          </div>
        </CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation">
          {DEFAULT_NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.href}
              value={item.label}
              onSelect={() => {
                onNavigate?.(item.href)
                onOpenChange(false)
              }}
              className="gap-2.5"
            >
              <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.shortcut && (
                <CommandShortcut>{item.shortcut}</CommandShortcut>
              )}
              <ArrowRight className="ml-auto size-3 opacity-0 group-data-selected/command-item:opacity-40" />
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Custom actions */}
        {items.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.label}
                  onSelect={() => {
                    item.onSelect()
                    onOpenChange(false)
                  }}
                  className="gap-2.5"
                >
                  {item.icon && (
                    <span className="flex size-6 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      {item.icon}
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate">{item.label}</p>
                    {item.description && (
                      <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                    )}
                  </div>
                  {item.shortcut && (
                    <CommandShortcut>{item.shortcut}</CommandShortcut>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        {/* Keyboard hint */}
        <CommandSeparator />
        <div className="flex items-center justify-between gap-4 px-3 py-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="rounded border border-border bg-muted px-1 font-mono">↑↓</kbd>
            <span>naviguer</span>
            <kbd className="rounded border border-border bg-muted px-1 font-mono">↵</kbd>
            <span>sélectionner</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 font-mono">Échap</kbd>
            <span>fermer</span>
          </div>
        </div>
      </CommandList>
    </CommandDialog>
  )
}

/* ── Hook to manage palette state + ⌘K ───────────────────────── */
function useCommandPalette() {
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  return { open, setOpen }
}

export { CommandPalette, useCommandPalette, type CommandItem }
