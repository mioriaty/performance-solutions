"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { AlertTriangle, Bell, CheckCircle2 } from "lucide-react"
import { RenderBadge } from "@/components/hud/render-badge"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { LabSandboxProps } from "./pillar-1-rendering"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================================================
// LAB 3.1: DETACHED DOM NODES & GLOBAL REFERENCE LEAKS
// ============================================================================

const leakedDomRegistry: { el: HTMLElement; buffer: Float64Array }[] = []
const safeWeakRegistry = new WeakMap<HTMLElement, { mountedAt: number }>()

export function DetachedDomLeaksLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [isModalOpen, setIsModalOpen] = useState(true)
  const [cycleCount, setCycleCount] = useState(0)
  const [detachedCount, setDetachedCount] = useState(0)
  const previewDomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Clean up any previous leaked nodes when switching modes
    leakedDomRegistry.length = 0
    useTelemetryStore.getState().resetTrackedLeakBytes()
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Detached DOM bị giữ lại" : "Retained Detached Trees",
        0,
        " trees",
        true
      )
  }, [mode, locale])

  const runMountUnmountCycle = useCallback(
    (cycles = 1) => {
      if (mode === "bad") {
        for (let i = 0; i < cycles; i++) {
          const detachedEl = document.createElement("div")
          detachedEl.className = "detached-rich-inspector-subtree"
          detachedEl.innerHTML =
            "<div><canvas width='1920' height='1080'></canvas><span>Retained Fiber Subtree</span></div>"
          // Allocate ~2.6MB typed array pinned by this detached entry
          const buffer = new Float64Array(340_000).fill(i + 1.5)
          leakedDomRegistry.push({ el: detachedEl, buffer })
        }
        const totalRetained = leakedDomRegistry.length
        const deltaBytes = cycles * 2.6 * 1024 * 1024
        useTelemetryStore.getState().addTrackedLeakBytes(deltaBytes)
        setDetachedCount(totalRetained)
        setCycleCount((c) => c + cycles)
        useTelemetryStore
          .getState()
          .setCustomMetric(
            locale === "vi"
              ? "Detached DOM bị giữ lại"
              : "Retained Detached Trees",
            totalRetained,
            " trees",
            true
          )
      } else {
        // GOOD mode: registers in WeakMap and cleans up on unmount -> 0 retained detached nodes!
        const tempEl = document.createElement("div")
        safeWeakRegistry.set(tempEl, { mountedAt: Date.now() })
        safeWeakRegistry.delete(tempEl)
        setDetachedCount(0)
        setCycleCount((c) => c + cycles)
        useTelemetryStore
          .getState()
          .setCustomMetric(
            locale === "vi"
              ? "Detached DOM bị giữ lại"
              : "Retained Detached Trees",
            0,
            " trees",
            true
          )
      }
    },
    [mode, locale]
  )

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      runMountUnmountCycle(12)
      const heapMb = useTelemetryStore.getState().heapMb
      useTelemetryStore.getState().captureSnapshot("detached-dom-leaks", mode, {
        fps: 60,
        minFps: 58,
        tbtMs: 0,
        inpMs: 12,
        heapMb: mode === "bad" ? Math.max(55.2, heapMb) : 24.0,
        customMetric: {
          label:
            locale === "vi"
              ? "Detached DOM bị giữ lại"
              : "Retained Detached Trees",
          value: mode === "bad" ? leakedDomRegistry.length : 0,
          unit: " trees",
          lowerIsBetter: true,
        },
      })
    }, 20)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, mode, locale, runMountUnmountCycle])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            Mount/Unmount Cycles: <strong>{cycleCount}</strong>
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-semibold",
              detachedCount > 0
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Detached HTMLDivElement Trees in RAM: {detachedCount}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            size="xs"
            variant="outline"
            onClick={() => {
              setIsModalOpen((o) => !o)
              runMountUnmountCycle(1)
            }}
          >
            {isModalOpen ? "Unmount Preview" : "Mount Preview"} (+1 Cycle)
          </Button>
          <Button size="xs" onClick={() => runMountUnmountCycle(10)}>
            Simulate 10x Mount/Unmount
          </Button>
          {detachedCount > 0 && (
            <Button
              size="xs"
              variant="destructive"
              onClick={() => {
                leakedDomRegistry.length = 0
                setDetachedCount(0)
                useTelemetryStore.getState().resetTrackedLeakBytes()
              }}
            >
              Force Purge Registry (GC)
            </Button>
          )}
          <RenderBadge name="InspectorHost" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-3.5 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            {mode === "bad" ? (
              <>
                <AlertTriangle className="size-3.5 text-amber-500" />
                <span>Global Array Retaining Unmounted DOM References</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 text-emerald-500" />
                <span>WeakMap&lt;HTMLElement, Meta&gt; + Unmount Cleanup</span>
              </>
            )}
          </div>
          {isModalOpen ? (
            <div
              ref={previewDomRef}
              className="rounded-md border border-primary/30 bg-primary/5 p-3 font-mono text-[11px]"
            >
              <div>[Mounted DOM Node: &lt;div.rich-media-inspector&gt;]</div>
              <div className="mt-1 text-muted-foreground">
                Attached 4K Frame Buffer: 2.6 MB per instance
              </div>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-3 text-center text-muted-foreground">
              Preview Unmounted from Document Tree
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-3.5 text-xs">
          <div className="mb-2 flex items-center justify-between font-mono">
            <span>V8 Heap Retained Detached Nodes</span>
            <span className="font-bold">
              {(detachedCount * 2.6).toFixed(1)} MB Leaked
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {detachedCount === 0 ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-3.5 shrink-0" />
                <span>
                  0 Detached DOM nodes in heap. Garbage Collector reclaimed all
                  unmounted trees.
                </span>
              </span>
            ) : (
              Array.from({ length: Math.min(24, detachedCount) }, (_, idx) => (
                <span
                  key={idx}
                  className="rounded border border-destructive/40 bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive"
                >
                  Detached &lt;div #{idx + 1}&gt; (2.6MB)
                </span>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LAB 3.2: CLOSURES, STALE TIMERS & UNCLEANED LISTENERS
// ============================================================================

const CHANNELS = [
  "#core-platform",
  "#orderbook-feed",
  "#incident-war-room",
  "#release-ops",
  "#db-replication",
  "#edge-cdn",
]

export function ClosuresListenersLeaksLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [activeChannel, setActiveChannel] = useState(CHANNELS[0])
  const [zombieListeners, setZombieListeners] = useState(1)
  const [pingResponses, setPingResponses] = useState<string[]>([])
  const leakedClosuresRef = useRef<(() => string)[]>([])

  useEffect(() => {
    leakedClosuresRef.current = []
    useTelemetryStore.getState().resetTrackedLeakBytes()
  }, [mode])

  const switchChannel = useCallback(
    (nextChannel: string) => {
      setActiveChannel(nextChannel)
      if (mode === "bad") {
        // [Baseline]: Captures 1.8MB lexical scope in a listener closure without cleanup
        const capturedScopeBuffer = new Array(120_000).fill(nextChannel)
        const leakedHandler = () =>
          `[Stale Closure ${nextChannel}] (retains ${capturedScopeBuffer.length} items)`
        leakedClosuresRef.current.push(leakedHandler)
        const count = leakedClosuresRef.current.length + 1
        setZombieListeners(count)
        useTelemetryStore.getState().addTrackedLeakBytes(1.8 * 1024 * 1024)
        useTelemetryStore
          .getState()
          .setCustomMetric(
            locale === "vi" ? "Số Listener đang sống" : "Active Window Listeners",
            count,
            " listeners",
            true
          )
      } else {
        // [Optimized]: AbortController aborts previous listener before registering new one
        leakedClosuresRef.current = []
        setZombieListeners(1)
        useTelemetryStore
          .getState()
          .setCustomMetric(
            locale === "vi" ? "Số Listener đang sống" : "Active Window Listeners",
            1,
            " listener",
            true
          )
      }
    },
    [mode, locale]
  )

  const triggerGlobalPing = useCallback(() => {
    if (mode === "bad") {
      const logs = [
        `[Active ${activeChannel}] handled ping`,
        ...leakedClosuresRef.current.map((fn) => fn()),
      ]
      setPingResponses(logs)
    } else {
      setPingResponses([
        `[Clean Single Listener ${activeChannel}] handled ping (0 stale closures!)`,
      ])
    }
  }, [mode, activeChannel])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      for (let i = 0; i < 10; i++) {
        switchChannel(CHANNELS[i % CHANNELS.length])
      }
      triggerGlobalPing()
      const totalListeners =
        mode === "bad" ? leakedClosuresRef.current.length + 1 : 1
      useTelemetryStore
        .getState()
        .captureSnapshot("closures-listeners-leaks", mode, {
          fps: 60,
          minFps: 58,
          tbtMs: 0,
          inpMs: mode === "bad" ? 42 : 6,
          heapMb: mode === "bad" ? 43.8 : 24.0,
          customMetric: {
            label:
              locale === "vi"
                ? "Số Listener đang sống"
                : "Active Window Listeners",
            value: totalListeners,
            unit: " listeners",
            lowerIsBetter: true,
          },
        })
    }, 20)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, mode, locale, switchChannel, triggerGlobalPing])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {CHANNELS.map((ch) => (
            <Button
              key={ch}
              size="xs"
              variant={activeChannel === ch ? "default" : "outline"}
              onClick={() => switchChannel(ch)}
            >
              {ch}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="secondary"
            onClick={triggerGlobalPing}
            className="gap-1.5"
          >
            <Bell className="size-3.5" />
            <span>Dispatch Global Event</span>
          </Button>
          <RenderBadge name="ChannelSubscriber" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-3.5 text-xs space-y-2">
          <div className="flex items-center justify-between font-mono">
            <span>Registered Window Listeners:</span>
            <span
              className={cn(
                "rounded px-2 py-0.5 font-bold",
                zombieListeners > 1
                  ? "bg-destructive/15 text-destructive"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
              )}
            >
              {zombieListeners}x (Expected: 1x)
            </span>
          </div>
          <p className="text-muted-foreground">
            {mode === "bad"
              ? "Each channel click registers a new window listener without cleanup, trapping its 1.8MB lexical scope in RAM."
              : "AbortController.abort() runs in useEffect cleanup on every channel switch—guaranteeing exactly 1 listener."}
          </p>
        </div>

        <div className="rounded-lg border bg-card p-3.5 text-xs">
          <div className="mb-1.5 font-mono font-semibold">
            Callback Executions from 1 Single Event ({pingResponses.length}x):
          </div>
          <div className="max-h-28 space-y-1 overflow-auto font-mono text-[11px]">
            {pingResponses.length === 0 ? (
              <span className="text-muted-foreground">
                Switch channels a few times, then click &quot;Dispatch 1 Global
                Event&quot;...
              </span>
            ) : (
              pingResponses.map((line, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded px-2 py-0.5",
                    i === 0
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-destructive/10 text-destructive"
                  )}
                >
                  #{i + 1}: {line}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// LAB 3.3: UNBOUNDED IN-MEMORY CACHE VS BOUNDED LRU CACHE
// ============================================================================

const MAX_LRU_CAPACITY = 6

export function UnboundedCacheLruLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [cacheKeys, setCacheKeys] = useState<string[]>([
    "doc-01",
    "doc-02",
    "doc-03",
  ])
  const [evictedCount, setEvictedCount] = useState(0)
  const [cacheHits, setCacheHits] = useState(0)

  useEffect(() => {
    useTelemetryStore.getState().resetTrackedLeakBytes()
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Số bản ghi giữ trong Cache" : "Cached Payloads in RAM",
        3,
        " docs",
        true
      )
  }, [mode, locale])

  const openDocument = useCallback(
    (docId: string) => {
      setCacheKeys((prev) => {
        const isHit = prev.includes(docId)
        if (isHit) {
          setCacheHits((h) => h + 1)
          if (mode === "good") {
            // Move accessed key to Most Recently Used end
            return [...prev.filter((k) => k !== docId), docId]
          }
          return prev
        }

        if (mode === "bad") {
          // [Baseline]: Unbounded Map grows without limit
          const next = [...prev, docId]
          useTelemetryStore.getState().addTrackedLeakBytes(1.5 * 1024 * 1024)
          useTelemetryStore
            .getState()
            .setCustomMetric(
              locale === "vi"
                ? "Số bản ghi giữ trong Cache"
                : "Cached Payloads in RAM",
              next.length,
              " docs",
              true
            )
          return next
        }

        // [Optimized]: Bounded LRU Cache evicts oldest when exceeding MAX_LRU_CAPACITY
        const next = [...prev, docId]
        if (next.length > MAX_LRU_CAPACITY) {
          next.shift()
          setEvictedCount((e) => e + 1)
        }
        useTelemetryStore
          .getState()
          .setCustomMetric(
            locale === "vi"
              ? "Số bản ghi giữ trong Cache"
              : "Cached Payloads in RAM",
            next.length,
            " docs",
            true
          )
        return next
      })
    },
    [mode, locale]
  )

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      for (let i = 4; i <= 28; i++) {
        openDocument(`doc-${String(i).padStart(2, "0")}`)
      }
      window.setTimeout(() => {
        useTelemetryStore
          .getState()
          .captureSnapshot("unbounded-cache-lru", mode, {
            fps: 60,
            minFps: 59,
            tbtMs: 0,
            inpMs: 8,
            heapMb: mode === "bad" ? 61.5 : 27.0,
            customMetric: {
              label:
                locale === "vi"
                  ? "Số bản ghi giữ trong Cache"
                  : "Cached Payloads in RAM",
              value: mode === "bad" ? 28 : MAX_LRU_CAPACITY,
              unit: " docs",
              lowerIsBetter: true,
            },
          })
      }, 40)
    }, 20)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, mode, locale, openDocument])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            Cache Policy:{" "}
            <strong>
              {mode === "bad"
                ? "Unbounded Map (No Eviction)"
                : `O(1) LRU Cache (Max ${MAX_LRU_CAPACITY} docs)`}
            </strong>
          </span>
          <span>
            Cached in RAM: <strong>{cacheKeys.length} docs</strong> (
            {(cacheKeys.length * 1.5).toFixed(1)} MB)
          </span>
          <span>
            LRU Evictions: <strong>{evictedCount}</strong>
          </span>
          <span>
            Cache Hits: <strong>{cacheHits}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            onClick={() => {
              const nextNum = cacheKeys.length + evictedCount + 1
              openDocument(`doc-${String(nextNum).padStart(2, "0")}`)
            }}
          >
            + Browse New 1.5MB Document
          </Button>
          <RenderBadge name="DocumentCache" />
        </div>
      </div>

      <div className="rounded-lg border bg-card p-3.5 text-xs space-y-2.5">
        <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
          <span>Oldest (LRU Head — Next to Evict)</span>
          <span>Newest (MRU Tail — Recently Used)</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {cacheKeys.map((key, idx) => (
            <button
              key={key}
              type="button"
              onClick={() => openDocument(key)}
              className={cn(
                "rounded-md border px-2.5 py-1 font-mono text-xs transition-colors",
                idx === cacheKeys.length - 1
                  ? "border-primary bg-primary/15 font-bold text-primary"
                  : mode === "bad" && cacheKeys.length > 10
                    ? "border-destructive/40 bg-destructive/10 text-destructive"
                    : "bg-muted/60 hover:bg-muted"
              )}
            >
              {key} (1.5MB)
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
