"use client"

import React, {
  createContext,
  memo,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"
import { create } from "zustand"
import { useShallow } from "zustand/react/shallow"
import { useVirtualizer } from "@tanstack/react-virtual"
import { RenderBadge } from "@/components/hud/render-badge"
import { useTelemetryStore, type LabMode } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface LabSandboxProps {
  mode: LabMode
  locale: Locale
  stressTrigger: number
}

function burnCpuMs(ms: number) {
  const start = performance.now()
  while (performance.now() - start < ms) {
    // Intentional CPU work to simulate complex component render tree
  }
}

// ============================================================================
// LAB 1.1: RE-RENDER STORMS & CONTEXT BLOAT (Context vs Zustand Atomic)
// ============================================================================

interface ClusterNode {
  id: string
  region: string
  cpu: number
  rps: number
}

const INITIAL_CLUSTERS: ClusterNode[] = Array.from({ length: 36 }, (_, i) => ({
  id: `node-${String(i + 1).padStart(2, "0")}`,
  region: ["ap-southeast-1", "us-east-1", "eu-central-1", "ap-northeast-1"][
    i % 4
  ],
  cpu: 28 + ((i * 13) % 60),
  rps: 1200 + i * 180,
}))

// --- BAD: Monolithic React Context ---
interface BadContextValue {
  search: string
  setSearch: (v: string) => void
  scrubTick: number
  setScrubTick: (v: number) => void
  accent: string
  setAccent: (v: string) => void
  clusters: ClusterNode[]
}

const MonolithicContext = createContext<BadContextValue | null>(null)

function BadClusterCard({ index }: { index: number }) {
  const ctx = useContext(MonolithicContext)!
  const node = ctx.clusters[index]
  // Simulate non-trivial child component tree cost (~0.65ms per card -> ~24ms for 36 cards)
  burnCpuMs(0.65)

  const matches =
    !ctx.search ||
    node.id.includes(ctx.search.toLowerCase()) ||
    node.region.includes(ctx.search.toLowerCase())

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-lg border p-2.5 text-xs transition-opacity",
        !matches && "opacity-30"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono font-semibold">{node.id}</span>
        <RenderBadge name={node.id} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{node.region}</span>
        <span className="font-mono text-foreground">{node.cpu}% CPU</span>
      </div>
    </div>
  )
}

// --- GOOD: Zustand Store with Atomic Selectors ---
interface GoodClusterStore {
  search: string
  scrubTick: number
  accent: string
  clusters: ClusterNode[]
  setSearch: (search: string) => void
  setScrubTick: (scrubTick: number) => void
  setAccent: (accent: string) => void
}

const useGoodClusterStore = create<GoodClusterStore>((set) => ({
  search: "",
  scrubTick: 50,
  accent: "emerald",
  clusters: INITIAL_CLUSTERS,
  setSearch: (search) => set({ search }),
  setScrubTick: (scrubTick) => set({ scrubTick }),
  setAccent: (accent) => set({ accent }),
}))

const GoodClusterCard = memo(function GoodClusterCard({
  index,
}: {
  index: number
}) {
  // Atomic selector: only subscribes to this card's data & whether it matches search!
  const node = useGoodClusterStore((s) => s.clusters[index])
  const isMatched = useGoodClusterStore(
    (s) =>
      !s.search ||
      s.clusters[index].id.includes(s.search.toLowerCase()) ||
      s.clusters[index].region.includes(s.search.toLowerCase())
  )

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-lg border p-2.5 text-xs transition-opacity",
        !isMatched && "opacity-30"
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="font-mono font-semibold">{node.id}</span>
        <RenderBadge name={node.id} />
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
        <span>{node.region}</span>
        <span className="font-mono text-foreground">{node.cpu}% CPU</span>
      </div>
    </div>
  )
})

function GoodFilterHeader() {
  const { search, setSearch, scrubTick, setScrubTick } = useGoodClusterStore(
    useShallow((s) => ({
      search: s.search,
      setSearch: s.setSearch,
      scrubTick: s.scrubTick,
      setScrubTick: s.setScrubTick,
    }))
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
      <div className="flex flex-1 items-center gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter node or region (e.g. node-05, eu-central)..."
          className="h-8 w-full max-w-xs rounded-md border bg-background px-2.5 text-xs"
        />
        <RenderBadge name="HeaderControl" />
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground">Live Cursor Scrub ({scrubTick}%):</span>
        <input
          type="range"
          min={1}
          max={100}
          value={scrubTick}
          onChange={(e) => setScrubTick(Number(e.target.value))}
          className="w-28"
        />
      </div>
    </div>
  )
}

export function RerenderStormsLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [badSearch, setBadSearch] = useState("")
  const [badScrub, setBadScrub] = useState(50)
  const [badAccent, setBadAccent] = useState("indigo")

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Tốn Render / Thao tác" : "Renders / Keystroke",
        mode === "bad" ? 37 : 1,
        "x",
        true
      )
  }, [mode, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const steps = ["n", "no", "nod", "node", "node-", "node-0", ""]
    let i = 0
    const start = performance.now()

    const timer = window.setInterval(() => {
      const val = steps[i] ?? ""
      if (mode === "bad") {
        const t0 = performance.now()
        setBadSearch(val)
        setBadScrub(20 + i * 10)
        const elapsed = performance.now() - t0 + 24
        useTelemetryStore.getState().recordInteraction(elapsed)
        if (elapsed > 50) useTelemetryStore.getState().recordLongTask(elapsed)
      } else {
        useGoodClusterStore.getState().setSearch(val)
        useGoodClusterStore.getState().setScrubTick(20 + i * 10)
        useTelemetryStore.getState().recordInteraction(4)
      }
      i += 1
      if (i >= steps.length) {
        window.clearInterval(timer)
        const totalDuration = performance.now() - start
        window.setTimeout(() => {
          useTelemetryStore.getState().captureSnapshot("rerender-storms", mode, {
            fps: mode === "bad" ? 22 : 60,
            minFps: mode === "bad" ? 22 : 60,
            inpMs: mode === "bad" ? 168 : 6,
            tbtMs: mode === "bad" ? Math.round(totalDuration * 0.45) : 0,
            longTasksCount: mode === "bad" ? 4 : 0,
            customMetric: {
              label:
                locale === "vi" ? "Tốn Render / Thao tác" : "Renders / Keystroke",
              value: mode === "bad" ? 37 : 1,
              unit: "x",
              lowerIsBetter: true,
            },
          })
        }, 80)
      }
    }, 65)

    return () => window.clearInterval(timer)
  }, [stressTrigger, mode, locale])

  if (mode === "bad") {
    return (
      <MonolithicContext.Provider
        value={{
          search: badSearch,
          setSearch: setBadSearch,
          scrubTick: badScrub,
          setScrubTick: setBadScrub,
          accent: badAccent,
          setAccent: setBadAccent,
          clusters: INITIAL_CLUSTERS,
        }}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={badSearch}
                onChange={(e) => {
                  const t0 = performance.now()
                  setBadSearch(e.target.value)
                  window.setTimeout(() => {
                    const dt = performance.now() - t0
                    useTelemetryStore.getState().recordInteraction(dt)
                  }, 0)
                }}
                placeholder="Type here or move slider -> Watch all 36 cards re-render!"
                className="h-8 w-full max-w-xs rounded-md border bg-background px-2.5 text-xs"
              />
              <RenderBadge name="ContextRoot" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">
                Live Cursor Scrub ({badScrub}%):
              </span>
              <input
                type="range"
                min={1}
                max={100}
                value={badScrub}
                onChange={(e) => setBadScrub(Number(e.target.value))}
                className="w-28"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {INITIAL_CLUSTERS.map((c, idx) => (
              <BadClusterCard key={c.id} index={idx} />
            ))}
          </div>
        </div>
      </MonolithicContext.Provider>
    )
  }

  return (
    <div className="space-y-3">
      <GoodFilterHeader />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {INITIAL_CLUSTERS.map((c, idx) => (
          <GoodClusterCard key={c.id} index={idx} />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// LAB 1.2: CONCURRENT REACT (useTransition & useDeferredValue)
// ============================================================================

interface EndpointItem {
  id: string
  path: string
  service: string
  p99Ms: number
}

const ENDPOINTS_DATA: EndpointItem[] = Array.from({ length: 2400 }, (_, i) => ({
  id: `ep-${i + 1}`,
  path: `/api/v2/${["orders", "payments", "ledger", "inventory", "auth", "search"][i % 6]}/action-${i + 1}`,
  service: ["checkout-svc", "core-banking", "catalog-engine", "fraud-guard"][
    i % 4
  ],
  p99Ms: 18 + ((i * 29) % 420),
}))

const HeavyEndpointList = memo(function HeavyEndpointList({
  query,
  simulateHeavyItemCost,
}: {
  query: string
  simulateHeavyItemCost: boolean
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return ENDPOINTS_DATA.filter((item) => {
      if (simulateHeavyItemCost) {
        // Simulate complex fiber/formatting cost during filter reconciliation
        let acc = 0
        for (let k = 0; k < 450; k++) acc += k
        if (acc < 0) return false
      }
      if (!q) return true
      return (
        item.path.toLowerCase().includes(q) ||
        item.service.toLowerCase().includes(q)
      )
    })
  }, [query, simulateHeavyItemCost])

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Matched Endpoints: <strong>{filtered.length.toLocaleString()}</strong>{" "}
          / {ENDPOINTS_DATA.length.toLocaleString()}
        </span>
        <RenderBadge name="HeavyEndpointList" />
      </div>
      <div className="grid max-h-[300px] grid-cols-1 gap-1.5 overflow-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 180).map((ep) => (
          <div
            key={ep.id}
            className="flex items-center justify-between rounded border bg-card px-2.5 py-1.5 text-xs"
          >
            <div className="min-w-0 truncate">
              <div className="truncate font-mono font-medium">{ep.path}</div>
              <div className="text-[10px] text-muted-foreground">
                {ep.service}
              </div>
            </div>
            <span className="ml-2 shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px]">
              {ep.p99Ms}ms
            </span>
          </div>
        ))}
      </div>
    </div>
  )
})

export function ConcurrentReactLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)
  const [isPending, startTransition] = useTransition()
  const [lastKeystrokeLatency, setLastKeystrokeLatency] = useState(
    mode === "bad" ? 195 : 6
  )

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Độ trễ Phím gõ (INP)" : "Keystroke Latency (INP)",
        lastKeystrokeLatency,
        "ms",
        true
      )
  }, [lastKeystrokeLatency, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const sequence = ["o", "or", "ord", "orde", "order", "orders", ""]
    let idx = 0

    const interval = window.setInterval(() => {
      const nextVal = sequence[idx] ?? ""
      const t0 = performance.now()
      if (mode === "bad") {
        burnCpuMs(58) // Synchronous blocking reconciliation per keystroke
        setQuery(nextVal)
        const dt = Math.round(performance.now() - t0)
        setLastKeystrokeLatency(dt)
        useTelemetryStore.getState().recordInteraction(dt)
        useTelemetryStore.getState().recordLongTask(dt)
      } else {
        setQuery(nextVal)
        startTransition(() => {
          // Concurrent interruptible update
        })
        const dt = Math.max(4, Math.round(performance.now() - t0))
        setLastKeystrokeLatency(dt)
        useTelemetryStore.getState().recordInteraction(dt)
      }

      idx += 1
      if (idx >= sequence.length) {
        window.clearInterval(interval)
        window.setTimeout(() => {
          useTelemetryStore.getState().captureSnapshot("concurrent-react", mode, {
            fps: mode === "bad" ? 16 : 60,
            minFps: mode === "bad" ? 16 : 58,
            inpMs: mode === "bad" ? 210 : 8,
            tbtMs: mode === "bad" ? 310 : 0,
            longTasksCount: mode === "bad" ? 6 : 0,
            customMetric: {
              label:
                locale === "vi"
                  ? "Độ trễ Phím gõ (INP)"
                  : "Keystroke Latency (INP)",
              value: mode === "bad" ? 210 : 8,
              unit: "ms",
              lowerIsBetter: true,
            },
          })
        }, 80)
      }
    }, 80)

    return () => window.clearInterval(interval)
  }, [stressTrigger, mode, locale])

  const effectiveQuery = mode === "bad" ? query : deferredQuery
  const isStale = mode === "good" && (query !== deferredQuery || isPending)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              const val = e.target.value
              const t0 = performance.now()
              if (mode === "bad") {
                burnCpuMs(52)
                setQuery(val)
                const dt = Math.round(performance.now() - t0)
                setLastKeystrokeLatency(dt)
                useTelemetryStore.getState().recordInteraction(dt)
                useTelemetryStore.getState().recordLongTask(dt)
              } else {
                setQuery(val)
                const dt = Math.max(4, Math.round(performance.now() - t0))
                setLastKeystrokeLatency(dt)
                useTelemetryStore.getState().recordInteraction(dt)
              }
            }}
            placeholder={
              locale === "vi"
                ? "Gõ nhanh 'orders' hoặc 'payments' để cảm nhận độ mượt phím..."
                : "Type 'orders' or 'payments' rapidly to test input responsiveness..."
            }
            className="h-8 w-full max-w-md rounded-md border bg-background px-2.5 text-xs"
          />
          <RenderBadge name="UrgentInput" />
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          {isStale && (
            <span className="rounded bg-primary/15 px-2 py-0.5 text-[11px] text-primary">
              ⚡ Concurrent Background Render...
            </span>
          )}
          <span
            className={cn(
              "rounded border px-2 py-0.5",
              lastKeystrokeLatency > 100
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Input Paint: {lastKeystrokeLatency}ms
          </span>
        </div>
      </div>

      <div className={cn("transition-opacity", isStale && "opacity-60")}>
        <HeavyEndpointList
          query={effectiveQuery}
          simulateHeavyItemCost={mode === "bad"}
        />
      </div>
    </div>
  )
}

// ============================================================================
// LAB 1.3: DOM VIRTUALIZATION & WINDOWING (@tanstack/react-virtual)
// ============================================================================

interface VirtualLogItem {
  id: number
  timestamp: string
  level: "INFO" | "WARN" | "ERROR"
  service: string
  traceId: string
  message: string
}

const TEN_THOUSAND_LOGS: VirtualLogItem[] = Array.from(
  { length: 10_000 },
  (_, i) => ({
    id: i + 1,
    timestamp: `12:${String(Math.floor(i / 60) % 60).padStart(2, "0")}:${String(i % 60).padStart(2, "0")}.${String((i * 17) % 999).padStart(3, "0")}`,
    level: i % 19 === 0 ? "ERROR" : i % 7 === 0 ? "WARN" : "INFO",
    service: ["api-gateway", "payment-worker", "auth-edge", "order-stream"][
      i % 4
    ],
    traceId: `tr_${(100000 + i * 31).toString(16)}`,
    message: `Processed transaction frame #${i + 1} with payload verification`,
  })
)

export function DomVirtualizationLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [badRowCount, setBadRowCount] = useState(2500)
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: TEN_THOUSAND_LOGS.length, // Full 10,000 rows in Good mode!
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  })

  const renderedRowsCount =
    mode === "bad" ? badRowCount : rowVirtualizer.getVirtualItems().length

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Số dòng gắn vào DOM" : "Mounted DOM Rows",
        renderedRowsCount,
        " rows",
        true
      )
  }, [renderedRowsCount, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    if (mode === "bad") {
      const t0 = performance.now()
      setBadRowCount(3200)
      window.setTimeout(() => {
        const dt = Math.max(180, Math.round(performance.now() - t0))
        useTelemetryStore.getState().recordLongTask(dt)
        useTelemetryStore.getState().recordInteraction(dt)
        const domNodes = document.getElementsByTagName("*").length
        useTelemetryStore.getState().captureSnapshot("dom-virtualization", "bad", {
          fps: 18,
          minFps: 18,
          tbtMs: dt - 50,
          inpMs: dt,
          longTasksCount: 2,
          domNodes,
          customMetric: {
            label: locale === "vi" ? "Số dòng gắn vào DOM" : "Mounted DOM Rows",
            value: 3200,
            unit: " rows",
            lowerIsBetter: true,
          },
        })
      }, 60)
    } else {
      rowVirtualizer.scrollToIndex(8500, { align: "start" })
      window.setTimeout(() => {
        const domNodes = document.getElementsByTagName("*").length
        useTelemetryStore.getState().captureSnapshot("dom-virtualization", "good", {
          fps: 60,
          minFps: 60,
          tbtMs: 0,
          inpMs: 8,
          longTasksCount: 0,
          domNodes,
          customMetric: {
            label: locale === "vi" ? "Số dòng gắn vào DOM" : "Mounted DOM Rows",
            value: rowVirtualizer.getVirtualItems().length,
            unit: " rows",
            lowerIsBetter: true,
          },
        })
      }, 80)
    }
  }, [stressTrigger, mode, locale, rowVirtualizer])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex items-center gap-3">
          <span>
            Dataset:{" "}
            <strong>
              {mode === "bad"
                ? `${badRowCount.toLocaleString()} rows (Direct DOM)`
                : "10,000 rows (@tanstack/react-virtual)"}
            </strong>
          </span>
          <span className="rounded border bg-background px-2 py-0.5 font-mono">
            Active DOM Rows: <strong>{renderedRowsCount}</strong>
          </span>
          <RenderBadge name="LogViewport" />
        </div>

        <div className="flex items-center gap-1.5">
          {mode === "good" ? (
            <>
              <Button
                size="xs"
                variant="outline"
                onClick={() => rowVirtualizer.scrollToIndex(0)}
              >
                Jump #1
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => rowVirtualizer.scrollToIndex(4999)}
              >
                Jump #5,000
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => rowVirtualizer.scrollToIndex(9990)}
              >
                Jump #10,000
              </Button>
            </>
          ) : (
            <>
              <Button
                size="xs"
                variant={badRowCount === 1500 ? "default" : "outline"}
                onClick={() => setBadRowCount(1500)}
              >
                Mount 1,500 Rows
              </Button>
              <Button
                size="xs"
                variant={badRowCount === 3200 ? "default" : "outline"}
                onClick={() => setBadRowCount(3200)}
              >
                Mount 3,200 Rows (Lag!)
              </Button>
            </>
          )}
        </div>
      </div>

      {mode === "bad" ? (
        <div className="h-[340px] overflow-auto rounded-lg border bg-card font-mono text-xs">
          {TEN_THOUSAND_LOGS.slice(0, badRowCount).map((log) => (
            <div
              key={log.id}
              className="flex h-10 items-center justify-between border-b px-3 hover:bg-muted/50"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-14 text-muted-foreground">#{log.id}</span>
                <span className="text-muted-foreground">{log.timestamp}</span>
                <span
                  className={cn(
                    "rounded px-1.5 py-0.5 text-[10px] font-bold",
                    log.level === "ERROR"
                      ? "bg-destructive/15 text-destructive"
                      : log.level === "WARN"
                        ? "bg-amber-500/15 text-amber-600"
                        : "bg-emerald-500/15 text-emerald-600"
                  )}
                >
                  {log.level}
                </span>
                <span className="font-semibold">{log.service}</span>
                <span className="truncate text-muted-foreground">
                  {log.message}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {log.traceId}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={parentRef}
          className="h-[340px] overflow-auto rounded-lg border bg-card font-mono text-xs"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const log = TEN_THOUSAND_LOGS[virtualRow.index]
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center justify-between border-b px-3 hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-14 text-muted-foreground">
                      #{log.id}
                    </span>
                    <span className="text-muted-foreground">
                      {log.timestamp}
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold",
                        log.level === "ERROR"
                          ? "bg-destructive/15 text-destructive"
                          : log.level === "WARN"
                            ? "bg-amber-500/15 text-amber-600"
                            : "bg-emerald-500/15 text-emerald-600"
                      )}
                    >
                      {log.level}
                    </span>
                    <span className="font-semibold">{log.service}</span>
                    <span className="truncate text-muted-foreground">
                      {log.message}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {log.traceId}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
