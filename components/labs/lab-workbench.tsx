"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Camera,
  CheckCircle2,
  Code2,
  Compass,
  Cpu,
  Info,
  Lightbulb,
  ListChecks,
  Play,
  Scale,
  Terminal,
  Trash2,
  XCircle,
} from "lucide-react"
import type { LabDefinition, LabSlug } from "@/lib/labs/types"
import {
  getAdjacentLabs,
  getLabPatternMapping,
  getPillarById,
} from "@/lib/labs/catalog"
import { useTelemetryStore, type LabMode } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { Button } from "@/components/ui/button"
import {
  CodeBlock,
  CodeBlockActions,
  CodeBlockContent,
  CodeBlockCopyButton,
  CodeBlockHeader,
  CodeBlockLine,
  CodeBlockTitle,
} from "@/components/ui/code-block"
import { FormattedText } from "@/components/ui/formatted-text"
import { useHighlightedCode } from "@/hooks/use-highlighted-code"
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

function LabCodePreview({
  title,
  filename,
  code,
  tone,
}: {
  title: string
  filename: string
  code: string
  tone: "baseline" | "optimized"
}) {
  const lines = useHighlightedCode(code, "tsx")

  return (
    <CodeBlock className="bg-card">
      <CodeBlockHeader className="border-b bg-muted/30 pb-3">
        <CodeBlockTitle>
          {tone === "baseline" ? (
            <AlertTriangle className="text-amber-500" />
          ) : (
            <CheckCircle2 className="text-emerald-500" />
          )}
          <span>{title}</span>
        </CodeBlockTitle>
        <CodeBlockActions>
          <span className="px-1.5 font-mono text-[11px] text-muted-foreground">
            {filename}
          </span>
          <CodeBlockCopyButton value={code} />
        </CodeBlockActions>
      </CodeBlockHeader>
      <CodeBlockContent
        lineNumbers
        className="pt-3 text-[13px] leading-relaxed"
      >
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
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
  const patternMapping = getLabPatternMapping(lab.slug, locale)
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
        <article className="min-w-0 max-w-4xl space-y-12">
          {/* 1. Document Header & Executive Summary */}
          <header
            id="overview"
            className="scroll-mt-20 space-y-4 border-b pb-8"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link
                href="/"
                className="inline-flex cursor-pointer items-center gap-1 font-medium hover:text-foreground"
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
              <span className="rounded-md border bg-muted px-2 py-0.5 font-mono font-medium text-foreground">
                Lab {lab.code} • {lab.primaryMetric}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[34px] lg:leading-[1.2]">
              {lab.code} — {content.title}
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              <FormattedText text={content.subtitle} />
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {lab.libraries.map((lib) => (
                <span
                  key={lib}
                  className="rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs text-muted-foreground"
                >
                  {lib}
                </span>
              ))}
            </div>

            {/* Minimalist Monochrome Takeaway Callout */}
            <div className="mt-4 rounded-xl border bg-muted/30 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-foreground">
                <Lightbulb className="size-4 shrink-0 text-primary" />
                <span>{tPlaybook("keyTakeaway")}</span>
              </div>
              <p className="mt-2 text-[15px] leading-7 text-foreground/90">
                <FormattedText text={content.takeaway} />
              </p>
            </div>
          </header>

          {/* 2. Interactive Live Playground & Scorecard */}
          <section id="interactive-sandbox" className="scroll-mt-20 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                  <Play className="size-3.5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {tTabs("sandbox")}
                </h2>
              </div>

              <span className="font-mono text-xs text-muted-foreground">
                Mount Key: [{lab.slug}:{mode}]
              </span>
            </div>

            {/* Sandbox Frame */}
            <div className="overflow-hidden rounded-xl border bg-card">
              {/* Top Control Bar — Minimalist Monochrome Segmented Switch */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                <div className="inline-flex rounded-lg border bg-muted/70 p-1">
                  <button
                    type="button"
                    onClick={() => handleModeChange("bad")}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all",
                      mode === "bad"
                        ? "border border-border/80 bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <AlertTriangle
                      className={cn(
                        "size-3.5",
                        mode === "bad"
                          ? "text-amber-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <span>{tHud("modeBad")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleModeChange("good")}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-md px-3.5 py-1.5 text-[13px] font-medium transition-all",
                      mode === "good"
                        ? "border border-border/80 bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CheckCircle2
                      className={cn(
                        "size-3.5",
                        mode === "good"
                          ? "text-emerald-500"
                          : "text-muted-foreground"
                      )}
                    />
                    <span>{tHud("modeGood")}</span>
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
                <Info className="size-3.5 shrink-0 text-muted-foreground" />
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
                        <th className="pb-2.5 font-medium">
                          {tHud("baselineBad")}
                        </th>
                        <th className="pb-2.5 font-medium">
                          {tHud("optimizedGood")}
                        </th>
                        <th className="pb-2.5 font-medium">
                          {tHud("improvement")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-mono text-[13px]">
                      {(badSnap?.customMetric || goodSnap?.customMetric) && (
                        <tr className="bg-muted/30 font-semibold">
                          <td className="py-2.5 font-sans">
                            {badSnap?.customMetric?.label ??
                              goodSnap?.customMetric?.label}
                          </td>
                          <td className="py-2.5">
                            {badSnap?.customMetric
                              ? `${badSnap.customMetric.value}${badSnap.customMetric.unit}`
                              : "—"}
                          </td>
                          <td className="py-2.5">
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
                                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
                                    d.positive
                                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                      : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
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

          {/* 2.5 Real-World Scenarios & Decision Guide */}
          <section
            id="real-world-scenarios"
            className="scroll-mt-20 space-y-6 border-t pt-8"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                  <Compass className="size-3.5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {tPlaybook("scenariosTitle")}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {tPlaybook("scenariosSubtitle")}
              </p>
            </div>

            {/* Decision Checklist: When to Apply vs When NOT to Apply */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <span>{tPlaybook("whenToApplyTitle")}</span>
                </div>
                <ul className="space-y-2.5 text-[14px] leading-6 text-foreground/90">
                  {patternMapping.whenToApply.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      <span>
                        <FormattedText text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border bg-card p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <XCircle className="size-4 shrink-0 text-amber-500" />
                  <span>{tPlaybook("whenNotToApplyTitle")}</span>
                </div>
                <ul className="space-y-2.5 text-[14px] leading-6 text-foreground/90">
                  {patternMapping.whenNotToApply.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-amber-500" />
                      <span>
                        <FormattedText text={item} />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4 Concrete Real-World Product Scenarios */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {patternMapping.scenarios.map((scenario, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between rounded-xl border bg-card p-5 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-md border bg-muted/60 px-2.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground">
                        <Briefcase className="size-3 text-primary" />
                        <span>{scenario.domain}</span>
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        #{idx + 1}
                      </span>
                    </div>

                    <h3 className="text-[15.5px] font-semibold leading-snug text-foreground">
                      <FormattedText text={scenario.title} />
                    </h3>

                    <div className="space-y-2.5 pt-1 text-[13.5px] leading-6">
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          {tPlaybook("scenarioProblemLabel")}
                        </div>
                        <p className="mt-1 text-foreground/85">
                          <FormattedText text={scenario.problem} />
                        </p>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                          {tPlaybook("scenarioApplicationLabel")}
                        </div>
                        <p className="mt-1 text-foreground/90">
                          <FormattedText text={scenario.application} />
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 border-t pt-3 text-xs leading-5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
                    <div>
                      <span className="font-semibold">
                        {tPlaybook("scenarioOutcomeLabel")}:{" "}
                      </span>
                      <span className="text-foreground/85">
                        <FormattedText text={scenario.outcome} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. Deep-Dive Engineering Playbook (Editorial Documentation Prose) */}
          <section
            id="deep-dive"
            className="scroll-mt-20 space-y-8 border-t pt-8"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                <BookOpen className="size-3.5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {tTabs("playbook")}
              </h2>
            </div>

            <div className="space-y-8">
              {/* 3.1 Observed Symptoms */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <AlertCircle className="size-4 text-muted-foreground" />
                  <span>1. {tPlaybook("symptoms")}</span>
                </h3>
                <ul className="space-y-3 border-l-2 border-border pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.symptoms.map((item, i) => (
                    <li key={i}>
                      <FormattedText text={item} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3.2 Under the Hood */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Cpu className="size-4 text-muted-foreground" />
                  <span>2. {tPlaybook("underTheHood")}</span>
                </h3>
                <ul className="space-y-3 border-l-2 border-border pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.underTheHood.map((item, i) => (
                    <li key={i}>
                      <FormattedText text={item} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3.3 Optimization Architecture */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <CheckCircle2 className="size-4 text-muted-foreground" />
                  <span>3. {tPlaybook("solution")}</span>
                </h3>
                <ul className="space-y-3 border-l-2 border-border pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.solution.map((item, i) => (
                    <li key={i}>
                      <FormattedText text={item} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* 3.4 Trade-offs */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Scale className="size-4 text-muted-foreground" />
                  <span>4. {tPlaybook("tradeoffs")}</span>
                </h3>
                <ul className="space-y-3 border-l-2 border-border pl-4 text-[15.5px] leading-7 text-foreground/90">
                  {content.tradeoffs.map((item, i) => (
                    <li key={i}>
                      <FormattedText text={item} />
                    </li>
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
              <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                <Code2 className="size-3.5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {tTabs("codeDiff")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <LabCodePreview
                title={tPlaybook("badCodeTitle")}
                filename="baseline.tsx"
                code={lab.badCode}
                tone="baseline"
              />

              <LabCodePreview
                title={tPlaybook("goodCodeTitle")}
                filename="optimized.tsx"
                code={lab.goodCode}
                tone="optimized"
              />
            </div>
          </section>

          {/* 5. Chrome DevTools Profiling Step-by-Step Guide */}
          <section
            id="devtools-guide"
            className="scroll-mt-20 space-y-5 border-t pt-8"
          >
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                <Terminal className="size-3.5" />
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
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border bg-muted font-mono text-xs font-semibold text-foreground">
                    {idx + 1}
                  </span>
                  <span>
                    <FormattedText text={step} />
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Prev / Next Article Footer */}
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t pt-8">
            {prev ? (
              <Link
                href={`/labs/${prev.slug}`}
                className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/50"
              >
                <ArrowLeft className="size-4 text-muted-foreground" />
                <div>
                  <div className="text-xs text-muted-foreground">
                    Previous Guide
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
                className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-right text-sm transition-colors hover:bg-muted/50"
              >
                <div>
                  <div className="text-xs text-muted-foreground">
                    Next Guide
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

        {/* Right Sticky Table of Contents */}
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-6 border-l pl-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground">
                <ListChecks className="size-3.5 text-muted-foreground" />
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
                      ? "Tổng quan & Nguyên lý"
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
                    href="#real-world-scenarios"
                    className="block transition-colors hover:text-foreground"
                  >
                    {tTabs("scenarios")}
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
              <div className="inline-block rounded-md border bg-muted px-2.5 py-1 font-mono font-medium text-foreground">
                {lab.primaryMetric}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
