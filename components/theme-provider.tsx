"use client"

import * as React from "react"

export type Theme = "dark" | "light" | "system"
export type ResolvedTheme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
}

const STORAGE_KEY = "perf-lab-theme-v2"
const listeners = new Set<() => void>()

function subscribeTheme(callback: () => void) {
  listeners.add(callback)
  if (typeof window !== "undefined") {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) callback()
    }
    window.addEventListener("storage", onStorage)
    return () => {
      listeners.delete(callback)
      window.removeEventListener("storage", onStorage)
    }
  }
  return () => {
    listeners.delete(callback)
  }
}

function getClientThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "light"
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored
    }
  } catch {
    // Ignore restricted localStorage access
  }
  return "light"
}

function getServerThemeSnapshot(): Theme {
  return "light"
}

function resolveSystemTheme(theme: Theme): ResolvedTheme {
  if (theme === "light" || theme === "dark") return theme
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function applyDocumentTheme(active: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", active === "dark")
  const meta = document.querySelector('meta[name="color-scheme"]')
  if (meta) {
    meta.setAttribute("content", active)
  }
}

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "light",
  resolvedTheme: "light",
  setTheme: () => undefined,
})

export function useTheme() {
  return React.useContext(ThemeContext)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    getClientThemeSnapshot,
    getServerThemeSnapshot
  )

  const resolvedTheme = resolveSystemTheme(theme)

  React.useEffect(() => {
    applyDocumentTheme(resolveSystemTheme(theme))
  }, [theme])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // Ignore storage quota / privacy block
    }
    applyDocumentTheme(resolveSystemTheme(nextTheme))
    for (const listener of listeners) {
      listener()
    }
  }, [])

  const value = React.useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return (
    <ThemeContext.Provider value={value}>
      <ThemeHotkey />
      {children}
    </ThemeContext.Provider>
  )
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (event.key.toLowerCase() !== "d") {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [resolvedTheme, setTheme])

  return null
}
