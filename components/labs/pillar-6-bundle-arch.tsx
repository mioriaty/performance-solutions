"use client"

import React, { useCallback, useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  MapPin,
  MessageSquare,
  RotateCw,
  Sparkles,
} from "lucide-react"
import { RenderBadge } from "@/components/hud/render-badge"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { LabSandboxProps } from "./pillar-1-rendering"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================================================
// LAB 6.1: CODE SPLITTING, DYNAMIC IMPORTS & PREFETCH ON INTENT
// ============================================================================

export function CodeSplittingPrefetchLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [chunkStatus, setChunkStatus] = useState<
    "eager-bundled" | "unloaded" | "preloading" | "warmed"
  >(mode === "bad" ? "eager-bundled" : "unloaded")
  const [studioOpen, setStudioOpen] = useState(false)
  const [openLatencyMs, setOpenLatencyMs] = useState(0)
  const initialBundleKb = mode === "bad" ? 428 : 42

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Dung lượng Initial JS Bundle" : "Initial JS Bundle",
        initialBundleKb,
        " KB",
        true
      )
  }, [initialBundleKb, locale])

  const handleHoverIntent = useCallback(() => {
    if (mode !== "good" || chunkStatus !== "unloaded") return
    setChunkStatus("preloading")
    window.setTimeout(() => {
      setChunkStatus("warmed")
    }, 90)
  }, [mode, chunkStatus])

  const handleOpenStudio = useCallback(() => {
    if (mode === "bad") {
      setStudioOpen(true)
      setOpenLatencyMs(12)
      return
    }
    if (chunkStatus === "warmed") {
      setStudioOpen(true)
      setOpenLatencyMs(0)
    } else {
      setChunkStatus("preloading")
      window.setTimeout(() => {
        setChunkStatus("warmed")
        setStudioOpen(true)
        setOpenLatencyMs(140)
      }, 140)
    }
  }, [mode, chunkStatus])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      if (mode === "bad") {
        useTelemetryStore.getState().recordLongTask(185)
        setStudioOpen(true)
        useTelemetryStore
          .getState()
          .captureSnapshot("code-splitting-prefetch", "bad", {
            fps: 28,
            minFps: 28,
            tbtMs: 135,
            inpMs: 95,
            longTasksCount: 2,
            customMetric: {
              label:
                locale === "vi"
                  ? "Dung lượng Initial JS Bundle"
                  : "Initial JS Bundle",
              value: 428,
              unit: " KB",
              lowerIsBetter: true,
            },
          })
      } else {
        setChunkStatus("warmed")
        setStudioOpen(true)
        setOpenLatencyMs(0)
        useTelemetryStore
          .getState()
          .captureSnapshot("code-splitting-prefetch", "good", {
            fps: 60,
            minFps: 60,
            tbtMs: 0,
            inpMs: 4,
            longTasksCount: 0,
            customMetric: {
              label:
                locale === "vi"
                  ? "Dung lượng Initial JS Bundle"
                  : "Initial JS Bundle",
              value: 42,
              unit: " KB",
              lowerIsBetter: true,
            },
          })
      }
    }, 20)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, mode, locale])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-bold",
              initialBundleKb > 200
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Initial Entry JS: {initialBundleKb} KB
          </span>
          <span>
            Async Studio Chunk (386 KB):{" "}
            <strong>{chunkStatus.toUpperCase()}</strong>
          </span>
          {studioOpen && (
            <span>
              Click-to-Open Latency: <strong>{openLatencyMs}ms</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            onMouseEnter={handleHoverIntent}
            onFocus={handleHoverIntent}
            onClick={handleOpenStudio}
            className="gap-1.5"
          >
            <Sparkles className="size-3.5" />
            <span>
              {mode === "good"
                ? "Hover to Preload • Click to Open Studio (0ms)"
                : "Open Eagerly Bundled Studio"}
            </span>
          </Button>
          <RenderBadge name="RouteShell" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-3.5 text-xs space-y-2">
          <div className="font-semibold">Bundle Breakdown Visualization</div>
          <div className="space-y-1.5 font-mono text-[11px]">
            <div className="flex items-center justify-between rounded bg-emerald-500/15 px-2.5 py-1.5 text-emerald-700 dark:text-emerald-300">
              <span>Core Route Shell (Critical LCP)</span>
              <span>42 KB</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-between rounded px-2.5 py-1.5",
                mode === "bad"
                  ? "bg-destructive/15 text-destructive"
                  : chunkStatus === "warmed"
                    ? "bg-primary/15 text-primary"
                    : "border border-dashed text-muted-foreground"
              )}
            >
              <span>
                Heavy 3D Telemetry Studio + Markdown Editor
                {mode === "good" && ` (${chunkStatus})`}
              </span>
              <span>386 KB</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-3.5 text-xs">
          {studioOpen ? (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <Cpu className="size-4 text-primary" />
                <span>
                  3D Telemetry Studio Mounted (Open Latency: {openLatencyMs}ms)
                </span>
              </div>
              <p className="text-muted-foreground">
                {mode === "good"
                  ? "Because onMouseEnter pre-warmed the dynamic import() chunk while your pointer approached the button, initial load saved 386KB and modal activation took 0ms."
                  : "In Baseline mode, all 386KB were bundled into the initial page load even for visitors who never open this modal."}
              </p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Hover over the trigger button above to watch chunk status
              transition from UNLOADED to WARMED prior to clicking.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LAB 6.2: BARREL FILES (INDEX.TS) & TREE-SHAKING TRAPS
// ============================================================================

const BARREL_MODULES = [
  { name: "Button.tsx (Used)", kb: 6, used: true, sideEffect: false },
  { name: "Badge.tsx (Used)", kb: 4, used: true, sideEffect: false },
  {
    name: "ChartEngine3D.ts (Side-Effect)",
    kb: 142,
    used: false,
    sideEffect: true,
  },
  {
    name: "PdfFontRegistry.ts (Side-Effect)",
    kb: 96,
    used: false,
    sideEffect: true,
  },
  {
    name: "LegacyPolyfills.ts (Side-Effect)",
    kb: 48,
    used: false,
    sideEffect: true,
  },
  {
    name: "175 Other Re-exported Barrel Files",
    kb: 22,
    used: false,
    sideEffect: false,
  },
]

export function BarrelFilesTreeshakingLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [evaluatedModules, setEvaluatedModules] = useState(
    mode === "bad" ? 180 : 2
  )
  const [bundledKb, setBundledKb] = useState(mode === "bad" ? 318 : 10)
  const [evalTimeMs, setEvalTimeMs] = useState(mode === "bad" ? 148 : 3)

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi"
          ? "Số Module bị nạp vào Graph"
          : "Modules Parsed in Graph",
        evaluatedModules,
        " modules",
        true
      )
  }, [evaluatedModules, locale])

  const runModuleGraphEvaluation = useCallback(() => {
    if (mode === "bad") {
      const t0 = performance.now()
      while (performance.now() - t0 < 140) {
        // Simulate parsing 180 barrel re-exports & running top-level side effects
      }
      const dt = Math.round(performance.now() - t0)
      setEvaluatedModules(180)
      setBundledKb(318)
      setEvalTimeMs(dt)
      useTelemetryStore.getState().recordLongTask(dt)
      useTelemetryStore
        .getState()
        .captureSnapshot("barrel-files-treeshaking", "bad", {
          fps: 26,
          minFps: 26,
          tbtMs: dt - 50,
          inpMs: dt,
          longTasksCount: 1,
          customMetric: {
            label:
              locale === "vi"
                ? "Số Module bị nạp vào Graph"
                : "Modules Parsed in Graph",
            value: 180,
            unit: " modules",
            lowerIsBetter: true,
          },
        })
    } else {
      setEvaluatedModules(2)
      setBundledKb(10)
      setEvalTimeMs(3)
      useTelemetryStore
        .getState()
        .captureSnapshot("barrel-files-treeshaking", "good", {
          fps: 60,
          minFps: 60,
          tbtMs: 0,
          inpMs: 4,
          longTasksCount: 0,
          customMetric: {
            label:
              locale === "vi"
                ? "Số Module bị nạp vào Graph"
                : "Modules Parsed in Graph",
            value: 2,
            unit: " modules",
            lowerIsBetter: true,
          },
        })
    }
  }, [mode, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      runModuleGraphEvaluation()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, runModuleGraphEvaluation])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            Modules Traversed: <strong>{evaluatedModules}</strong>
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-bold",
              bundledKb > 50
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Retained Bundle Output: {bundledKb} KB
          </span>
          <span>
            Parse & Eval Time: <strong>{evalTimeMs}ms</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="xs" onClick={runModuleGraphEvaluation}>
            {mode === "bad"
              ? "Import via Barrel '@/components/index.ts'"
              : "Import via Direct Subpaths"}
          </Button>
          <RenderBadge name="BundlerGraph" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {BARREL_MODULES.map((m) => {
          const included = mode === "bad" || m.used
          return (
            <div
              key={m.name}
              className={cn(
                "rounded-lg border p-3 font-mono text-xs transition-opacity",
                included
                  ? m.used
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                  : "border-dashed opacity-35"
              )}
            >
              <div className="flex items-center justify-between font-semibold">
                <span className="truncate">{m.name}</span>
                <span>{m.kb} KB</span>
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                {m.used ? (
                  <>
                    <CheckCircle2 className="size-3 shrink-0 text-emerald-500" />
                    <span>Explicitly Used by Page</span>
                  </>
                ) : included ? (
                  <>
                    <AlertTriangle className="size-3 shrink-0" />
                    <span>Pulled in by Barrel Top-Level Side-Effect</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3 shrink-0" />
                    <span>Tree-Shaken / Never Traversed (0 KB)</span>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================================
// LAB 6.3: THIRD-PARTY SCRIPTS & HEAVY WIDGET ISOLATION (FACADE PATTERN)
// ============================================================================

export function ThirdPartyIsolationLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [chatActivated, setChatActivated] = useState(mode === "bad")
  const [mapActivated, setMapActivated] = useState(mode === "bad")
  const [hydrationTbtMs, setHydrationTbtMs] = useState(
    mode === "bad" ? 420 : 0
  )

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi"
          ? "TBT do 3rd-Party lúc tải trang"
          : "3rd-Party Hydration TBT",
        hydrationTbtMs,
        "ms",
        true
      )
  }, [hydrationTbtMs, locale])

  const simulatePageHydration = useCallback(() => {
    if (mode === "bad") {
      const t0 = performance.now()
      while (performance.now() - t0 < 360) {
        // Blocking 3rd party evaluation
      }
      const blocked = Math.round(performance.now() - t0)
      setChatActivated(true)
      setMapActivated(true)
      setHydrationTbtMs(blocked)
      useTelemetryStore.getState().recordLongTask(blocked)
      useTelemetryStore
        .getState()
        .captureSnapshot("third-party-isolation", "bad", {
          fps: 11,
          minFps: 11,
          tbtMs: blocked - 50,
          inpMs: blocked,
          longTasksCount: 3,
          customMetric: {
            label:
              locale === "vi"
                ? "TBT do 3rd-Party lúc tải trang"
                : "3rd-Party Hydration TBT",
            value: blocked,
            unit: "ms",
            lowerIsBetter: true,
          },
        })
    } else {
      setChatActivated(false)
      setMapActivated(false)
      setHydrationTbtMs(0)
      useTelemetryStore
        .getState()
        .captureSnapshot("third-party-isolation", "good", {
          fps: 60,
          minFps: 60,
          tbtMs: 0,
          inpMs: 6,
          longTasksCount: 0,
          customMetric: {
            label:
              locale === "vi"
                ? "TBT do 3rd-Party lúc tải trang"
                : "3rd-Party Hydration TBT",
            value: 0,
            unit: "ms",
            lowerIsBetter: true,
          },
        })
    }
  }, [mode, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      simulatePageHydration()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, simulatePageHydration])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span
            className={cn(
              "rounded px-2 py-0.5 font-bold",
              hydrationTbtMs > 50
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Initial Hydration 3rd-Party TBT: {hydrationTbtMs}ms
          </span>
          <span>
            3rd-Party Payload on Load:{" "}
            <strong>
              {mode === "bad" ? "940 KB (Eager)" : "2 KB (HTML Facade)"}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="xs" onClick={simulatePageHydration} className="gap-1.5">
            <RotateCw className="size-3.5" />
            <span>Simulate Page Hydration</span>
          </Button>
          <RenderBadge name="ThirdPartyHost" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {/* Widget 1: Interactive Map Embed */}
        <div className="rounded-lg border bg-card p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span>Global Datacenter Vector Map (540 KB WebGL SDK)</span>
            <span className="font-mono text-[10px]">
              {mapActivated
                ? "LIVE SDK RUNNING"
                : "LIGHTWEIGHT FACADE (0KB JS)"}
            </span>
          </div>
          {mapActivated ? (
            <div className="flex h-28 flex-col items-center justify-center rounded-md border bg-muted/40 p-3 font-mono">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <MapPin className="size-4 text-primary" />
                <span>Interactive WebGL Vector Map SDK Active</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {mode === "bad"
                  ? "Booted eagerly during page load (+240ms Main-Thread TBT)"
                  : "Hydrated on-demand upon Facade interaction."}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setMapActivated(true)}
              className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 p-3 transition-colors hover:bg-muted/60"
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <MapPin className="size-4 text-muted-foreground" />
                <span>Static Map Preview Facade (0ms Hydration Cost)</span>
              </span>
              <span className="mt-1 text-[11px] text-primary underline">
                Click to hydrate Interactive WebGL Map on demand
              </span>
            </button>
          )}
        </div>

        {/* Widget 2: Customer Support Chat SDK */}
        <div className="rounded-lg border bg-card p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between font-semibold">
            <span>Customer Support Live Chat Widget (400 KB SDK)</span>
            <span className="font-mono text-[10px]">
              {chatActivated
                ? "LIVE SDK RUNNING"
                : "LIGHTWEIGHT FACADE (0KB JS)"}
            </span>
          </div>
          {chatActivated ? (
            <div className="flex h-28 flex-col items-center justify-center rounded-md border bg-muted/40 p-3 font-mono">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <MessageSquare className="size-4 text-primary" />
                <span>Live Support Chat Iframe & Socket Connected</span>
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                {mode === "bad"
                  ? "Booted eagerly on page load (+180ms Main-Thread TBT)"
                  : "Upgraded from static button facade in <15ms on click."}
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setChatActivated(true)}
              className="flex h-28 w-full cursor-pointer flex-col items-center justify-center rounded-md border border-dashed bg-muted/30 p-3 transition-colors hover:bg-muted/60"
            >
              <span className="flex items-center gap-2 font-semibold text-foreground">
                <MessageSquare className="size-4 text-muted-foreground" />
                <span>Lightweight CSS Chat Button Facade (0ms TBT)</span>
              </span>
              <span className="mt-1 text-[11px] text-primary underline">
                Click to connect Live Support SDK
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
