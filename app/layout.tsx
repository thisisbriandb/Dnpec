import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/lib/theme"

const THEME_INIT_SCRIPT = `
try {
  var at = localStorage.getItem('dnpec-app-theme');
  var st = localStorage.getItem('dnpec-sidebar-theme');
  if (at === 'dark') document.documentElement.classList.add('dark');
  if (st === 'light') document.documentElement.setAttribute('data-sidebar-theme', 'light');
} catch(e) {}
`.trim()

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["400", "500", "600"],
})

export const metadata: Metadata = {
  title: "DNPEC — Plateforme de collecte conjoncturelle",
  description:
    "Plateforme nationale de collecte et d'analyse des données de conjoncture économique — Direction Nationale des Prévisions Économiques et de la Conjoncture (DNPEC), Ministère de l'économie, des finances et du budget, République de Guinée.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="fr"
      className={cn("h-full", inter.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <head>
        {/* Anti-flash init : applique les thèmes avant le premier rendu */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <ThemeProvider>
          <TooltipProvider delay={400}>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
