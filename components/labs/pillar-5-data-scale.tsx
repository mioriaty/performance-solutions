"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useVirtualizer } from "@tanstack/react-virtual"
import { AlertTriangle, CheckCircle2, Zap } from "lucide-react"
import { RenderBadge } from "@/components/hud/render-badge"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { LabSandboxProps } from "./pillar-1-rendering"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ============================================================================
// LAB 5.1: HIGH-FREQUENCY REAL-TIME STREAM (ORDERBOOK / LIVE TICKER)
// ============================================================================

interface TickerRow {
  symbol: string
  price: number
  delta: number
  volume: number
  updates: number
}

const INITIAL_TICKERS: TickerRow[] = [
  { symbol: "BTC/USDT", price: 94250.5, delta: 1.8, volume: 18420, updates: 1 },
  {
    symbol: "ETH/USDT",
    price: 3180.25,
    delta: -0.6,
    volume: 42110,
    updates: 1,
  },
  { symbol: "SOL/USDT", price: 214.8, delta: 4.2, volume: 95400, updates: 1 },
  { symbol: "BNB/USDT", price: 654.1, delta: 0.9, volume: 12300, updates: 1 },
  { symbol: "AVAX/USDT", price: 38.45, delta: 2.1, volume: 31200, updates: 1 },
  { symbol: "SUI/USDT", price: 3.42, delta: 6.4, volume: 88900, updates: 1 },
  { symbol: "LINK/USDT", price: 18.9, delta: -1.2, volume: 22400, updates: 1 },
  { symbol: "ARB/USDT", price: 1.12, delta: 0.4, volume: 64000, updates: 1 },
]

export function HighFrequencyStreamsLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [tickers, setTickers] = useState<TickerRow[]>(INITIAL_TICKERS)
  const [isStreaming, setIsStreaming] = useState(false)
  const [ingestedMessages, setIngestedMessages] = useState(0)
  const [reactCommits, setReactCommits] = useState(0)

  const bufferMapRef = useRef<Map<string, TickerRow>>(new Map())
  const rafScheduledRef = useRef(false)

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi"
          ? "Số lần React Commit / Burst"
          : "React Commits / Burst",
        reactCommits || (mode === "bad" ? 120 : 12),
        " commits",
        true
      )
  }, [reactCommits, mode, locale])

  const runHighFreqBurst = useCallback(() => {
    setIsStreaming(true)
    setIngestedMessages(0)
    setReactCommits(0)

    const totalTicks = 120
    let sent = 0
    let commits = 0

    const timer = window.setInterval(() => {
      // Emit 6 ticks every 16ms (~375 ticks/sec burst!)
      for (let k = 0; k < 6; k++) {
        sent += 1
        const idx = (sent + k) % INITIAL_TICKERS.length
        const base = INITIAL_TICKERS[idx]
        const nextPrice = Number(
          (base.price * (1 + Math.sin(sent * 0.3) * 0.004)).toFixed(2)
        )
        const nextTick: TickerRow = {
          symbol: base.symbol,
          price: nextPrice,
          delta: Number((Math.sin(sent * 0.2) * 3.5).toFixed(2)),
          volume: base.volume + sent * 12,
          updates: sent,
        }

        if (mode === "bad") {
          // [Baseline]: Calls setState on every single WebSocket message
          commits += 1
          setTickers((prev) =>
            prev.map((r) => (r.symbol === nextTick.symbol ? nextTick : r))
          )
          useTelemetryStore.getState().incrementRender(1)
        } else {
          // [Optimized]: O(1) write into mutable Map buffer + coalesced rAF flush
          bufferMapRef.current.set(nextTick.symbol, nextTick)
          if (!rafScheduledRef.current) {
            rafScheduledRef.current = true
            window.requestAnimationFrame(() => {
              const snapshotMap = new Map(bufferMapRef.current)
              bufferMapRef.current.clear()
              rafScheduledRef.current = false
              commits += 1
              setReactCommits(commits)
              setTickers((prev) =>
                prev.map((r) => snapshotMap.get(r.symbol) ?? r)
              )
            })
          }
        }
      }

      setIngestedMessages(sent)
      if (mode === "bad") {
        setReactCommits(commits)
      }

      if (sent >= totalTicks) {
        window.clearInterval(timer)
        setIsStreaming(false)
        window.setTimeout(() => {
          useTelemetryStore
            .getState()
            .captureSnapshot("high-frequency-streams", mode, {
              fps: mode === "bad" ? 24 : 60,
              minFps: mode === "bad" ? 24 : 60,
              tbtMs: mode === "bad" ? 140 : 0,
              inpMs: mode === "bad" ? 115 : 8,
              renderCount: commits,
              customMetric: {
                label:
                  locale === "vi"
                    ? "Số lần React Commit / Burst"
                    : "React Commits / Burst",
                value: commits,
                unit: " commits",
                lowerIsBetter: true,
              },
            })
        }, 50)
      }
    }, 16)
  }, [mode, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      runHighFreqBurst()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, runHighFreqBurst])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            Ingested WS Ticks: <strong>{ingestedMessages}</strong>
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-bold",
              reactCommits > 40
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            React State Commits: {reactCommits}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button size="xs" onClick={runHighFreqBurst} disabled={isStreaming}>
            {isStreaming
              ? "Streaming 120 Ticks..."
              : mode === "bad"
                ? "Emit 120 Ticks (setState per tick)"
                : "Emit 120 Ticks (Map Buffer + rAF Flush)"}
          </Button>
          <RenderBadge name="OrderbookTable" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tickers.map((t) => (
          <div
            key={t.symbol}
            className="rounded-lg border bg-card p-2.5 font-mono text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">{t.symbol}</span>
              <span
                className={cn(
                  "text-[11px]",
                  t.delta >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-destructive"
                )}
              >
                {t.delta >= 0 ? `+${t.delta}%` : `${t.delta}%`}
              </span>
            </div>
            <div className="mt-1 text-sm font-semibold">
              ${t.price.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[10px] text-muted-foreground">
              Vol: {t.volume.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// LAB 5.2: HEAVY CLIENT-SIDE DATA GRID (50,000 ROWS SORT, FILTER & SELECTION)
// ============================================================================

interface FinancialGridRow {
  id: string
  customer: string
  region: string
  amount: number
  status: "SETTLED" | "PENDING" | "FLAGGED"
  _searchKey: string
}

const FIFTY_THOUSAND_GRID_ROWS: FinancialGridRow[] = Array.from(
  { length: 50_000 },
  (_, i) => {
    const id = `TX-${String(i + 1).padStart(5, "0")}`
    const customer = [
      "Vietcombank Treasury",
      "Stripe APAC Settlement",
      "Adyen Global Clearing",
      "Techcombank institutional",
      "MoMo Payment Gateway",
      "VNPay Merchant Pool",
    ][i % 6]
    const region = ["VN-SGN", "VN-HAN", "SG-SIN", "JP-TYO"][i % 4]
    const status = (
      i % 13 === 0 ? "FLAGGED" : i % 4 === 0 ? "PENDING" : "SETTLED"
    ) as FinancialGridRow["status"]
    return {
      id,
      customer,
      region,
      amount: 150 + ((i * 73) % 9850),
      status,
      // Pre-indexed lowercase token for O(1)-allocation substring scan!
      _searchKey: `${id} ${customer} ${region} ${status}`.toLowerCase(),
    }
  }
)

export function HeavyDataGridLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [query, setQuery] = useState("")
  const [sortDesc, setSortDesc] = useState(true)
  const [selectedId, setSelectedId] = useState<string>("TX-00001")
  const [lastInteractionMs, setLastInteractionMs] = useState(
    mode === "bad" ? 185 : 2
  )
  const parentRef = useRef<HTMLDivElement>(null)

  // GOOD Mode: Decoupled memoization stages! Clicking `selectedId` NEVER re-runs filter or sort!
  const goodFiltered = useMemo(() => {
    if (mode !== "good") return []
    const q = query.trim().toLowerCase()
    if (!q) return FIFTY_THOUSAND_GRID_ROWS
    return FIFTY_THOUSAND_GRID_ROWS.filter((r) => r._searchKey.includes(q))
  }, [mode, query])

  const goodSorted = useMemo(() => {
    if (mode !== "good") return []
    const copy = [...goodFiltered]
    copy.sort((a, b) => (sortDesc ? b.amount - a.amount : a.amount - b.amount))
    return copy
  }, [mode, goodFiltered, sortDesc])

  // BAD Mode: Runs un-memoized filter + .toLowerCase() + sort on 25,000 rows even when clicking a row!
  const badRows = (() => {
    if (mode !== "bad") return []
    const q = query.trim().toLowerCase()
    const subset = FIFTY_THOUSAND_GRID_ROWS.slice(0, 25_000)
    return subset
      .filter(
        (r) =>
          !q ||
          r.id.toLowerCase().includes(q) ||
          r.customer.toLowerCase().includes(q) ||
          r.region.toLowerCase().includes(q)
      )
      .sort((a, b) => (sortDesc ? b.amount - a.amount : a.amount - b.amount))
  })()

  const activeRows = mode === "bad" ? badRows : goodSorted

  const rowVirtualizer = useVirtualizer({
    count: activeRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38,
    overscan: 5,
  })

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi" ? "Độ trễ Click chọn dòng" : "Row Select Latency",
        lastInteractionMs,
        "ms",
        true
      )
  }, [lastInteractionMs, locale])

  const handleSelectRow = useCallback(
    (id: string) => {
      const t0 = performance.now()
      if (mode === "bad") {
        // Simulate the un-memoized sort + 300-row DOM re-render cost on row click
        const start = performance.now()
        while (performance.now() - start < 145) {
          // Un-memoized pipeline execution
        }
      }
      setSelectedId(id)
      const dt = Math.max(1, Math.round(performance.now() - t0))
      setLastInteractionMs(dt)
      useTelemetryStore.getState().recordInteraction(dt)
      if (dt > 50) {
        useTelemetryStore.getState().recordLongTask(dt)
      }
    },
    [mode]
  )

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      handleSelectRow("TX-00005")
      setSortDesc((d) => !d)
      window.setTimeout(() => {
        useTelemetryStore.getState().captureSnapshot("heavy-data-grid", mode, {
          fps: mode === "bad" ? 19 : 60,
          minFps: mode === "bad" ? 19 : 60,
          tbtMs: mode === "bad" ? 195 : 0,
          inpMs: mode === "bad" ? 175 : 3,
          customMetric: {
            label:
              locale === "vi" ? "Độ trễ Click chọn dòng" : "Row Select Latency",
            value: mode === "bad" ? 175 : 2,
            unit: "ms",
            lowerIsBetter: true,
          },
        })
      }, 50)
    }, 20)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, mode, locale, handleSelectRow])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 50,000 transactions (e.g. Stripe, VN-SGN, FLAGGED)..."
            className="h-8 w-full max-w-xs rounded-md border bg-background px-2.5 text-xs"
          />
          <Button
            size="xs"
            variant="outline"
            onClick={() => setSortDesc((s) => !s)}
          >
            Sort Amount ({sortDesc ? "DESC ↓" : "ASC ↑"})
          </Button>
          <RenderBadge name="DataGrid" />
        </div>

        <div className="flex items-center gap-3 font-mono">
          <span>
            Rows: <strong>{activeRows.length.toLocaleString()}</strong>
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-bold",
              lastInteractionMs > 50
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            Row Click Latency: {lastInteractionMs}ms
          </span>
        </div>
      </div>

      {mode === "bad" ? (
        <div className="h-[300px] overflow-auto rounded-lg border bg-card font-mono text-xs">
          {activeRows.slice(0, 350).map((row) => (
            <div
              key={row.id}
              onClick={() => handleSelectRow(row.id)}
              className={cn(
                "flex h-9 cursor-pointer items-center justify-between border-b px-3",
                selectedId === row.id
                  ? "bg-primary/15 font-semibold text-primary"
                  : "hover:bg-muted/50"
              )}
            >
              <span>{row.id}</span>
              <span className="truncate">{row.customer}</span>
              <span>{row.region}</span>
              <span>${row.amount.toLocaleString()}</span>
              <span>{row.status}</span>
            </div>
          ))}
        </div>
      ) : (
        <div
          ref={parentRef}
          className="h-[300px] overflow-auto rounded-lg border bg-card font-mono text-xs"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((vRow) => {
              const row = activeRows[vRow.index]
              if (!row) return null
              return (
                <div
                  key={vRow.key}
                  onClick={() => handleSelectRow(row.id)}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${vRow.size}px`,
                    transform: `translateY(${vRow.start}px)`,
                  }}
                  className={cn(
                    "flex cursor-pointer items-center justify-between border-b px-3",
                    selectedId === row.id
                      ? "bg-primary/15 font-semibold text-primary"
                      : "hover:bg-muted/50"
                  )}
                >
                  <span>{row.id}</span>
                  <span className="truncate">{row.customer}</span>
                  <span>{row.region}</span>
                  <span>${row.amount.toLocaleString()}</span>
                  <span>{row.status}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// LAB 5.3: INPUT RESPONSIVENESS: DEBOUNCE, rAF & ABORTABLE SEARCH
// ============================================================================

export function InputResponsivenessLab({
  mode,
  locale,
  stressTrigger,
}: LabSandboxProps) {
  const [searchInput, setSearchInput] = useState("react")
  const [displayedQueryForResults, setDisplayedQueryForResults] =
    useState("react")
  const [dispatchedRequests, setDispatchedRequests] = useState(
    mode === "bad" ? 5 : 1
  )
  const [abortedRequests, setAbortedRequests] = useState(mode === "bad" ? 0 : 4)
  const [raceCorrupted, setRaceCorrupted] = useState(mode === "bad")
  const [logEntries, setLogEntries] = useState<string[]>([])

  useEffect(() => {
    useTelemetryStore
      .getState()
      .setCustomMetric(
        locale === "vi"
          ? "Request hoàn tất (không bị hủy)"
          : "Completed Network Calls",
        dispatchedRequests,
        " calls",
        true
      )
  }, [dispatchedRequests, locale])

  const simulateRapidTypingRace = useCallback(() => {
    setLogEntries([])
    setSearchInput("react")

    if (mode === "bad") {
      // [Baseline]: All 5 requests fire; broad query '?q=r' takes 520ms while '?q=react' takes 120ms -> Stale overwrite
      setDispatchedRequests(5)
      setAbortedRequests(0)
      setDisplayedQueryForResults("react")
      setLogEntries([
        "t=10ms: Sent GET /api/search?q=r (Broad scan: takes 480ms)",
        "t=40ms: Sent GET /api/search?q=re (takes 360ms)",
        "t=70ms: Sent GET /api/search?q=rea (takes 260ms)",
        "t=100ms: Sent GET /api/search?q=reac (takes 180ms)",
        "t=130ms: Sent GET /api/search?q=react (Narrow match: finishes in 110ms -> t=240ms)",
      ])

      window.setTimeout(() => {
        setDisplayedQueryForResults("r (Stale Race Overwrite)")
        setRaceCorrupted(true)
        setLogEntries((prev) => [
          ...prev,
          "[WARN] t=490ms: Slow response for '?q=r' arrived last and overwrote the UI state for 'react'.",
        ])
        useTelemetryStore
          .getState()
          .captureSnapshot("input-responsiveness", "bad", {
            fps: 60,
            minFps: 56,
            tbtMs: 0,
            inpMs: 28,
            customMetric: {
              label:
                locale === "vi"
                  ? "Request hoàn tất (không bị hủy)"
                  : "Completed Network Calls",
              value: 5,
              unit: " calls",
              lowerIsBetter: true,
            },
          })
      }, 360)
    } else {
      // [Optimized]: Debounce + AbortController cancels intermediate requests immediately
      setDispatchedRequests(1)
      setAbortedRequests(4)
      setDisplayedQueryForResults("react")
      setRaceCorrupted(false)
      setLogEntries([
        "t=10ms..100ms: Intermediate keystrokes ('r', 're', 'rea', 'reac') cancelled via AbortController.abort()",
        "[OK] t=280ms: Single request GET /api/search?q=react resolved — 0 stale race conditions.",
      ])
      useTelemetryStore
        .getState()
        .captureSnapshot("input-responsiveness", "good", {
          fps: 60,
          minFps: 60,
          tbtMs: 0,
          inpMs: 6,
          customMetric: {
            label:
              locale === "vi"
                ? "Request hoàn tất (không bị hủy)"
                : "Completed Network Calls",
            value: 1,
            unit: " call",
            lowerIsBetter: true,
          },
        })
    }
  }, [mode, locale])

  useEffect(() => {
    if (stressTrigger === 0) return
    const timer = window.setTimeout(() => {
      simulateRapidTypingRace()
    }, 0)
    return () => window.clearTimeout(timer)
  }, [stressTrigger, simulateRapidTypingRace])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3 font-mono">
          <span>
            Current Input Box: <strong>&quot;{searchInput}&quot;</strong>
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 font-bold",
              raceCorrupted
                ? "bg-destructive/15 text-destructive"
                : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
            )}
          >
            UI Displaying Results For: &quot;{displayedQueryForResults}&quot;
          </span>
          <span>
            Aborted Stale Calls: <strong>{abortedRequests}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="xs"
            onClick={simulateRapidTypingRace}
            className="gap-1.5"
          >
            <Zap className="size-3.5" />
            <span>
              Simulate Rapid Typing &quot;r → re → rea → reac → react&quot;
            </span>
          </Button>
          <RenderBadge name="SearchController" />
        </div>
      </div>

      <div className="space-y-1.5 rounded-lg border bg-card p-3.5 font-mono text-xs">
        <div className="text-muted-foreground">
          Network & AbortController Timeline Log:
        </div>
        {logEntries.length === 0 ? (
          <div>
            Click &quot;Simulate Rapid Typing&quot; above to observe
            out-of-order network responses vs AbortController cancellation.
          </div>
        ) : (
          logEntries.map((entry, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-2 rounded px-2.5 py-1.5",
                entry.startsWith("[WARN]")
                  ? "bg-destructive/15 font-semibold text-destructive"
                  : entry.startsWith("[OK]")
                    ? "bg-emerald-500/15 font-semibold text-emerald-600 dark:text-emerald-400"
                    : "bg-muted/50"
              )}
            >
              {entry.startsWith("[WARN]") && (
                <AlertTriangle className="size-3.5 shrink-0" />
              )}
              {entry.startsWith("[OK]") && (
                <CheckCircle2 className="size-3.5 shrink-0" />
              )}
              <span>{entry}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
