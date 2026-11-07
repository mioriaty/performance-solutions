"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { MousePointerClick } from "lucide-react"
import { RenderBadge } from "@/components/hud/render-badge"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { LabSandboxProps } from "./pillar-1-rendering"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function LivePendulum() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId = 0
    const animate = (now: number) => {
      if (dotRef.current) {
        const pct = (Math.sin(now / 240) + 1) * 50
        dotRef.current.style.transform = `translateX(${pct * 1.8}px)`
      }
      rafId = window.requestAnimationFrame(animate)
    }
    rafId = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(rafId)
  }, [])

  return (
    <div className="flex items-center gap-3 rounded-md border bg-background px-3 py-1.5 text-xs">
      <span className="font-mono text-[11px] text-muted-foreground">
        60FPS Heartbeat:
      </span>
      <div className="relative h-3 w-48 overflow-hidden rounded-full bg-muted">
        <div
          ref={dotRef}
          className="h-3 w-4 rounded-full bg-primary shadow-sm"
        />
      </div>
    </div>
  )
}

async function yieldToMainThread() {
  const g = globalThis as unknown as {
    scheduler?: { yield?: () => Promise<void> }
  }
  if (g.scheduler?.yield) {
    return g.scheduler.yield()
  }
  return new Promise<void>((resolve) => window.setTimeout(resolve, 0))
}

// ============================================================================
// LAB 2.1: LONG TASKS & COOPERATIVE MAIN-THREAD YIELDING
// ============================================================================

export function LongTasksYieldingLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [progress, setProgress] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [clickCount, setClickCount] = useState(0)
  const [maxTaskDuration, setMaxTaskDuration] = useState(
    mode === "bad" ? 390 : 9
  )
  const [summaryScore, setSummaryScore] = useState<number | null>(null)

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Độ dài Task Lớn nhất" : "Max Single Task",
        maxTaskDuration,
        "ms",
        true
      )
  }, [maxTaskDuration, locale])

  const runBatchJob = useCallback(async () => {
    setIsRunning(true)
    setProgress(0)
    const totalItems = 30_000

    if (mode === "bad") {
      const t0 = performance.now()
      let acc = 0
      // Synchronous monolithic Long Task (~380ms)
      while (performance.now() - t0 < 380) {
        for (let i = 0; i < 4000; i++) {
          acc += Math.sqrt(i * 17.3) % 7
        }
      }
      const duration = Math.round(performance.now() - t0)
      setSummaryScore(Math.round(acc))
      setProgress(100)
      setMaxTaskDuration(duration)
      setIsRunning(false)

      useTelemetryStore.getState().recordLongTask(duration)
      useTelemetryStore.getState().recordInteraction(duration)
      useTelemetryStore
        .getState()
        .captureSnapshot("long-tasks-yielding", "bad", {
          fps: 9,
          minFps: 9,
          longTasksCount: 1,
          tbtMs: duration - 50,
          inpMs: duration,
          customMetric: {
            label: locale === "vi" ? "Độ dài Task Lớn nhất" : "Max Single Task",
            value: duration,
            unit: "ms",
            lowerIsBetter: true,
          },
        })
      return
    }

    // GOOD Mode: Cooperative Time-Slicing yielding every ~9ms
    let acc = 0
    let sliceStart = performance.now()
    let worstSlice = 8

    for (let i = 1; i <= totalItems; i++) {
      acc += Math.sqrt(i * 17.3) % 7
      // Burn tiny work per item
      for (let k = 0; k < 45; k++) {
        acc += (k & 3) * 0.001
      }

      const elapsedSlice = performance.now() - sliceStart
      if (elapsedSlice >= 9) {
        worstSlice = Math.max(worstSlice, Math.round(elapsedSlice))
        setProgress(Math.round((i / totalItems) * 100))
        await yieldToMainThread()
        sliceStart = performance.now()
      }
    }

    setSummaryScore(Math.round(acc))
    setProgress(100)
    setMaxTaskDuration(worstSlice)
    setIsRunning(false)

    useTelemetryStore
      .getState()
      .captureSnapshot("long-tasks-yielding", "good", {
        fps: 60,
        minFps: 59,
        longTasksCount: 0,
        tbtMs: 0,
        inpMs: 10,
        customMetric: {
          label: locale === "vi" ? "Độ dài Task Lớn nhất" : "Max Single Task",
          value: worstSlice,
          unit: "ms",
          lowerIsBetter: true,
        },
      })
  }, [mode, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      void runBatchJob()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, runBatchJob])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
        <LivePendulum />

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => void runBatchJob()}
            disabled={isRunning}
          >
            {isRunning
              ? `Processing (${progress}%)...`
              : mode === "bad"
                ? "Run 30,000 Items (Sync Block)"
                : "Run 30,000 Items (scheduler.yield)"}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setClickCount((c) => c + 1)}
            className="gap-1.5"
          >
            <MousePointerClick className="size-3.5" />
            <span>Test Input While Running ({clickCount})</span>
          </Button>
          <RenderBadge name="BatchRunner" />
        </div>
      </div>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <span>
            Batch Progress: <strong>{progress}%</strong>
            {summaryScore !== null && ` • Checksum: #${summaryScore}`}
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-semibold",
              maxTaskDuration > 50
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Max Task Slice: {maxTaskDuration}ms{" "}
            {maxTaskDuration > 50 ? "(>50ms Long Task)" : "(<50ms Target)"}
          </span>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LAB 2.2: WEB WORKERS OFFLOADING (Off-Main-Thread Compute)
// ============================================================================

export function WebWorkersOffloadLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [isComputing, setIsComputing] = useState(false)
  const [mainThreadBlockedMs, setMainThreadBlockedMs] = useState(
    mode === "bad" ? 410 : 1
  )
  const [result, setResult] = useState<{
    p50: string
    p95: string
    p99: string
    samples: number
    thread: string
  } | null>(null)

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Thời gian khóa Main Thread" : "Main-Thread Freeze",
        mainThreadBlockedMs,
        "ms",
        true
      )
  }, [mainThreadBlockedMs, locale])

  const executeSimulation = useCallback(() => {
    setIsComputing(true)
    const sampleCount = 240_000

    if (mode === "bad") {
      const t0 = performance.now()
      // Execute directly on UI Main Thread (~410ms block)
      const values = new Float64Array(sampleCount)
      for (let i = 0; i < sampleCount; i++) {
        values[i] =
          Math.sin(i * 0.017) * 100 +
          Math.cos(i * 0.0031) * 45 +
          Math.sqrt((i % 1000) + 1)
      }
      values.sort()
      // Ensure realistic 380ms+ CPU bound time across ultra-fast M-series chips
      while (performance.now() - t0 < 380) {
        // CPU bound simulation
      }
      const blockedMs = Math.round(performance.now() - t0)
      setMainThreadBlockedMs(blockedMs)
      setResult({
        p50: values[Math.floor(sampleCount * 0.5)].toFixed(2),
        p95: values[Math.floor(sampleCount * 0.95)].toFixed(2),
        p99: values[Math.floor(sampleCount * 0.99)].toFixed(2),
        samples: sampleCount,
        thread: "UI Main Thread (Blocked!)",
      })
      setIsComputing(false)

      useTelemetryStore.getState().recordLongTask(blockedMs)
      useTelemetryStore.getState().recordInteraction(blockedMs)
      useTelemetryStore
        .getState()
        .captureSnapshot("web-workers-offload", "bad", {
          fps: 8,
          minFps: 8,
          longTasksCount: 1,
          tbtMs: blockedMs - 50,
          inpMs: blockedMs,
          customMetric: {
            label:
              locale === "vi"
                ? "Thời gian khóa Main Thread"
                : "Main-Thread Freeze",
            value: blockedMs,
            unit: "ms",
            lowerIsBetter: true,
          },
        })
      return
    }

    // GOOD Mode: Real Inline Web Worker running on a separate OS CPU Thread!
    const tDispatch = performance.now()
    const workerCode = `
      self.onmessage = function(e) {
        const count = e.data.sampleCount;
        const values = new Float64Array(count);
        for (let i = 0; i < count; i++) {
          values[i] = Math.sin(i * 0.017) * 100 + Math.cos(i * 0.0031) * 45 + Math.sqrt((i % 1000) + 1);
        }
        values.sort();
        self.postMessage({
          p50: values[Math.floor(count * 0.5)].toFixed(2),
          p95: values[Math.floor(count * 0.95)].toFixed(2),
          p99: values[Math.floor(count * 0.99)].toFixed(2),
          samples: count,
          thread: "Dedicated Web Worker OS Thread (0ms UI Block)"
        });
      };
    `
    const blob = new Blob([workerCode], { type: "application/javascript" })
    const url = URL.createObjectURL(blob)
    const worker = new Worker(url)

    worker.onmessage = (e) => {
      setResult(e.data)
      setIsComputing(false)
      worker.terminate()
      URL.revokeObjectURL(url)

      useTelemetryStore
        .getState()
        .captureSnapshot("web-workers-offload", "good", {
          fps: 60,
          minFps: 60,
          longTasksCount: 0,
          tbtMs: 0,
          inpMs: 6,
          customMetric: {
            label:
              locale === "vi"
                ? "Thời gian khóa Main Thread"
                : "Main-Thread Freeze",
            value: 1,
            unit: "ms",
            lowerIsBetter: true,
          },
        })
    }

    worker.postMessage({ sampleCount })
    const dispatchCost = Math.max(1, Math.round(performance.now() - tDispatch))
    setMainThreadBlockedMs(dispatchCost)
  }, [mode, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      executeSimulation()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, executeSimulation])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
        <LivePendulum />

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={executeSimulation} disabled={isComputing}>
            {isComputing
              ? "Computing 240k Samples..."
              : mode === "bad"
                ? "Run 240k Monte Carlo on Main Thread"
                : "Run 240k Monte Carlo in Web Worker"}
          </Button>
          <RenderBadge name="MonteCarloEngine" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <div className="rounded-lg border bg-card p-3">
          <div className="text-[11px] text-muted-foreground">
            Execution Thread
          </div>
          <div className="mt-1 font-mono text-xs font-semibold">
            {result?.thread ??
              (mode === "bad" ? "UI Main Thread" : "Web Worker Thread")}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-[11px] text-muted-foreground">
            Main-Thread Blocked Time
          </div>
          <div
            className={cn(
              "mt-1 font-mono text-sm font-bold",
              mainThreadBlockedMs > 50
                ? "text-destructive"
                : "text-emerald-600 dark:text-emerald-400"
            )}
          >
            {mainThreadBlockedMs}ms
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-[11px] text-muted-foreground">P50 / P95 VaR</div>
          <div className="mt-1 font-mono text-xs font-semibold">
            {result ? `${result.p50} / ${result.p95}` : "18.42 / 141.80"}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3">
          <div className="text-[11px] text-muted-foreground">
            P99 Tail Risk (240k sorted)
          </div>
          <div className="mt-1 font-mono text-xs font-semibold">
            {result ? result.p99 : "164.25"}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LAB 2.3: LAYOUT THRASHING & FORCED SYNCHRONOUS LAYOUT
// ============================================================================

const BAR_COUNT = 160

export function LayoutThrashingLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [frameCostMs, setFrameCostMs] = useState(mode === "bad" ? 42 : 1.2)
  const [forcedReflows, setForcedReflows] = useState(
    mode === "bad" ? BAR_COUNT : 0
  )

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi"
          ? "Số lần Forced Reflow / Frame"
          : "Forced Reflows / Frame",
        forcedReflows,
        "x",
        true
      )
  }, [forcedReflows, locale])

  const stepVisualizerFrame = useCallback(
    (phaseSeed = performance.now()) => {
      const container = containerRef.current
      if (!container) return
      const bars = Array.from(container.children) as HTMLElement[]
      const t0 = performance.now()

      if (mode === "bad") {
        // [Baseline]: Interleaved DOM Read + DOM Write inside loop forces synchronous reflow on every iteration
        for (let i = 0; i < bars.length; i++) {
          const bar = bars[i]
          // 1. READ geometry after previous iteration dirtying layout
          const rect = bar.getBoundingClientRect()
          const nextH =
            20 +
            Math.abs(
              Math.sin(phaseSeed / 200 + i * 0.15 + rect.width * 0.001)
            ) *
              95
          // 2. WRITE layout property (`height` + `marginTop`) invalidates layout tree
          bar.style.height = `${nextH.toFixed(1)}px`
          bar.style.transform = "none"
        }
        // Simulate accumulated multi-pass layout thrashing penalty on huge DOM trees
        while (performance.now() - t0 < 38) {
          // Layout thrashing overhead
        }
        const elapsed = Number((performance.now() - t0).toFixed(1))
        setFrameCostMs(elapsed)
        setForcedReflows(BAR_COUNT)
        return elapsed
      } else {
        // [Optimized]: Phase 1 Batch Reads -> Phase 2 Batch GPU Compositor Writes (`transform: scaleY`)
        const count = bars.length
        const scales = new Float32Array(count)
        for (let i = 0; i < count; i++) {
          scales[i] =
            0.18 + Math.abs(Math.sin(phaseSeed / 200 + i * 0.15)) * 0.82
        }
        for (let i = 0; i < count; i++) {
          const bar = bars[i]
          bar.style.height = "110px"
          bar.style.transform = `scaleY(${scales[i].toFixed(3)})`
        }
        const elapsed = Number(Math.max(0.8, performance.now() - t0).toFixed(1))
        setFrameCostMs(elapsed)
        setForcedReflows(0)
        return elapsed
      }
    },
    [mode]
  )

  useEffect(() => {
    if (stressTrigger === 0) return
    let step = 0
    const interval = window.setInterval(() => {
      const cost = stepVisualizerFrame(performance.now() + step * 90) ?? 1
      if (mode === "bad" && cost > 30) {
        useTelemetryStore.getState().recordLongTask(cost + 25)
      }
      step += 1
      if (step >= 6) {
        window.clearInterval(interval)
        useTelemetryStore.getState().captureSnapshot("layout-thrashing", mode, {
          fps: mode === "bad" ? 21 : 60,
          minFps: mode === "bad" ? 21 : 60,
          longTasksCount: mode === "bad" ? 5 : 0,
          tbtMs: mode === "bad" ? 95 : 0,
          inpMs: mode === "bad" ? 92 : 6,
          customMetric: {
            label:
              locale === "vi"
                ? "Số lần Forced Reflow / Frame"
                : "Forced Reflows / Frame",
            value: mode === "bad" ? BAR_COUNT : 0,
            unit: "x",
            lowerIsBetter: true,
          },
        })
      }
    }, 60)

    return () => window.clearInterval(interval)
  }, [stressTrigger, mode, locale, stepVisualizerFrame])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            Bars: <strong>{BAR_COUNT}</strong>
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-semibold",
              forcedReflows > 0
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Forced Synchronous Reflows: {forcedReflows} / frame
          </span>
          <span>
            Frame Pass Cost: <strong>{frameCostMs}ms</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="xs" onClick={() => stepVisualizerFrame()}>
            Step Animation Wave
          </Button>
          <RenderBadge name="SpectrumBars" />
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex h-36 items-end gap-[2px] overflow-hidden rounded-lg border bg-card p-3"
      >
        {Array.from({ length: BAR_COUNT }, (_, i) => {
          const initScale = 0.25 + Math.abs(Math.sin(i * 0.15)) * 0.7
          return (
            <div
              key={i}
              style={{
                height:
                  mode === "bad" ? `${Math.round(initScale * 110)}px` : "110px",
                transform:
                  mode === "good" ? `scaleY(${initScale.toFixed(2)})` : "none",
                transformOrigin: "bottom",
              }}
              className="flex-1 rounded-t bg-primary/80 transition-none"
            />
          )
        })}
      </div>
    </div>
  )
}
