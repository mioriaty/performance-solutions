"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import {
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  RotateCw,
} from "lucide-react"
import { RenderBadge } from "@/components/hud/render-badge"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { LabSandboxProps } from "./pillar-1-rendering"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================================================
// LAB 4.1: REQUEST WATERFALLS VS PARALLEL FETCHING & STREAMING
// ============================================================================

interface WaterfallBar {
  step: string
  startMs: number
  endMs: number
  status: "idle" | "loading" | "done"
}

const STEPS = ["user", "team", "analytics", "audit"] as const

export function NetworkWaterfallsLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [stepDelay, setStepDelay] = useState(260)
  const [isFetching, setIsFetching] = useState(false)
  const [totalLoadMs, setTotalLoadMs] = useState(mode === "bad" ? 260 * 4 : 265)
  const [bars, setBars] = useState<WaterfallBar[]>([
    {
      step: "1. /api/perf?step=user",
      startMs: 0,
      endMs: 260,
      status: "done",
    },
    {
      step: "2. /api/perf?step=team",
      startMs: mode === "bad" ? 260 : 0,
      endMs: mode === "bad" ? 520 : 260,
      status: "done",
    },
    {
      step: "3. /api/perf?step=analytics",
      startMs: mode === "bad" ? 520 : 0,
      endMs: mode === "bad" ? 780 : 260,
      status: "done",
    },
    {
      step: "4. /api/perf?step=audit",
      startMs: mode === "bad" ? 780 : 0,
      endMs: mode === "bad" ? 1040 : 260,
      status: "done",
    },
  ])

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Tổng thời gian tải dữ liệu" : "Total Data Load Time",
        totalLoadMs,
        "ms",
        true
      )
  }, [totalLoadMs, locale])

  const runFetchFlow = useCallback(async () => {
    setIsFetching(true)
    const t0 = performance.now()

    if (mode === "bad") {
      // [Baseline]: Sequential Client Waterfall
      const nextBars: WaterfallBar[] = STEPS.map((s, idx) => ({
        step: `${idx + 1}. /api/perf?step=${s}`,
        startMs: 0,
        endMs: 0,
        status: "idle",
      }))
      setBars(nextBars)

      for (let i = 0; i < STEPS.length; i++) {
        const startRel = Math.round(performance.now() - t0)
        setBars((prev) =>
          prev.map((b, idx) =>
            idx === i ? { ...b, startMs: startRel, status: "loading" } : b
          )
        )
        await fetch(`/api/perf?step=${STEPS[i]}&delay=${stepDelay}`)
        const endRel = Math.round(performance.now() - t0)
        setBars((prev) =>
          prev.map((b, idx) =>
            idx === i ? { ...b, endMs: endRel, status: "done" } : b
          )
        )
      }

      const total = Math.round(performance.now() - t0)
      setTotalLoadMs(total)
      setIsFetching(false)
      useTelemetryStore
        .getState()
        .captureSnapshot("network-waterfalls", "bad", {
          fps: 60,
          minFps: 58,
          tbtMs: 0,
          inpMs: 24,
          customMetric: {
            label:
              locale === "vi"
                ? "Tổng thời gian tải dữ liệu"
                : "Total Data Load Time",
            value: total,
            unit: "ms",
            lowerIsBetter: true,
          },
        })
      return
    }

    // [Optimized]: Parallel Fetching (TanStack Query / Promise.all)
    setBars(
      STEPS.map((s, idx) => ({
        step: `${idx + 1}. /api/perf?step=${s}`,
        startMs: 0,
        endMs: 0,
        status: "loading",
      }))
    )

    await Promise.all(
      STEPS.map(async (step, idx) => {
        await fetch(`/api/perf?step=${step}&delay=${stepDelay}`)
        const endRel = Math.round(performance.now() - t0)
        setBars((prev) =>
          prev.map((b, i) =>
            i === idx ? { ...b, startMs: 0, endMs: endRel, status: "done" } : b
          )
        )
      })
    )

    const total = Math.round(performance.now() - t0)
    setTotalLoadMs(total)
    setIsFetching(false)
    useTelemetryStore.getState().captureSnapshot("network-waterfalls", "good", {
      fps: 60,
      minFps: 60,
      tbtMs: 0,
      inpMs: 10,
      customMetric: {
        label:
          locale === "vi"
            ? "Tổng thời gian tải dữ liệu"
            : "Total Data Load Time",
        value: total,
        unit: "ms",
        lowerIsBetter: true,
      },
    })
  }, [mode, stepDelay, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      void runFetchFlow()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, runFetchFlow])

  const maxScaleMs = Math.max(stepDelay * 4.2, totalLoadMs, 800)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            Per-Endpoint Latency: <strong>{stepDelay}ms</strong>
          </span>
          <input
            type="range"
            min={120}
            max={400}
            step={20}
            value={stepDelay}
            onChange={(e) => setStepDelay(Number(e.target.value))}
            className="w-28"
          />
          <span
            className={cn(
              "rounded px-2 py-0.5 font-bold",
              totalLoadMs > stepDelay * 2
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Total Waterfall Time: {totalLoadMs}ms
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            onClick={() => void runFetchFlow()}
            disabled={isFetching}
          >
            {isFetching
              ? "Fetching 4 Endpoints..."
              : mode === "bad"
                ? "Run Sequential Waterfall (4x Latency)"
                : "Run Parallel Queries (1x Latency)"}
          </Button>
          <RenderBadge name="NetworkOrchestrator" />
        </div>
      </div>

      <div className="space-y-2.5 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>Network Request Gantt Chart</span>
          <span>Scale: 0ms → {Math.round(maxScaleMs)}ms</span>
        </div>

        {bars.map((bar) => {
          const leftPct = Math.min(95, (bar.startMs / maxScaleMs) * 100)
          const widthPct = Math.max(
            4,
            Math.min(
              100 - leftPct,
              ((bar.endMs - bar.startMs) / maxScaleMs) * 100
            )
          )
          return (
            <div key={bar.step} className="space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span>{bar.step}</span>
                <span>
                  {bar.status === "done"
                    ? `${bar.startMs}ms → ${bar.endMs}ms (${bar.endMs - bar.startMs}ms)`
                    : bar.status === "loading"
                      ? "In-flight..."
                      : "Waiting on parent..."}
                </span>
              </div>
              <div className="relative h-5 w-full overflow-hidden rounded bg-muted">
                {bar.status !== "idle" && (
                  <div
                    style={{
                      left: `${leftPct}%`,
                      width: bar.status === "loading" ? "22%" : `${widthPct}%`,
                    }}
                    className={cn(
                      "absolute top-0.5 bottom-0.5 rounded transition-all",
                      bar.status === "loading"
                        ? "animate-pulse bg-amber-500"
                        : mode === "bad"
                          ? "bg-destructive/80"
                          : "bg-emerald-500"
                    )}
                  />
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
// LAB 4.2: LAYOUT SHIFTS (CLS) & DIMENSION RESERVATION
// ============================================================================

export function ClsLayoutShiftsLab({ mode, stressTrigger }: LabSandboxProps) {
  const [bannerLoaded, setBannerLoaded] = useState(true)
  const [heroLoaded, setHeroLoaded] = useState(true)
  const [clsScore, setClsScore] = useState(mode === "bad" ? 0.34 : 0.0)
  const [clickedAction, setClickedAction] = useState<string | null>(null)

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric("Cumulative Layout Shift (CLS)", clsScore, "", true)
  }, [clsScore])

  const simulateAsyncLoad = useCallback(() => {
    setBannerLoaded(false)
    setHeroLoaded(false)
    setClickedAction(null)
    setClsScore(0)

    window.setTimeout(() => {
      setBannerLoaded(true)
      if (mode === "bad") {
        setClsScore(0.14)
      }
    }, 240)

    window.setTimeout(() => {
      setHeroLoaded(true)
      const finalCls = mode === "bad" ? 0.34 : 0.0
      setClsScore(finalCls)
      useTelemetryStore.getState().captureSnapshot("cls-layout-shifts", mode, {
        fps: 60,
        minFps: 58,
        tbtMs: 0,
        inpMs: 8,
        customMetric: {
          label: "Cumulative Layout Shift (CLS)",
          value: finalCls,
          unit: "",
          lowerIsBetter: true,
        },
      })
    }, 520)
  }, [mode])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      simulateAsyncLoad()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, simulateAsyncLoad])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex items-center gap-3 font-mono">
          <span
            className={cn(
              "rounded px-2.5 py-1 font-bold",
              clsScore > 0.1
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Measured CLS Score: {clsScore.toFixed(3)}{" "}
            {clsScore > 0.25 ? "(POOR > 0.25)" : "(GOOD = 0.000)"}
          </span>
          {clickedAction && (
            <span className="font-semibold text-primary">
              Clicked: {clickedAction}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button size="xs" onClick={simulateAsyncLoad} className="gap-1.5">
            <RotateCw className="size-3.5" />
            <span>Replay Async Page Load</span>
          </Button>
          <RenderBadge name="CheckoutViewport" />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        {/* 1. Dynamic Promo Banner Slot */}
        {mode === "bad" ? (
          bannerLoaded && (
            <div className="flex h-12 items-center justify-between rounded-md border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-medium text-amber-700 dark:text-amber-300">
              <span className="flex items-center gap-2">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>
                  Late-Injected Promo Banner (Shifted content down by 48px)
                </span>
              </span>
              <span className="font-mono text-[10px]">+0.140 CLS</span>
            </div>
          )
        ) : (
          <div className="h-12 w-full overflow-hidden rounded-md">
            {bannerLoaded ? (
              <div className="flex h-full items-center justify-between border border-emerald-500/30 bg-emerald-500/10 px-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0" />
                  <span>Pre-Reserved 48px Promo Slot (Zero Layout Shift)</span>
                </span>
                <span className="font-mono text-[10px]">+0.000 CLS</span>
              </div>
            ) : (
              <div className="h-full w-full animate-pulse bg-muted" />
            )}
          </div>
        )}

        {/* 2. Hero Media Slot */}
        {mode === "bad" ? (
          heroLoaded && (
            <div className="flex h-28 items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 font-mono text-xs text-destructive">
              <ImageIcon className="size-4 shrink-0" />
              <span>
                Unsized Async Hero Banner Loaded at 520ms (Shifted layout down
                by 112px • +0.200 CLS)
              </span>
            </div>
          )
        ) : (
          <div className="h-28 w-full overflow-hidden rounded-md border">
            {heroLoaded ? (
              <div className="flex h-full items-center justify-center gap-2 bg-muted/40 px-3 font-mono text-xs text-foreground">
                <ImageIcon className="size-4 shrink-0 text-primary" />
                <span>
                  Aspect-Ratio & Height Reserved Container (0px Shift on Load)
                </span>
              </div>
            ) : (
              <div className="flex h-full w-full animate-pulse items-center justify-center bg-muted text-xs text-muted-foreground">
                Dimension-Matched Skeleton Placeholder (112px height
                reserved)...
              </div>
            )}
          </div>
        )}

        {/* 3. Interactive Checkout Buttons */}
        <div className="flex items-center justify-between rounded-md border bg-muted/40 p-3">
          <div className="text-xs">
            <div className="font-semibold">Production Cloud Cluster Order</div>
            <div className="text-muted-foreground">
              {mode === "bad"
                ? "Notice how these action buttons shift down twice during page load."
                : "Action buttons remain anchored at the exact same Y-coordinate throughout load."}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="outline"
              onClick={() => setClickedAction("Cancel Order")}
            >
              Cancel Order
            </Button>
            <Button
              size="xs"
              variant="destructive"
              onClick={() => setClickedAction("Confirm $999 Charge")}
            >
              Confirm $999 Charge
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LAB 4.3: REQUEST DEDUPLICATION, SWR & OPTIMISTIC UI (@tanstack/react-query)
// ============================================================================

export function DedupOptimisticUiLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const queryClient = useQueryClient()
  const [networkHttpCalls, setNetworkHttpCalls] = useState(
    mode === "bad" ? 6 : 1
  )
  const [perceivedMutationMs, setPerceivedMutationMs] = useState(
    mode === "bad" ? 640 : 0
  )
  const [simulateServerFail, setSimulateServerFail] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [featureFlags, setFeatureFlags] = useState([
    { id: "edge-cache", name: "Global Edge SWR Cache", enabled: true },
    { id: "react-compiler", name: "React 19 Auto-Memoization", enabled: false },
    { id: "worker-offload", name: "Web Worker Aggregation", enabled: true },
  ])

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi"
          ? "Số HTTP Request cho 6 Widgets"
          : "HTTP Calls for 6 Widgets",
        networkHttpCalls,
        " calls",
        true
      )
  }, [networkHttpCalls, locale])

  const simulateMountSixWidgets = useCallback(async () => {
    setStatusMessage("Mounting 6 independent metric widgets simultaneously...")
    if (mode === "bad") {
      // [Baseline]: 6 widgets each call fetch() inside their own useEffect without deduplication
      await Promise.all(
        Array.from({ length: 6 }, (_, i) =>
          fetch(`/api/perf?step=widget-${i}&delay=180`)
        )
      )
      setNetworkHttpCalls(6)
      setStatusMessage(
        "[Baseline]: 6 mounted widgets dispatched 6 separate HTTP requests to the server."
      )
      useTelemetryStore
        .getState()
        .captureSnapshot("dedup-optimistic-ui", "bad", {
          fps: 60,
          minFps: 58,
          tbtMs: 0,
          inpMs: 640,
          customMetric: {
            label:
              locale === "vi"
                ? "Số HTTP Request cho 6 Widgets"
                : "HTTP Calls for 6 Widgets",
            value: 6,
            unit: " calls",
            lowerIsBetter: true,
          },
        })
    } else {
      // [Optimized]: TanStack Query deduplicates 6 concurrent fetchQuery calls sharing the same queryKey into 1 HTTP call
      let actualNetworkCount = 0
      await queryClient.invalidateQueries({ queryKey: ["shared-quota-dedup"] })
      await Promise.all(
        Array.from({ length: 6 }, () =>
          queryClient.fetchQuery({
            queryKey: ["shared-quota-dedup"],
            queryFn: async () => {
              actualNetworkCount += 1
              const res = await fetch("/api/perf?step=quota&delay=180")
              return res.json()
            },
            staleTime: 10_000,
          })
        )
      )
      const recordedCalls = Math.max(1, actualNetworkCount)
      setNetworkHttpCalls(recordedCalls)
      setStatusMessage(
        `[Optimized]: 6 widgets requested ['shared-quota-dedup'] concurrently — TanStack Query deduplicated into ${recordedCalls} HTTP call.`
      )
      useTelemetryStore
        .getState()
        .captureSnapshot("dedup-optimistic-ui", "good", {
          fps: 60,
          minFps: 60,
          tbtMs: 0,
          inpMs: 4,
          customMetric: {
            label:
              locale === "vi"
                ? "Số HTTP Request cho 6 Widgets"
                : "HTTP Calls for 6 Widgets",
            value: recordedCalls,
            unit: " call",
            lowerIsBetter: true,
          },
        })
    }
  }, [mode, queryClient, locale])

  const handleToggleFlag = useCallback(
    async (id: string) => {
      const snapshot = [...featureFlags]

      if (mode === "good") {
        // [Optimized]: 0ms perceived UI latency
        setFeatureFlags((prev) =>
          prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
        )
        setPerceivedMutationMs(0)
        setStatusMessage(
          "[Optimized]: Optimistic UI applied in 0ms. Synchronizing with server in background..."
        )

        const res = await fetch("/api/perf", {
          method: "POST",
          body: JSON.stringify({
            id,
            delay: 550,
            shouldFail: simulateServerFail,
          }),
        })

        if (!res.ok) {
          // Automatic rollback on server failure
          setFeatureFlags(snapshot)
          setStatusMessage(
            "[Rollback]: Server returned 503 — Optimistic state safely restored to previous snapshot."
          )
        } else {
          setStatusMessage("[Confirmed]: Server committed optimistic mutation.")
        }
        return
      }

      // [Baseline]: Pessimistic UI waits for full 550ms server round-trip before updating toggle
      setStatusMessage(
        "[Pending]: Waiting 550ms for server response before updating UI..."
      )
      const res = await fetch("/api/perf", {
        method: "POST",
        body: JSON.stringify({
          id,
          delay: 550,
          shouldFail: simulateServerFail,
        }),
      })
      const elapsed = 560
      setPerceivedMutationMs(elapsed)
      useTelemetryStore.getState().recordInteraction(elapsed)

      if (res.ok) {
        setFeatureFlags((prev) =>
          prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f))
        )
        setStatusMessage(
          `[Baseline]: UI updated after ${elapsed}ms synchronous round-trip wait.`
        )
      } else {
        setStatusMessage("[Error]: Server returned 503 Error.")
      }
    },
    [featureFlags, mode, simulateServerFail]
  )

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      void simulateMountSixWidgets()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, simulateMountSixWidgets])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            6 Widgets Network Hits: <strong>{networkHttpCalls} HTTP</strong>
          </span>
          <span>
            Perceived Toggle Latency: <strong>{perceivedMutationMs}ms</strong>
          </span>
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={simulateServerFail}
              onChange={(e) => setSimulateServerFail(e.target.checked)}
            />
            <span>Simulate 503 Error (Test Rollback)</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <Button size="xs" onClick={() => void simulateMountSixWidgets()}>
            Mount 6 Widgets & Measure Deduplication
          </Button>
          <RenderBadge name="QueryCoordinator" />
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 font-mono text-xs">
          {statusMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {featureFlags.map((flag) => (
          <div
            key={flag.id}
            className="flex items-center justify-between rounded-lg border bg-card p-3 text-xs"
          >
            <div>
              <div className="font-semibold">{flag.name}</div>
              <div className="font-mono text-[10px] text-muted-foreground">
                Status: {flag.enabled ? "ENABLED" : "DISABLED"}
              </div>
            </div>
            <Button
              size="xs"
              variant={flag.enabled ? "default" : "outline"}
              onClick={() => void handleToggleFlag(flag.id)}
            >
              {flag.enabled ? "ON" : "OFF"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
