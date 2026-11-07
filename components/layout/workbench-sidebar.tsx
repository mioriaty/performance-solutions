"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import {
  Bookmark,
  CheckCircle2,
  Cpu,
  LayoutGrid,
  Leaf,
  Menu,
  Search,
  Sprout,
  X,
} from "lucide-react"
import { ALL_LABS, PILLARS } from "@/lib/labs/catalog"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { cn } from "@/lib/utils"

const PILLAR_DOT_COLORS: Record<number, string> = {
  1: "bg-[#86efac]",
  2: "bg-[#eab308]",
  3: "bg-[#60a5fa]",
  4: "bg-[#c084fc]",
  5: "bg-[#f472b6]",
  6: "bg-[#fb923c]",
}

const PILLAR_SHORT_LABELS: Record<number, { en: string; vi: string }> = {
  1: { en: "RENDERING & FIBER", vi: "RENDERING & FIBER" },
  2: { en: "MAIN THREAD & INP", vi: "MAIN THREAD & INP" },
  3: { en: "MEMORY & LEAKS", vi: "MEMORY & RÒ RỈ BỘ NHỚ" },
  4: { en: "NETWORK & CWV", vi: "NETWORK & CORE WEB VITALS" },
  5: { en: "DATA SCALE & STREAMS", vi: "DỮ LIỆU LỚN & REALTIME" },
  6: { en: "BUNDLE & ARCHITECTURE", vi: "BUNDLE & KIẾN TRÚC" },
}

export function WorkbenchSidebar() {
  const pathname = usePathname()
  const locale = useLocale() as Locale
  const isVi = locale === "vi"

  const snapshots = useTelemetryStore((s) => s.snapshots)
  const viewedLabs = useTelemetryStore((s) => s.viewedLabs)
  const savedLabs = useTelemetryStore((s) => s.savedLabs)
  const hydrateGardenState = useTelemetryStore((s) => s.hydrateGardenState)

  const [search, setSearch] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    hydrateGardenState()
  }, [hydrateGardenState])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        if (window.innerWidth < 1024) {
          setMobileOpen(true)
          setTimeout(() => searchInputRef.current?.focus(), 60)
        } else {
          searchInputRef.current?.focus()
          searchInputRef.current?.select()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const filteredLabs = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return ALL_LABS
    return ALL_LABS.filter((lab) => {
      const c = lab.content[locale]
      return (
        lab.code.toLowerCase().includes(q) ||
        lab.slug.toLowerCase().includes(q) ||
        lab.primaryMetric.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.symptomSummary.toLowerCase().includes(q) ||
        lab.libraries.some((l) => l.toLowerCase().includes(q))
      )
    })
  }, [search, locale])

  const viewedCount = viewedLabs.length
  const totalCount = ALL_LABS.length
  const progressPct = Math.min(
    100,
    Math.round((viewedCount / Math.max(1, totalCount)) * 100)
  )

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground select-none">
      {/* Pattern Garden Brand Header */}
      <div className="px-4 pt-5 pb-3">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="group flex cursor-pointer items-center gap-3"
        >
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/12 text-primary transition-colors group-hover:border-primary/45 group-hover:bg-primary/20">
            <Sprout className="size-4.5" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[17px] leading-none font-bold tracking-tight text-foreground">
              perflab
            </div>
            <div className="mt-1.5 truncate text-[9.5px] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
              {isVi
                ? "HIỆU NĂNG FE, TỪNG BƯỚC MỘT"
                : "FE PERFORMANCE, STEP BY STEP"}
            </div>
          </div>
        </Link>

        {/* Search Input with ⌘K shortcut */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isVi ? "Tìm một pattern..." : "Find a pattern..."}
            className="h-9 w-full rounded-xl border border-sidebar-border bg-card/70 pr-13 pl-8.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:bg-card focus:outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-2.5 right-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute top-1.5 right-2 inline-flex h-6 items-center gap-0.5 rounded-md border border-sidebar-border bg-muted/70 px-1.5 font-mono text-[10.5px] font-medium text-muted-foreground">
              <span>⌘</span>
              <span>K</span>
            </kbd>
          )}
        </div>

        {/* All Design Patterns & Foundations Links */}
        <div className="mt-3 space-y-1">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              pathname === "/"
                ? "bg-sidebar-accent text-foreground"
                : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="size-4 text-muted-foreground" />
              <span>
                {isVi ? "Tất cả mẫu hiệu năng" : "All performance patterns"}
              </span>
            </div>
            <span className="rounded-md bg-primary/18 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-primary">
              {ALL_LABS.length}
            </span>
          </Link>

          <Link
            href="/foundations"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex cursor-pointer items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
              pathname === "/foundations"
                ? "bg-sidebar-accent text-foreground"
                : "text-sidebar-foreground/85 hover:bg-sidebar-accent/60 hover:text-foreground"
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Cpu className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">
                {isVi ? "Event Loop & Pixel Pipeline" : "Event Loop & Pipeline"}
              </span>
            </div>
            <span className="rounded-md border border-sidebar-border bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              CORE
            </span>
          </Link>
        </div>
      </div>

      {/* Category Groups (Pattern Garden Style) */}
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {PILLARS.map((pillar) => {
          const labs = filteredLabs.filter((l) => l.pillarId === pillar.id)
          if (labs.length === 0) return null
          const dotColor = PILLAR_DOT_COLORS[pillar.id] ?? "bg-primary"
          const categoryLabel =
            PILLAR_SHORT_LABELS[pillar.id]?.[locale] ??
            pillar.title[locale].toUpperCase()

          return (
            <div key={pillar.id} className="space-y-1.5">
              {/* Category Overline Header: • STRUCTURAL  7 */}
              <div className="flex items-center justify-between px-2.5 py-1">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={cn("size-1.5 shrink-0 rounded-full", dotColor)}
                  />
                  <span className="truncate text-[10.5px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
                    {categoryLabel}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-muted-foreground/80">
                  {labs.length}
                </span>
              </div>

              {/* Pattern Items */}
              <div className="space-y-0.5">
                {labs.map((lab) => {
                  const href = `/labs/${lab.slug}`
                  const isActive = pathname === href
                  const isSaved = savedLabs.includes(lab.slug)
                  const snap = snapshots[lab.slug]
                  const hasBothSnapshots = Boolean(snap?.bad && snap?.good)

                  return (
                    <Link
                      key={lab.slug}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group relative flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-[13px] leading-snug transition-colors",
                        isActive
                          ? "bg-sidebar-accent font-medium text-foreground before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[3px] before:rounded-full before:bg-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className={cn(
                            "size-1 shrink-0 rounded-full transition-colors",
                            isActive
                              ? "bg-primary"
                              : "bg-muted-foreground/50 group-hover:bg-foreground/70"
                          )}
                        />
                        <span className="truncate">
                          {lab.content[locale].title}
                        </span>
                      </div>

                      <div className="flex shrink-0 items-center gap-1.5">
                        {isSaved && (
                          <Bookmark className="size-3 fill-primary text-primary" />
                        )}
                        {hasBothSnapshots ? (
                          <CheckCircle2
                            className="size-3.5 text-primary"
                            aria-label="Benchmarked"
                          />
                        ) : isActive ? (
                          <span className="size-1.5 rounded-full bg-primary" />
                        ) : null}
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Sticky Bottom Reading Progress Footer (Pattern Garden Signature) */}
      <div className="border-t border-sidebar-border bg-sidebar px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
            <Leaf className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[12px] font-medium text-foreground">
              {isVi ? "Tiến độ đọc của bạn" : "Your reading progress"}
            </div>
            <div className="truncate text-[11px] text-muted-foreground">
              {isVi
                ? `Đã xem ${viewedCount} / ${totalCount} pattern`
                : `Viewed ${viewedCount} / ${totalCount} patterns`}
            </div>
          </div>
        </div>
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Sidebar Toggle Button */}
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="fixed bottom-4 left-4 z-50 flex size-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg lg:hidden"
        aria-label="Toggle navigation menu"
      >
        {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/65 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-72 border-r border-sidebar-border bg-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Pattern Garden Sidebar */}
      <aside className="hidden w-70 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">{sidebarContent}</div>
      </aside>
    </>
  )
}
