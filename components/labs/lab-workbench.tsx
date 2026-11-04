"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  CheckCircle2,
  Code2,
  Cpu,
  Info,
  Lightbulb,
  ListChecks,
  Play,
  Scale,
  Sparkles,
  Terminal,
  Trash2,
} from "lucide-react"
import type { LabDefinition, LabSlug } from "@/lib/labs/types"
import { getAdjacentLabs, getPillarById } from "@/lib/labs/catalog"
import { useTelemetryStore, type LabMode } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import {
  RerenderStormsLab,
  ConcurrentReactLab,
  DomVirtualizationLab,
  type LabSandboxProps,
} from "./pillar-1-rendering"
import {
  LongTasksYieldingLab,
  WebWorkersOffloadLab,
  LayoutThrashingLab,
} from "./pillar-2-main-thread"
import {
  DetachedDomLeaksLab,
  ClosuresListenersLeaksLab,
  UnboundedCacheLruLab,
} from "./pillar-3-memory"
import {
  NetworkWaterfallsLab,
  ClsLayoutShiftsLab,
  DedupOptimisticUiLab,
} from "./pillar-4-network-cwv"
import {
  HighFrequencyStreamsLab,
  HeavyDataGridLab,
  InputResponsivenessLab,
} from "./pillar-5-data-scale"
import {
  CodeSplittingPrefetchLab,
  BarrelFilesTreeshakingLab,
  ThirdPartyIsolationLab,
} from "./pillar-6-bundle-arch"

const LAB_COMPONENTS: Record<LabSlug, React.ComponentType<LabSandboxProps>> = {
  "rerender-storms": RerenderStormsLab,
  "concurrent-react": ConcurrentReactLab,
  "dom-virtualization": DomVirtualizationLab,
  "long-tasks-yielding": LongTasksYieldingLab,
  "web-workers-offload": WebWorkersOffloadLab,
  "layout-thrashing": LayoutThrashingLab,
  "detached-dom-leaks": DetachedDomLeaksLab,
  "closures-listeners-leaks": ClosuresListenersLeaksLab,
  "unbounded-cache-lru": UnboundedCacheLruLab,
  "network-waterfalls": NetworkWaterfallsLab,
  "cls-layout-shifts": ClsLayoutShiftsLab,
  "dedup-optimistic-ui": DedupOptimisticUiLab,
  "high-frequency-streams": HighFrequencyStreamsLab,
  "heavy-data-grid": HeavyDataGridLab,
  "input-responsiveness": InputResponsivenessLab,
  "code-splitting-prefetch": CodeSplittingPrefetchLab,
  "barrel-files-treeshaking": BarrelFilesTreeshakingLab,
  "third-party-isolation": ThirdPartyIsolationLab,
}

function formatDelta(
  badVal: number | undefined,
  goodVal: number | undefined,
  lowerIsBetter = true
): { text: string; positive: boolean } | null {
  if (badVal === undefined || goodVal === undefined) return null
  if (badVal === goodVal) return { text: "0%", positive: true }
  if (lowerIsBetter) {
    if (badVal === 0) {
      return { text: `${goodVal - badVal}`, positive: goodVal <= badVal }
    }
    const pct = Math.round(((badVal - goodVal) / Math.abs(badVal)) * 100)
    return {
      text: pct > 0 ? `-${pct}%` : `+${Math.abs(pct)}%`,
      positive: goodVal < badVal,
    }
  } else {
    if (badVal === 0) return { text: `+${goodVal}`, positive: goodVal > 0 }
    const pct = Math.round(((goodVal - badVal) / Math.abs(badVal)) * 100)
    return {
      text: pct > 0 ? `+${pct}%` : `${pct}%`,
      positive: goodVal > badVal,
    }
  }
}

export function LabWorkbench({ lab }: { lab: LabDefinition }) {
  const locale = useLocale() as Locale
  const tHud = useTranslations("hud")
  const tTabs = useTranslations("tabs")
  const tPlaybook = useTranslations("playbook")

  const mode = useTelemetryStore((s) => s.mode)
  const setMode = useTelemetryStore((s) => s.setMode)
  const captureSnapshot = useTelemetryStore((s) => s.captureSnapshot)
  const clearSnapshots = useTelemetryStore((s) => s.clearSnapshots)
  const labSnapshots = useTelemetryStore((s) => s.snapshots[lab.slug])

  const [stressTrigger, setStressTrigger] = useState(0)

  useEffect(() => {
    setMode("bad")
  }, [lab.slug, setMode])

  const pillar = getPillarById(lab.pillarId)
  const { prev, next } = getAdjacentLabs(lab.slug)
  const content = lab.content[locale] ?? lab.content.vi
  const ActiveSandbox = LAB_COMPONENTS[lab.slug]

  const handleModeChange = (nextMode: LabMode) => {
    if (nextMode === mode) return
    setStressTrigger(0)
    setMode(nextMode)
  }

  const badSnap = labSnapshots?.bad
  const goodSnap = labSnapshots?.good

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_230px] xl:gap-10">
        {/* Main Documentation Article Column */}
        <article className="min-w-0 max-w-4xl space-y-10">
          {/* 1. Document Header & Executive Summary */}
          <header id="overview" className="scroll-mt-20 space-y-4 border-b pb-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link
                href="/"
                className="inline-flex items-center gap-1 font-medium hover:text-foreground cursor-pointer"
              >
                <ArrowLeft className="size-3.5" />
                <span>Docs</span>
              </Link>
              <span>/</span>
              {pillar && (
                <>
                  <span className="font-medium text-foreground/80">
                    Pillar {pillar.id}: {pillar.title[locale]}
                  </span>
                  <span>/</span>
                </>
              )}
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono font-semibold text-primary">
                Lab {lab.code} • {lab.primaryMetric}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[34px] lg:leading-[1.2]">
              {lab.code} — {content.title}
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              {content.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {lab.libraries.map((lib) => (
                <span
                  key={lib}
                  className="rounded-md border bg-muted/60 px-2.5 py-1 font-mono text-xs font-medium text-foreground/80"
                >
                  {lib}
                </span>
              ))}
            </div>

            {/* Executive Summary / Key Takeaway Callout */}
            <div className="mt-4 rounded-xl border border-primary/25 bg-primary/[0.04] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary">
                <Lightbulb className="size-4 shrink-0" />
                <span>{tPlaybook("keyTakeaway")}</span>
              </div>
              <p className="mt-2 text-[15px] leading-7 text-foreground/90">
                {content.takeaway}
              </p>
            </div>
          </header>

          {/* 2. Interactive Live Playground & Scorecard */}
          <section id="interactive-sandbox" className="scroll-mt-20 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Play className="size-4" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {tTabs("sandbox")}
                </h2>
              </div>

              <span className="font-mono text-xs text-muted-foreground">
                Isolated Mount: [{lab.slug}:{mode}]
              </span>
            </div>

            {/* Sandbox Frame */}
            <div className="overflow-hidden rounded-xl border bg-card shadow-xs">
              {/* Top Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
                {/* Mode Toggle */}
                <div className="inline-flex rounded-lg border bg-background p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange("bad")}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all",
                      mode === "bad"
                        ? "bg-rose-600 text-white shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        mode === "bad" ? "bg-white" : "bg-rose-500"
                      )}
                    />
                    <span>
                      {locale === "vi"
                        ? "Chưa tối ưu (Naive)"
                        : "Naive / Bottleneck"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("good")}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all",
                      mode === "good"
                        ? "bg-emerald-600 text-white shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Sparkles className="size-3.5" />
                    <span>
                      {locale === "vi"
                        ? "Đã tối ưu (Senior Pattern)"
                        : "Optimized Pattern"}
                    </span>
                  </button>
                </div>

                {/* Benchmark Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setStressTrigger((c) => c + 1)}
                    className="cursor-pointer gap-1.5 text-[13px]"
                  >
                    <Play className="size-3.5" />
                    <span>{tHud("runStressTest")}</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => captureSnapshot(lab.slug, mode)}
                    className="cursor-pointer gap-1.5 text-[13px]"
                  >
                    <Camera className="size-3.5" />
                    <span>{tHud("captureSnapshot")}</span>
                  </Button>
                </div>
              </div>

              {/* Active Sandbox Content */}
              <div className="p-4 sm:p-5">
                <ActiveSandbox
                  key={`${lab.slug}-${mode}`}
                  mode={mode}
                  locale={locale}
                  stressTrigger={stressTrigger}
                />
              </div>

              {/* Isolation Note Footer */}
              <div className="flex items-center gap-2 border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
                <Info className="size-3.5 shrink-0 text-primary" />
                <span>{tHud("isolationNotice")}</span>
              </div>
            </div>

            {/* Benchmark Scorecard Table */}
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  {tHud("scorecardTitle")}
                </h3>
                {(badSnap || goodSnap) && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => clearSnapshots(lab.slug)}
                    className="cursor-pointer text-xs"
                  >
                    <Trash2 className="size-3.5" />
                    <span>{tHud("clearSnapshots")}</span>
                  </Button>
                )}
              </div>

              {!badSnap && !goodSnap ? (
                <p className="text-sm text-muted-foreground">
                  {tHud("scorecardEmpty")}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[13.5px]">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="pb-2.5 font-medium">Metric</th>
                        <th className="pb-2.5 font-medium text-rose-500">
                          Naive (Bad)
                        </th>
                        <th className="pb-2.5 font-medium text-emerald-600 dark:text-emerald-400">
                          Optimized (Good)
                        </th>
                        <th className="pb-2.5 font-medium">
                          {tHud("improvement")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-[13px]">
                      {(badSnap?.customMetric || goodSnap?.customMetric) && (
                        <tr className="bg-primary/[0.04] font-semibold">
                          <td className="py-2.5 font-sans">
                            {badSnap?.customMetric?.label ??
                              goodSnap?.customMetric?.label}
                          </td>
                          <td className="py-2.5 text-rose-500">
                            {badSnap?.customMetric
                              ? `${badSnap.customMetric.value}${badSnap.customMetric.unit}`
                              : "—"}
                          </td>
                          <td className="py-2.5 text-emerald-600 dark:text-emerald-400">
                            {goodSnap?.customMetric
                              ? `${goodSnap.customMetric.value}${goodSnap.customMetric.unit}`
                              : "—"}
                          </td>
                          <td className="py-2.5">
                            {(() => {
                              const d = formatDelta(
                                badSnap?.customMetric?.value,
                                goodSnap?.customMetric?.value,
                                badSnap?.customMetric?.lowerIsBetter ?? true
                              )
                              return d ? (
                                <span
                                  className={cn(
                                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                                    d.positive
                                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                      : "bg-rose-500/15 text-rose-500"
                                  )}
                                >
                                  {d.text}
                                </span>
                              ) : (
                                "—"
                              )
                            })()}
                          </td>
                        </tr>
                      )}

                      <tr>
                        <td className="py-2.5 font-sans">Min FPS (60Hz)</td>
                        <td className="py-2.5">
                          {badSnap ? `${badSnap.minFps} FPS` : "—"}
                        </td>
                        <td className="py-2.5">
                          {goodSnap ? `${goodSnap.minFps} FPS` : "—"}
                        </td>
                        <td className="py-2.5">
                          {formatDelta(badSnap?.minFps, goodSnap?.minFps, false)
                            ?.text ?? "—"}
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-sans">
                          Total Blocking Time (TBT)
                        </td>
                        <td className="py-2.5">
                          {badSnap ? `${badSnap.tbtMs}ms` : "—"}
                        </td>
                        <td className="py-2.5">
                          {goodSnap ? `${goodSnap.tbtMs}ms` : "—"}
                        </td>
                        <td className="py-2.5">
                          {formatDelta(badSnap?.tbtMs, goodSnap?.tbtMs, true)
                            ?.text ?? "—"}
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-sans">
                          Interaction Latency (INP)
                        </td>
                        <td className="py-2.5">
                          {badSnap ? `${badSnap.inpMs}ms` : "—"}
                        </td>
                        <td className="py-2.5">
                          {goodSnap ? `${goodSnap.inpMs}ms` : "—"}
                        </td>
                        <td className="py-2.5">
                          {formatDelta(badSnap?.inpMs, goodSnap?.inpMs, true)
                            ?.text ?? "—"}
                        </td>
                      </tr>

                      <tr>
                        <td className="py-2.5 font-sans">
                          DOM Nodes / Heap Memory
                        </td>
                        <td className="py-2.5">
                          {badSnap
                            ? `${badSnap.domNodes.toLocaleString()} / ${badSnap.heapMb} MB`
                            : "—"}
                        </td>
                        <td className="py-2.5">
                          {goodSnap
                            ? `${goodSnap.domNodes.toLocaleString()} / ${goodSnap.heapMb} MB`
                            : "—"}
                        </td>
                        <td className="py-2.5">
                          {formatDelta(badSnap?.heapMb, goodSnap?.heapMb, true)
                            ?.text ?? "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          {/* 3. Deep-Dive Engineering Playbook (Editorial Documentation Prose) */}
          <section id="deep-dive" className="scroll-mt-20 space-y-8 border-t pt-8">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <BookOpen className="size-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {tTabs("playbook")}
              </h2>
            </div>

            <div className="space-y-8">
              {/* 3.1 Real-world Symptoms */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <AlertCircle className="size-4.5 text-rose-500" />
                  <span>1. {tPlaybook("symptoms")}</span>
                </h3>
                <ul className="space-y-2.5 border-l-2 border-rose-500/40 pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.symptoms.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 3.2 Under the Hood */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Cpu className="size-4.5 text-primary" />
                  <span>2. {tPlaybook("underTheHood")}</span>
                </h3>
                <ul className="space-y-2.5 border-l-2 border-primary/40 pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.underTheHood.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 3.3 Why the Optimization Works */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <CheckCircle2 className="size-4.5 text-emerald-500" />
                  <span>3. {tPlaybook("solution")}</span>
                </h3>
                <ul className="space-y-2.5 border-l-2 border-emerald-500/40 pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.solution.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              {/* 3.4 Trade-offs & When NOT to Use */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Scale className="size-4.5 text-amber-500" />
                  <span>4. {tPlaybook("tradeoffs")}</span>
                </h3>
                <ul className="space-y-2.5 border-l-2 border-amber-500/40 pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.tradeoffs.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Side-by-Side Code Comparison */}
          <section
            id="code-comparison"
            className="scroll-mt-20 space-y-5 border-t pt-8"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Code2 className="size-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {tTabs("codeDiff")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="overflow-hidden rounded-xl border border-rose-500/30 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-rose-950/40 px-4 py-2.5 text-xs font-semibold text-rose-300">
                  <span>{tPlaybook("badCodeTitle")}</span>
                  <span className="font-mono text-[11px] opacity-75">
                    naive-bottleneck.tsx
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-zinc-100">
                  <code>{lab.badCode}</code>
                </pre>
              </div>

              <div className="overflow-hidden rounded-xl border border-emerald-500/30 bg-zinc-950">
                <div className="flex items-center justify-between border-b border-zinc-800 bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-300">
                  <span>{tPlaybook("goodCodeTitle")}</span>
                  <span className="font-mono text-[11px] opacity-75">
                    optimized-pattern.tsx
                  </span>
                </div>
                <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-6 text-zinc-100">
                  <code>{lab.goodCode}</code>
                </pre>
              </div>
            </div>
          </section>

          {/* 5. Chrome DevTools Profiling Step-by-Step Guide */}
          <section
            id="devtools-guide"
            className="scroll-mt-20 space-y-5 border-t pt-8"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Terminal className="size-4" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {tPlaybook("devtoolsTitle")}
              </h2>
            </div>

            <div className="space-y-3">
              {content.devtoolsSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3.5 rounded-xl border bg-card p-4 text-[15px] leading-7 text-foreground/90"
                >
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 font-mono text-xs font-bold text-primary">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Prev / Next Article Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t pt-8">
            {prev ? (
              <Link
                href={`/labs/${prev.slug}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
              >
                <ArrowLeft className="size-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Previous Article
                  </div>
                  <div className="font-semibold text-foreground">
                    {prev.code} — {prev.content[locale].title}
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {next && (
              <Link
                href={`/labs/${next.slug}`}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-right text-sm transition-colors hover:border-primary/40 hover:bg-muted/50 cursor-pointer"
              >
                <div>
                  <div className="text-xs text-muted-foreground">
                    Next Article
                  </div>
                  <div className="font-semibold text-foreground">
                    {next.code} — {next.content[locale].title}
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </Link>
            )}
          </footer>
        </article>

        {/* Right Sticky Table of Contents (Documentation Style) */}
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-6 border-l pl-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                <ListChecks className="size-3.5 text-primary" />
                <span>
                  {locale === "vi" ? "Mục lục bài viết" : "On this page"}
                </span>
              </div>

              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li>
                  <a
                    href="#overview"
                    className="block transition-colors hover:text-foreground"
                  >
                    {locale === "vi"
                      ? "Tổng quan & Đúc kết"
                      : "Overview & Takeaway"}
                  </a>
                </li>
                <li>
                  <a
                    href="#interactive-sandbox"
                    className="block transition-colors hover:text-foreground"
                  >
                    {tTabs("sandbox")}
                  </a>
                </li>
                <li>
                  <a
                    href="#deep-dive"
                    className="block transition-colors hover:text-foreground"
                  >
                    {tTabs("playbook")}
                  </a>
                </li>
                <li>
                  <a
                    href="#code-comparison"
                    className="block transition-colors hover:text-foreground"
                  >
                    {tTabs("codeDiff")}
                  </a>
                </li>
                <li>
                  <a
                    href="#devtools-guide"
                    className="block transition-colors hover:text-foreground"
                  >
                    {tTabs("devtools")}
                  </a>
                </li>
              </ul>
            </div>

            <div className="space-y-2 border-t pt-4 text-xs">
              <div className="font-semibold text-foreground">
                Primary Metric
              </div>
              <div className="inline-block rounded-md bg-primary/10 px-2.5 py-1 font-mono font-semibold text-primary">
                {lab.primaryMetric}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
