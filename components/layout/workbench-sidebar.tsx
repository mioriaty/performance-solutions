"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  LayoutDashboard,
  Layers,
  Menu,
  Package,
  Search,
  X,
} from "lucide-react"
import { ALL_LABS, PILLARS } from "@/lib/labs/catalog"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { cn } from "@/lib/utils"

const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> =
  {
    Layers,
    Cpu,
    Database,
    Globe,
    Activity,
    Package,
  }

export function WorkbenchSidebar() {
  const pathname = usePathname()
  const locale = useLocale() as Locale
  const t = useTranslations("app")
  const snapshots = useTelemetryStore((s) => s.snapshots)

  const [search, setSearch] = useState("")
  const [mobileOpen, setMobileOpen] = useState(false)

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

  const sidebarContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Documentation Brand Header */}
      <div className="border-b border-sidebar-border px-5 py-4">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <BookOpen className="size-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              {t("title")}
            </div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">
              Engineering Docs & Labs
            </div>
          </div>
        </Link>

        {/* Search Input */}
        <div className="relative mt-3.5">
          <Search className="pointer-events-none absolute top-2.5 left-3 size-3.5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="h-8.5 w-full rounded-lg border border-sidebar-border bg-background pr-7 pl-8.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute top-2.5 right-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Documentation Navigation Tree */}
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Overview Link */}
        <div>
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors cursor-pointer",
              pathname === "/"
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <LayoutDashboard className="size-4 shrink-0" />
            <span>{t("overview")}</span>
          </Link>
        </div>

        {/* 6 Pillars & 18 Labs */}
        {PILLARS.map((pillar) => {
          const labs = filteredLabs.filter((l) => l.pillarId === pillar.id)
          if (labs.length === 0) return null
          const Icon = PILLAR_ICONS[pillar.iconName] ?? Layers

          return (
            <div key={pillar.id} className="space-y-1.5">
              <div className="flex items-center gap-2 px-2 text-xs font-semibold tracking-tight text-foreground">
                <Icon className="size-3.5 shrink-0 text-primary" />
                <span>
                  {pillar.id}. {pillar.title[locale]}
                </span>
              </div>

              <div className="ml-2 border-l border-sidebar-border pl-2 space-y-0.5">
                {labs.map((lab) => {
                  const href = `/labs/${lab.slug}`
                  const isActive = pathname === href
                  const snap = snapshots[lab.slug]
                  const hasBothSnapshots = Boolean(snap?.bad && snap?.good)

                  return (
                    <Link
                      key={lab.slug}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "group flex items-start justify-between gap-2 rounded-md px-2.5 py-1.5 text-[13px] leading-snug transition-colors cursor-pointer",
                        isActive
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      )}
                    >
                      <div className="flex min-w-0 items-baseline gap-2">
                        <span
                          className={cn(
                            "shrink-0 font-mono text-[11px]",
                            isActive
                              ? "font-semibold text-primary"
                              : "text-muted-foreground/70"
                          )}
                        >
                          {lab.code}
                        </span>
                        <span className="line-clamp-2">
                          {lab.content[locale].title}
                        </span>
                      </div>

                      {hasBothSnapshots && (
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-emerald-500"
                          aria-label="Benchmarked"
                        />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>
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
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-80 border-r border-sidebar-border bg-sidebar"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop Persistent Documentation Sidebar */}
      <aside className="hidden w-80 shrink-0 border-r border-sidebar-border bg-sidebar lg:block">
        <div className="sticky top-0 h-svh">{sidebarContent}</div>
      </aside>
    </>
  )
}
