"use client"

import { useEffect, useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { ChevronRight, Eye, Moon, RotateCcw, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useTelemetryStore } from "@/lib/telemetry/store"
import { getLabBySlug, getPillarById } from "@/lib/labs/catalog"
import { setUserLocale } from "@/i18n/actions"
import type { Locale } from "@/i18n/request"
import { cn } from "@/lib/utils"

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
  }
}

const PILLAR_BREADCRUMB_NAMES: Record<number, { en: string; vi: string }> = {
  1: { en: "Rendering & Fiber", vi: "Rendering & Fiber" },
  2: { en: "Main Thread & Runtime", vi: "Main Thread & Runtime" },
  3: { en: "Memory & Leaks", vi: "Memory & Leaks" },
  4: { en: "Network & CWV", vi: "Network & CWV" },
  5: { en: "Data Scale & Streams", vi: "Data Scale & Streams" },
  6: { en: "Bundle & Architecture", vi: "Bundle & Architecture" },
}

export function PerformanceHud() {
  const t = useTranslations("hud")
  const locale = useLocale() as Locale
  const isVi = locale === "vi"
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const [isPendingLocale, startLocaleTransition] = useTransition()

  const fps = useTelemetryStore((s) => s.fps)
  const minFps = useTelemetryStore((s) => s.minFps)
  const tbtMs = useTelemetryStore((s) => s.tbtMs)
  const inpMs = useTelemetryStore((s) => s.inpMs)
  const domNodes = useTelemetryStore((s) => s.domNodes)
  const heapMb = useTelemetryStore((s) => s.heapMb)
  const renderCount = useTelemetryStore((s) => s.renderCount)
  const renderFlashEnabled = useTelemetryStore((s) => s.renderFlashEnabled)
  const toggleRenderFlash = useTelemetryStore((s) => s.toggleRenderFlash)
  const resetCounters = useTelemetryStore((s) => s.resetCounters)

  useEffect(() => {
    let frameCount = 0
    let lastSampleTime = performance.now()
    let lastFrameTime = lastSampleTime
    let maxFrameDelta = 16.6
    let rafId = 0

    const loop = (now: number) => {
      frameCount += 1
      const delta = now - lastFrameTime
      lastFrameTime = now
      if (delta > maxFrameDelta) {
        maxFrameDelta = delta
      }

      const elapsed = now - lastSampleTime
      if (elapsed >= 500) {
        const avgFps = (frameCount * 1000) / elapsed
        const worstInstantFps = 1000 / Math.max(16.6, maxFrameDelta)
        const effectiveFps = maxFrameDelta > 55 ? worstInstantFps : avgFps

        const nodes = document.getElementsByTagName("*").length
        const perfMem = (performance as PerformanceWithMemory).memory
        const baseHeapMb = perfMem ? perfMem.usedJSHeapSize / (1024 * 1024) : 24

        useTelemetryStore
          .getState()
          .updateFpsSample(effectiveFps, nodes, baseHeapMb)

        if (maxFrameDelta > 55) {
          useTelemetryStore.getState().recordLongTask(maxFrameDelta)
        }

        frameCount = 0
        maxFrameDelta = 16.6
        lastSampleTime = now
      }

      rafId = window.requestAnimationFrame(loop)
    }

    rafId = window.requestAnimationFrame(loop)

    let longTaskObserver: PerformanceObserver | null = null
    let eventObserver: PerformanceObserver | null = null

    if (typeof PerformanceObserver !== "undefined") {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              useTelemetryStore.getState().recordLongTask(entry.duration)
            }
          }
        })
        longTaskObserver.observe({ entryTypes: ["longtask"] })
      } catch {
        // Fallback handled via rAF delta detection
      }

      try {
        eventObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration >= 16) {
              useTelemetryStore.getState().recordInteraction(entry.duration)
            }
          }
        })
        eventObserver.observe({
          type: "event",
          buffered: false,
        } as PerformanceObserverInit)
      } catch {
        // Ignore if event timing API not supported
      }
    }

    return () => {
      window.cancelAnimationFrame(rafId)
      longTaskObserver?.disconnect()
      eventObserver?.disconnect()
    }
  }, [])

  const handleSwitchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return
    startLocaleTransition(async () => {
      await setUserLocale(nextLocale)
    })
  }

  // Resolve Breadcrumb Category
  let breadcrumbSection = isVi ? "Tất cả mẫu hiệu năng" : "All Patterns"
  if (pathname.startsWith("/labs/")) {
    const slug = pathname.replace("/labs/", "").split("/")[0]
    const activeLab = getLabBySlug(slug)
    if (activeLab) {
      breadcrumbSection =
        PILLAR_BREADCRUMB_NAMES[activeLab.pillarId]?.[locale] ??
        getPillarById(activeLab.pillarId)?.title[locale] ??
        "Performance"
    }
  } else if (pathname.startsWith("/foundations")) {
    breadcrumbSection = isVi ? "Event Loop & Pipeline" : "Foundations"
  }

  return (
    <header className="sticky top-0 z-30 h-12 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full max-w-[1350px] items-center justify-between gap-3">
        {/* Left: Pattern Garden Breadcrumb */}
        <div className="flex min-w-0 items-center gap-2 text-[13px]">
          <Link
            href="/"
            className="cursor-pointer truncate text-muted-foreground transition-colors hover:text-foreground"
          >
            Perf Lab
          </Link>
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
          <span className="truncate font-semibold text-foreground">
            {breadcrumbSection}
          </span>
        </div>

        {/* Right: Tagline + Compact Telemetry Pill + Device Theme Selector + EN | VI */}
        <div className="flex shrink-0 items-center gap-2.5">
          {/* Pattern Garden Signature Tagline */}
          <span className="hidden items-center gap-1.5 text-[12px] text-muted-foreground 2xl:inline-flex">
            <span className="size-1 rounded-full bg-primary" />
            <span>
              {isVi
                ? "Hiểu cơ chế. Theo dõi mã nguồn."
                : "Understand the pattern. Follow the code."}
            </span>
          </span>

          {/* Compact Telemetry Pill */}
          <div className="flex items-center divide-x divide-border rounded-lg border border-border bg-card px-1.5 py-1 font-mono text-[11px] tabular-nums">
            {/* FPS */}
            <div
              className="flex items-center gap-1.5 px-2"
              title={`FPS: ${fps} (Min: ${minFps})`}
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  fps < 30 || minFps < 25
                    ? "bg-rose-400"
                    : fps < 50
                      ? "bg-amber-400"
                      : "bg-primary"
                )}
              />
              <span className="font-semibold text-foreground">{fps} FPS</span>
            </div>

            {/* TBT */}
            <div
              className="hidden items-center gap-1 px-2 sm:flex"
              title={`Total Blocking Time: ${tbtMs}ms`}
            >
              <span className="text-muted-foreground">TBT</span>
              <span
                className={cn(
                  "font-semibold",
                  tbtMs > 100 ? "text-amber-400" : "text-foreground"
                )}
              >
                {tbtMs}ms
              </span>
            </div>

            {/* INP */}
            <div
              className="hidden items-center gap-1 px-2 md:flex"
              title={`Interaction to Next Paint: ${inpMs}ms`}
            >
              <span className="text-muted-foreground">INP</span>
              <span
                className={cn(
                  "font-semibold",
                  inpMs > 200 ? "text-amber-400" : "text-foreground"
                )}
              >
                {inpMs}ms
              </span>
            </div>

            {/* DOM & Heap */}
            <div className="hidden items-center gap-1 px-2 lg:flex">
              <span className="text-muted-foreground">DOM</span>
              <span className="font-semibold text-foreground">
                {domNodes.toLocaleString()}
              </span>
            </div>

            <div className="hidden items-center gap-1 px-2 xl:flex">
              <span className="text-muted-foreground">Heap</span>
              <span className="font-semibold text-foreground">
                {Math.round(heapMb)}MB
              </span>
            </div>

            {/* Renders */}
            <div className="hidden items-center gap-1 px-2 sm:flex">
              <span className="text-muted-foreground">Renders</span>
              <span className="font-semibold text-primary">{renderCount}</span>
            </div>

            {/* Quick HUD Actions */}
            <div className="flex items-center gap-1 pl-1.5">
              <button
                type="button"
                onClick={toggleRenderFlash}
                className={cn(
                  "cursor-pointer rounded p-0.5 transition-colors",
                  renderFlashEnabled
                    ? "text-primary hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title={t("renderFlash")}
                aria-label={t("renderFlash")}
              >
                <Eye className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={resetCounters}
                className="cursor-pointer rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                title={t("resetMetrics")}
                aria-label={t("resetMetrics")}
              >
                <RotateCcw className="size-3" />
              </button>
            </div>
          </div>

          {/* Dark / Light Icon Group Button */}
          <div
            className="inline-flex h-7.5 items-center rounded-lg border border-border bg-card p-0.5"
            role="group"
            aria-label="Theme mode"
          >
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={cn(
                "cursor-pointer rounded-md p-1 transition-colors",
                resolvedTheme === "light"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={isVi ? "Chế độ Sáng" : "Light mode"}
              aria-label={isVi ? "Chế độ Sáng" : "Light mode"}
            >
              <Sun className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={cn(
                "cursor-pointer rounded-md p-1 transition-colors",
                resolvedTheme === "dark"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title={isVi ? "Chế độ Tối" : "Dark mode"}
              aria-label={isVi ? "Chế độ Tối" : "Dark mode"}
            >
              <Moon className="size-3.5" />
            </button>
          </div>

          {/* Pattern Garden [EN | VI] Segmented Pill */}
          <div className="inline-flex h-7.5 items-center rounded-lg border border-border bg-card p-0.5 font-mono text-[11px]">
            <button
              type="button"
              disabled={isPendingLocale}
              onClick={() => handleSwitchLocale("en")}
              className={cn(
                "cursor-pointer rounded-md px-2 py-0.5 font-semibold transition-colors",
                locale === "en"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
            <button
              type="button"
              disabled={isPendingLocale}
              onClick={() => handleSwitchLocale("vi")}
              className={cn(
                "cursor-pointer rounded-md px-2 py-0.5 font-semibold transition-colors",
                locale === "vi"
                  ? "bg-primary/20 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              VI
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
