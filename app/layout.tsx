import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/toaster"

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
    "Plateforme nationale de collecte et d'analyse des données de conjoncture économique — Direction Nationale de la Prévision Économique et de la Conjoncture, Ministère du Plan, République de Guinée.",
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
      <body className="min-h-full bg-background text-foreground antialiased">
        <TooltipProvider delay={400}>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  )
}
