"use client"

import * as React from "react"

type AppTheme = "light" | "dark"
type SidebarTheme = "light" | "dark"

interface ThemeContextValue {
  appTheme: AppTheme
  sidebarTheme: SidebarTheme
  toggleAppTheme: (event: React.MouseEvent) => void
  toggleSidebarTheme: (event: React.MouseEvent) => void
}

const ThemeContext = React.createContext<ThemeContextValue>({
  appTheme: "light",
  sidebarTheme: "dark",
  toggleAppTheme: () => {},
  toggleSidebarTheme: () => {},
})

function setVtOrigin(e: React.MouseEvent) {
  document.documentElement.style.setProperty("--vt-x", `${e.clientX}px`)
  document.documentElement.style.setProperty("--vt-y", `${e.clientY}px`)
}

function applyTransition(
  goingTo: "light" | "dark",
  applyChange: () => void
) {
  const html = document.documentElement
  const dirClass = goingTo === "light" ? "theme-going-light" : "theme-going-dark"

  html.classList.add(dirClass)

  if (!document.startViewTransition) {
    applyChange()
    html.classList.remove(dirClass)
    return
  }

  document.startViewTransition(() => {
    applyChange()
  }).finished.finally(() => {
    html.classList.remove(dirClass)
  })
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [appTheme, setAppTheme] = React.useState<AppTheme>("light")
  const [sidebarTheme, setSidebarTheme] = React.useState<SidebarTheme>("dark")

  // Read initial state from <html> (set by the anti-flash init script)
  React.useEffect(() => {
    const html = document.documentElement
    setAppTheme(html.classList.contains("dark") ? "dark" : "light")
    setSidebarTheme(
      html.getAttribute("data-sidebar-theme") === "light" ? "light" : "dark"
    )
  }, [])

  const toggleAppTheme = React.useCallback((e: React.MouseEvent) => {
    setVtOrigin(e)
    setAppTheme((current) => {
      const next = current === "light" ? "dark" : "light"
      applyTransition(next, () => {
        const html = document.documentElement
        if (next === "dark") html.classList.add("dark")
        else html.classList.remove("dark")
        try { localStorage.setItem("dnpec-app-theme", next) } catch {}
      })
      return next
    })
  }, [])

  const toggleSidebarTheme = React.useCallback((e: React.MouseEvent) => {
    setVtOrigin(e)
    setSidebarTheme((current) => {
      const next = current === "light" ? "dark" : "light"
      applyTransition(next === "dark" ? "dark" : "light", () => {
        const html = document.documentElement
        if (next === "light") html.setAttribute("data-sidebar-theme", "light")
        else html.removeAttribute("data-sidebar-theme")
        try { localStorage.setItem("dnpec-sidebar-theme", next) } catch {}
      })
      return next
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ appTheme, sidebarTheme, toggleAppTheme, toggleSidebarTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return React.useContext(ThemeContext)
}
