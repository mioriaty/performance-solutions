"use client"

import { useEffect, useTransition } from "react"
import { useLocale, useTranslations } from "next-intl"
import { Eye, Moon, RotateCcw, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useTelemetryStore } from "@/lib/telemetry/store"
import { setUserLocale } from "@/i18n/actions"
import type { Locale } from "@/i18n/request"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
  }
}

export function PerformanceHud() {
  const t = useTranslations("hud")
  const locale = useLocale() as Locale
  const { resolvedTheme, setTheme } = useTheme()
  const [isPendingLocale, startLocaleTransition] = useTransition()

  const fps = useTelemetryStore((s) => s.fps)
  const minFps = useTelemetryStore((s) => s.minFps)
  const fpsHistory = useTelemetryStore((s) => s.fpsHistory)
  const longTasksCount = useTelemetryStore((s) => s.longTasksCount)
  const tbtMs = useTelemetryStore((s) => s.tbtMs)
  const inpMs = useTelemetryStore((s) => s.inpMs)
  const domNodes = useTelemetryStore((s) => s.domNodes)
  const heapMb = useTelemetryStore((s) => s.heapMb)
  const renderCount = useTelemetryStore((s) => s.renderCount)
  const renderFlashEnabled = useTelemetryStore((s) => s.renderFlashEnabled)
  const customMetric = useTelemetryStore((s) => s.customMetric)
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
        const baseHeapMb = perfMem
          ? perfMem.usedJSHeapSize / (1024 * 1024)
          : 24

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

  const sparklinePoints = fpsHistory
    .map((val, idx) => {
      const x = (idx / Math.max(1, fpsHistory.length - 1)) * 48
      const y = 16 - (Math.min(60, Math.max(0, val)) / 60) * 14
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(" ")

  const handleSwitchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return
    startLocaleTransition(async () => {
      await setUserLocale(nextLocale)
    })
  }

  return (
    <header className="sticky top-0 z-30 h-11 border-b bg-background/90 px-3 backdrop-blur-md sm:px-4">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-2 overflow-hidden">
        {/* Compact Single-Line Telemetry Strip (Zero-Wrap, Tabular Numbers) */}
        <div className="flex min-w-0 items-center divide-x overflow-x-auto rounded-md border bg-muted/40 px-1 py-1 font-mono text-[11.5px] tabular-nums whitespace-nowrap scrollbar-none">
          {/* FPS */}
          <div
            className="flex items-center gap-1.5 px-2"
            title={`FPS: ${fps} (Min: ${minFps})`}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                fps < 30 || minFps < 25
                  ? "bg-rose-500"
                  : fps < 50
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              )}
            />
            <span className="inline-block min-w-[6ch] font-semibold text-foreground">
              {fps} FPS
            </span>
            <svg
              className="hidden h-3.5 w-8 shrink-0 overflow-visible text-primary xl:block"
              viewBox="0 0 48 18"
            >
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                points={sparklinePoints}
              />
            </svg>
          </div>

          {/* TBT */}
          <div
            className="flex items-center gap-1 px-2"
            title={`Total Blocking Time: ${tbtMs}ms (${longTasksCount} Long Tasks)`}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                tbtMs > 100
                  ? "bg-rose-500"
                  : tbtMs > 0
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              )}
            />
            <span className="text-muted-foreground">TBT</span>
            <span
              className={cn(
                "inline-block min-w-[5ch] text-right font-semibold",
                tbtMs > 100 ? "text-rose-500" : "text-foreground"
              )}
            >
              {tbtMs}ms
            </span>
          </div>

          {/* INP */}
          <div
            className="flex items-center gap-1 px-2"
            title={`Interaction to Next Paint: ${inpMs}ms`}
          >
            <span
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                inpMs > 200
                  ? "bg-rose-500"
                  : inpMs > 75
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              )}
            />
            <span className="text-muted-foreground">INP</span>
            <span
              className={cn(
                "inline-block min-w-[5ch] text-right font-semibold",
                inpMs > 200 ? "text-rose-500" : "text-foreground"
              )}
            >
              {inpMs}ms
            </span>
          </div>

          {/* DOM Nodes */}
          <div className="hidden items-center gap-1 px-2 sm:flex">
            <span className="text-muted-foreground">DOM</span>
            <span
              className={cn(
                "inline-block min-w-[5ch] text-right font-semibold",
                domNodes > 2500 ? "text-rose-500" : "text-foreground"
              )}
            >
              {domNodes.toLocaleString()}
            </span>
          </div>

          {/* Memory (Rounded integer to prevent 53MB <-> 53.1MB width jitter) */}
          <div className="hidden items-center gap-1 px-2 md:flex">
            <span className="text-muted-foreground">Heap</span>
            <span
              className={cn(
                "inline-block min-w-[5ch] text-right font-semibold",
                heapMb > 55 ? "text-rose-500" : "text-foreground"
              )}
            >
              {Math.round(heapMb)}MB
            </span>
          </div>

          {/* Renders */}
          <div className="flex items-center gap-1 px-2">
            <span className="text-muted-foreground">Renders</span>
            <span className="inline-block min-w-[4ch] text-right font-semibold text-primary">
              {renderCount}
            </span>
          </div>

          {/* Lab Custom Metric (Only on wide viewports, truncated label) */}
          {customMetric && (
            <div
              className="hidden items-center gap-1.5 px-2 text-primary 2xl:flex"
              title={`${customMetric.label}: ${customMetric.value}${customMetric.unit}`}
            >
              <span className="max-w-[130px] truncate text-muted-foreground">
                {customMetric.label}:
              </span>
              <span className="inline-block min-w-[5ch] text-right font-semibold">
                {customMetric.value}
                {customMetric.unit}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls: Never shrink, ultra-compact */}
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            variant={renderFlashEnabled ? "secondary" : "outline"}
            size="xs"
            onClick={toggleRenderFlash}
            className="cursor-pointer font-sans text-xs px-2"
            title={t("renderFlash")}
          >
            <Eye
              className={cn(
                "size-3.5",
                renderFlashEnabled ? "text-primary" : "text-muted-foreground"
              )}
            />
            <span className="hidden xl:inline">{t("renderFlash")}</span>
          </Button>

          <Button
            variant="outline"
            size="icon-xs"
            onClick={resetCounters}
            className="cursor-pointer"
            title={t("resetMetrics")}
            aria-label={t("resetMetrics")}
          >
            <RotateCcw className="size-3.5" />
          </Button>

          <div className="flex items-center rounded-md border bg-muted/40 p-0.5 font-mono text-[11px]">
            <button
              type="button"
              disabled={isPendingLocale}
              onClick={() => handleSwitchLocale("vi")}
              className={cn(
                "cursor-pointer rounded px-1.5 py-0.5 font-medium transition-colors",
                locale === "vi"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              VI
            </button>
            <button
              type="button"
              disabled={isPendingLocale}
              onClick={() => handleSwitchLocale("en")}
              className={cn(
                "cursor-pointer rounded px-1.5 py-0.5 font-medium transition-colors",
                locale === "en"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              EN
            </button>
          </div>

          <Button
            variant="outline"
            size="icon-xs"
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="cursor-pointer"
            aria-label="Toggle theme"
          >
            <Sun className="hidden size-3.5 dark:block" />
            <Moon className="block size-3.5 dark:hidden" />
          </Button>
        </div>
      </div>
    </header>
  )
}
