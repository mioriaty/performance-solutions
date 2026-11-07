"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bookmark,
  Box,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Compass,
  FileText,
  GitBranch,
  GitCompare,
  HelpCircle,
  Leaf,
  Play,
  RotateCcw,
  Sprout,
  Trash2,
} from "lucide-react"
import type { LabDefinition, LabSlug } from "@/lib/labs/types"
import {
  ALL_LABS,
  getAdjacentLabs,
  getLabPatternMapping,
  getPillarById,
} from "@/lib/labs/catalog"
import { useTelemetryStore, type LabMode } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
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
    <CodeBlock className="border-border bg-background/70">
      <CodeBlockHeader className="border-b border-border bg-muted/40 pb-3">
        <CodeBlockTitle>
          <span
            className={cn(
              "size-2 rounded-full",
              tone === "baseline" ? "bg-amber-400" : "bg-primary"
            )}
          />
          <span className="text-[13px] font-semibold">{title}</span>
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
        className="pt-3 text-[12.5px] leading-relaxed"
      >
        {lines.map((line, index) => (
          <CodeBlockLine key={index}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

/**
 * Pattern Garden Isometric Botanical Gate Illustration for the KEY POINT card
 */
function KeyPointIsometricIllustration({ pillarId }: { pillarId: number }) {
  return (
    <svg
      viewBox="0 0 140 105"
      className="h-24 w-32 shrink-0 select-none"
      fill="none"
      aria-hidden="true"
    >
      {/* Isometric Diamond Base Platform */}
      <polygon
        points="70,58 124,80 70,100 16,80"
        fill="#d8dfd5"
        fillOpacity="0.9"
      />
      <polygon
        points="16,80 70,100 70,104 16,84"
        fill="#9eb0a2"
        fillOpacity="0.85"
      />
      <polygon
        points="124,80 70,100 70,104 124,84"
        fill="#7c9081"
        fillOpacity="0.85"
      />

      {/* Inner Moss Patch */}
      <polygon
        points="70,63 112,80 70,95 28,80"
        fill="#537a5a"
        fillOpacity="0.45"
      />

      {/* Isometric Arch / Gate Frame (Matches Pattern Garden Proxy Gate) */}
      <path
        d="M46 78 V42 C46 26 94 26 94 42 V78"
        stroke="#7cc48e"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M52 76 V44 C52 32 88 32 88 44 V76"
        stroke="#2f4b36"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Vertical Gate Bars */}
      <line
        x1="59"
        y1="44"
        x2="59"
        y2="82"
        stroke="#9ec5a6"
        strokeWidth="2.5"
      />
      <line
        x1="70"
        y1="40"
        x2="70"
        y2="85"
        stroke="#9ec5a6"
        strokeWidth="2.5"
      />
      <line
        x1="81"
        y1="44"
        x2="81"
        y2="82"
        stroke="#9ec5a6"
        strokeWidth="2.5"
      />
      {/* Horizontal Crossbars */}
      <line
        x1="49"
        y1="56"
        x2="91"
        y2="56"
        stroke="#7cc48e"
        strokeWidth="2.5"
      />
      <line
        x1="49"
        y1="68"
        x2="91"
        y2="68"
        stroke="#7cc48e"
        strokeWidth="2.5"
      />

      {/* Warm Terracotta Pillar Nodes */}
      <rect x="40" y="64" width="7" height="17" rx="3" fill="#cfa07a" />
      <rect x="93" y="64" width="7" height="17" rx="3" fill="#cfa07a" />

      {/* Botanical Sprout Accent */}
      <circle cx="32" cy="76" r="4" fill="#7cc48e" />
      <circle cx="108" cy="76" r="3.5" fill="#7cc48e" fillOpacity="0.7" />
      <text
        x="70"
        y="22"
        textAnchor="middle"
        fill="#7cc48e"
        fontSize="9"
        fontFamily="monospace"
        fontWeight="600"
      >
        P{pillarId}
      </text>
    </svg>
  )
}

/**
 * Isometric Inspector Avatar inside the "IN THIS STEP" card
 */
function StepInspectorIllustration({ mode }: { mode: LabMode }) {
  const isGood = mode === "good"
  return (
    <svg
      viewBox="0 0 120 76"
      className="mx-auto h-18 w-28 select-none"
      fill="none"
      aria-hidden="true"
    >
      {/* Isometric Tile */}
      <polygon
        points="60,44 104,58 60,72 16,58"
        fill={isGood ? "#d8e6dc" : "#e6d8cc"}
      />
      <polygon
        points="16,58 60,72 60,75 16,61"
        fill={isGood ? "#8ea895" : "#b39782"}
      />
      <polygon
        points="104,58 60,72 60,75 104,61"
        fill={isGood ? "#698571" : "#8f735e"}
      />
      {/* Character / Node Figure */}
      <rect
        x="48"
        y="30"
        width="24"
        height="24"
        rx="8"
        fill={isGood ? "#4b7b58" : "#9c6b49"}
      />
      <circle cx="60" cy="20" r="11" fill="#f1d6b8" />
      <path
        d="M49 18 C49 11 71 11 71 18"
        fill={isGood ? "#639670" : "#b57c52"}
      />
      <circle cx="56" cy="21" r="1.3" fill="#1e2d24" />
      <circle cx="64" cy="21" r="1.3" fill="#1e2d24" />
      {/* Status Orb */}
      <circle cx="84" cy="48" r="5" fill={isGood ? "#7cc48e" : "#ebb474"} />
    </svg>
  )
}

export function LabWorkbench({ lab }: { lab: LabDefinition }) {
  const locale = useLocale() as Locale
  const isVi = locale === "vi"
  const tHud = useTranslations("hud")
  const tPlaybook = useTranslations("playbook")

  const mode = useTelemetryStore((s) => s.mode)
  const setMode = useTelemetryStore((s) => s.setMode)
  const fps = useTelemetryStore((s) => s.fps)
  const tbtMs = useTelemetryStore((s) => s.tbtMs)
  const customMetric = useTelemetryStore((s) => s.customMetric)
  const captureSnapshot = useTelemetryStore((s) => s.captureSnapshot)
  const clearSnapshots = useTelemetryStore((s) => s.clearSnapshots)
  const resetCounters = useTelemetryStore((s) => s.resetCounters)
  const labSnapshots = useTelemetryStore((s) => s.snapshots[lab.slug])

  const savedLabs = useTelemetryStore((s) => s.savedLabs)
  const labNotes = useTelemetryStore((s) => s.labNotes)
  const markLabViewed = useTelemetryStore((s) => s.markLabViewed)
  const toggleSavedLab = useTelemetryStore((s) => s.toggleSavedLab)
  const setLabNote = useTelemetryStore((s) => s.setLabNote)

  const [activeTab, setActiveTab] = useState<"model" | "diagram" | "code">(
    "model"
  )
  const [stressTrigger, setStressTrigger] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [scenarioCaseIdx, setScenarioCaseIdx] = useState(0)

  const pillar = getPillarById(lab.pillarId)
  const { prev, next } = getAdjacentLabs(lab.slug)
  const content = lab.content[locale] ?? lab.content.vi
  const patternMapping = getLabPatternMapping(lab.slug, locale)
  const ActiveSandbox = LAB_COMPONENTS[lab.slug]

  const labIndex = ALL_LABS.findIndex((l) => l.slug === lab.slug)
  const defaultCompareLab =
    ALL_LABS.find((l) => l.pillarId === lab.pillarId && l.slug !== lab.slug) ??
    next ??
    prev ??
    ALL_LABS[0]

  const [customCompareSlug, setCustomCompareSlug] = useState<LabSlug | null>(
    null
  )
  const compareSlug =
    customCompareSlug && customCompareSlug !== lab.slug
      ? customCompareSlug
      : defaultCompareLab.slug

  useEffect(() => {
    setMode("bad")
    markLabViewed(lab.slug)
  }, [lab.slug, setMode, markLabViewed])

  const safeStepIdx = stepIdx < content.devtoolsSteps.length ? stepIdx : 0
  const safeScenarioCaseIdx =
    scenarioCaseIdx < patternMapping.scenarios.length ? scenarioCaseIdx : 0

  const handleModeChange = (nextMode: LabMode) => {
    if (nextMode === mode) return
    setStressTrigger(0)
    setMode(nextMode)
  }

  const badSnap = labSnapshots?.bad
  const goodSnap = labSnapshots?.good
  const isSaved = savedLabs.includes(lab.slug)
  const currentNote = labNotes[lab.slug] ?? ""

  const totalSteps = Math.max(1, content.devtoolsSteps.length)
  const currentStepText =
    content.devtoolsSteps[safeStepIdx] ?? content.devtoolsSteps[0] ?? ""

  const comparedLab =
    ALL_LABS.find((l) => l.slug === compareSlug) ?? defaultCompareLab
  const comparedContent = comparedLab.content[locale] ?? comparedLab.content.vi

  const activeProductScenario =
    patternMapping.scenarios[safeScenarioCaseIdx] ?? patternMapping.scenarios[0]

  return (
    <div className="mx-auto max-w-[1350px] px-4 py-8 sm:px-6 lg:px-8">
      <article className="space-y-6">
        {/* 1. PATTERN GARDEN HEADER */}
        <header className="space-y-3">
          {/* Eyebrow Row: [• Structural]  PATTERN 12 / 18 */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/12 px-2.5 py-0.5 text-[12px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>{pillar ? pillar.title[locale] : "Performance"}</span>
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              PATTERN {labIndex + 1} / {ALL_LABS.length} · LAB {lab.code}
            </span>
          </div>

          {/* Title Row: Title * on Left | [Save this pattern] [<] [>] on Right */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[38px] sm:leading-[1.15]">
              <span>{content.title}</span>{" "}
              <span className="font-light text-primary select-none">*</span>
            </h1>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSavedLab(lab.slug)}
                className={cn(
                  "inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition-colors",
                  isSaved
                    ? "border-primary/50 bg-primary/15 text-primary"
                    : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/60"
                )}
              >
                <Bookmark
                  className={cn("size-3.5", isSaved && "fill-primary")}
                />
                <span>
                  {isSaved
                    ? isVi
                      ? "Đã lưu pattern"
                      : "Saved pattern"
                    : isVi
                      ? "Lưu pattern này"
                      : "Save this pattern"}
                </span>
              </button>

              {prev ? (
                <Link
                  href={`/labs/${prev.slug}`}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  title={`Previous: ${prev.content[locale].title}`}
                  aria-label="Previous pattern"
                >
                  <ChevronLeft className="size-4" />
                </Link>
              ) : (
                <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/30">
                  <ChevronLeft className="size-4" />
                </span>
              )}

              {next ? (
                <Link
                  href={`/labs/${next.slug}`}
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  title={`Next: ${next.content[locale].title}`}
                  aria-label="Next pattern"
                >
                  <ChevronRight className="size-4" />
                </Link>
              ) : (
                <span className="inline-flex size-9 items-center justify-center rounded-xl border border-border/50 bg-card/40 text-muted-foreground/30">
                  <ChevronRight className="size-4" />
                </span>
              )}
            </div>
          </div>

          {/* Concise Lead Summary */}
          <p className="max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">
            <FormattedText text={content.subtitle} />
          </p>
        </header>

        {/* 2. TOP TABBED INTERACTIVE STAGE CARD (3D/Interactive model | Structure diagram | TypeScript code) */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Card Top Tab Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 pt-3">
            <div className="flex items-center gap-6 text-[13px]">
              <button
                type="button"
                onClick={() => setActiveTab("model")}
                className={cn(
                  "flex cursor-pointer items-center gap-2 border-b-2 pb-3 font-medium transition-colors",
                  activeTab === "model"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Box className="size-3.5 text-primary" />
                <span>{isVi ? "Mô hình tương tác" : "Interactive model"}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("diagram")}
                className={cn(
                  "flex cursor-pointer items-center gap-2 border-b-2 pb-3 font-medium transition-colors",
                  activeTab === "diagram"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <GitBranch className="size-3.5 text-primary" />
                <span>
                  {isVi ? "Sơ đồ cơ chế & DevTools" : "Structure diagram"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={cn(
                  "flex cursor-pointer items-center gap-2 border-b-2 pb-3 font-medium transition-colors",
                  activeTab === "code"
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Code2 className="size-3.5 text-primary" />
                <span>TypeScript code</span>
              </button>
            </div>

            {/* Library & Metric Badges */}
            <div className="hidden items-center gap-1.5 pb-2.5 sm:flex">
              <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-medium text-primary">
                {lab.primaryMetric}
              </span>
              {lab.libraries.slice(0, 2).map((lib) => (
                <span
                  key={lib}
                  className="rounded-md border border-border bg-muted/60 px-2 py-0.5 font-mono text-[11px] text-muted-foreground"
                >
                  {lib}
                </span>
              ))}
            </div>
          </div>

          {/* Stage Main Body */}
          <div className="space-y-5 p-5 sm:p-6">
            {/* THE EXAMPLE Headline & Controls Row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl space-y-1.5">
                <div className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  {isVi ? "VÍ DỤ THỰC NGHIỆM" : "THE EXAMPLE"}
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-[22px]">
                  {content.symptomSummary}
                </h2>
                <p className="text-[14px] leading-relaxed text-muted-foreground">
                  <FormattedText text={content.rootCauseSummary} />
                </p>
              </div>

              {/* Right Stage Action Controls (Capture Snapshot + Reset) */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => captureSnapshot(lab.slug, mode)}
                  className="inline-flex h-8.5 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/80 px-3 text-[12px] font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted"
                >
                  <Camera className="size-3.5 text-primary" />
                  <span>{tHud("captureSnapshot")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetCounters()
                    setStressTrigger(0)
                  }}
                  className="inline-flex size-8.5 cursor-pointer items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                  title={tHud("resetMetrics")}
                  aria-label={tHud("resetMetrics")}
                >
                  <RotateCcw className="size-3.5" />
                </button>
              </div>
            </div>

            {/* TAB 1: INTERACTIVE MODEL + IN THIS STEP INSPECTOR */}
            {activeTab === "model" && (
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_255px]">
                {/* Left: Interactive Sandbox Canvas + Optional Scorecard */}
                <div className="space-y-4">
                  {/* Legend line matching Pattern Garden */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-muted-foreground">
                    <span className="font-mono">
                      Mount: [{lab.slug}:{mode}]
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-0.5 w-3 bg-primary" />
                        <span>
                          {isVi
                            ? "Tương tác trực tiếp"
                            : "Live DOM interactions"}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-0.5 w-3 border-b border-dashed border-muted-foreground" />
                        <span>
                          {isVi ? "Đo lường Telemetry" : "Telemetry observer"}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Sandbox Viewport */}
                  <div className="rounded-xl border border-border bg-background/70 p-4 sm:p-5">
                    <ActiveSandbox
                      key={`${lab.slug}-${mode}`}
                      mode={mode}
                      locale={locale}
                      stressTrigger={stressTrigger}
                    />
                  </div>

                  {/* Live Benchmark Scorecard (When user saves snapshots or wants to compare) */}
                  {(badSnap || goodSnap) && (
                    <div className="space-y-2.5 rounded-xl border border-border bg-background/50 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-foreground">
                          {tHud("scorecardTitle")}
                        </span>
                        <button
                          type="button"
                          onClick={() => clearSnapshots(lab.slug)}
                          className="inline-flex cursor-pointer items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <Trash2 className="size-3" />
                          <span>{tHud("clearSnapshots")}</span>
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left font-mono text-[12px]">
                          <thead>
                            <tr className="border-b border-border text-muted-foreground">
                              <th className="pb-2 font-sans font-medium">
                                Metric
                              </th>
                              <th className="pb-2 font-medium">Baseline</th>
                              <th className="pb-2 font-medium">Optimized</th>
                              <th className="pb-2 font-medium">Delta</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/60">
                            {(badSnap?.customMetric ||
                              goodSnap?.customMetric) && (
                              <tr>
                                <td className="py-2 font-sans font-medium text-foreground">
                                  {badSnap?.customMetric?.label ??
                                    goodSnap?.customMetric?.label}
                                </td>
                                <td className="py-2">
                                  {badSnap?.customMetric
                                    ? `${badSnap.customMetric.value}${badSnap.customMetric.unit}`
                                    : "—"}
                                </td>
                                <td className="py-2 text-primary">
                                  {goodSnap?.customMetric
                                    ? `${goodSnap.customMetric.value}${goodSnap.customMetric.unit}`
                                    : "—"}
                                </td>
                                <td className="py-2">
                                  {formatDelta(
                                    badSnap?.customMetric?.value,
                                    goodSnap?.customMetric?.value,
                                    badSnap?.customMetric?.lowerIsBetter ?? true
                                  )?.text ?? "—"}
                                </td>
                              </tr>
                            )}
                            <tr>
                              <td className="py-1.5 font-sans">Min FPS</td>
                              <td className="py-1.5">
                                {badSnap ? `${badSnap.minFps} FPS` : "—"}
                              </td>
                              <td className="py-1.5 text-primary">
                                {goodSnap ? `${goodSnap.minFps} FPS` : "—"}
                              </td>
                              <td className="py-1.5">
                                {formatDelta(
                                  badSnap?.minFps,
                                  goodSnap?.minFps,
                                  false
                                )?.text ?? "—"}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-1.5 font-sans">TBT / INP</td>
                              <td className="py-1.5">
                                {badSnap
                                  ? `${badSnap.tbtMs}ms / ${badSnap.inpMs}ms`
                                  : "—"}
                              </td>
                              <td className="py-1.5 text-primary">
                                {goodSnap
                                  ? `${goodSnap.tbtMs}ms / ${goodSnap.inpMs}ms`
                                  : "—"}
                              </td>
                              <td className="py-1.5">
                                {formatDelta(
                                  badSnap?.tbtMs,
                                  goodSnap?.tbtMs,
                                  true
                                )?.text ?? "—"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: "IN THIS STEP" Contextual Inspector Card (Pattern Garden Signature) */}
                <aside className="flex flex-col justify-between space-y-4 rounded-xl border border-border bg-background/50 p-4">
                  <div className="space-y-3">
                    <div className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                      IN THIS STEP
                    </div>

                    <StepInspectorIllustration mode={mode} />

                    <div>
                      <span
                        className={cn(
                          "inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] font-medium",
                          mode === "bad"
                            ? "border-[var(--garden-pitfall-border)] bg-[var(--garden-pitfall-bg)] text-[var(--garden-pitfall-text)]"
                            : "border-primary/40 bg-primary/15 text-primary"
                        )}
                      >
                        {mode === "bad"
                          ? isVi
                            ? "Baseline (Gây nghẽn)"
                            : "Bottleneck"
                          : isVi
                            ? "Optimized (Đã tối ưu)"
                            : "Optimized"}
                      </span>

                      <h3 className="mt-2 text-[17px] font-bold text-foreground">
                        {mode === "bad"
                          ? isVi
                            ? "Thực thi trực tiếp"
                            : "Unoptimized Call"
                          : isVi
                            ? "Kiểm soát chi phí"
                            : "Guarded Execution"}
                      </h3>
                    </div>

                    <p className="text-[13px] leading-relaxed text-muted-foreground">
                      <FormattedText text={currentStepText} />
                    </p>

                    {/* Live Metric Mini Readout */}
                    <div className="rounded-lg border border-border bg-card/80 p-2.5 font-mono text-[11.5px]">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">FPS / TBT</span>
                        <span className="font-semibold text-foreground">
                          {fps} FPS · {tbtMs}ms
                        </span>
                      </div>
                      {customMetric && (
                        <div className="mt-1 flex items-center justify-between border-t border-border/60 pt-1">
                          <span className="truncate text-muted-foreground">
                            {customMetric.label}
                          </span>
                          <span className="font-semibold text-primary">
                            {customMetric.value}
                            {customMetric.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bottom Leaf Note */}
                  <div className="border-t border-border pt-3 text-[12px] leading-relaxed text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <Leaf className="mt-0.5 size-3.5 shrink-0 text-primary" />
                      <span>
                        <FormattedText text={content.takeaway} />
                      </span>
                    </div>
                  </div>
                </aside>
              </div>
            )}

            {/* TAB 2: STRUCTURE DIAGRAM & DEVTOOLS WORKFLOW */}
            {activeTab === "diagram" && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Baseline Structural Path */}
                  <div className="space-y-3 rounded-xl border border-[var(--garden-pitfall-border)] bg-[var(--garden-pitfall-bg)]/50 p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold tracking-wider text-[var(--garden-pitfall-text)] uppercase">
                        {isVi
                          ? "• LUỒNG CHƯA TỐI ƯU (ANTI-PATTERN)"
                          : "• BASELINE STRUCTURE (BOTTLENECK)"}
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        mode = &quot;bad&quot;
                      </span>
                    </div>
                    <ul className="space-y-2.5 text-[13.5px] leading-6 text-foreground/90">
                      {content.underTheHood.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--garden-pitfall-text)]" />
                          <span>
                            <FormattedText text={item} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Optimized Structural Path */}
                  <div className="space-y-3 rounded-xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)]/60 p-5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-semibold tracking-wider text-primary uppercase">
                        {isVi
                          ? "• KIẾN TRÚC ĐÃ TỐI ƯU (PRODUCTION)"
                          : "• OPTIMIZED STRUCTURE (SOLUTION)"}
                      </span>
                      <span className="font-mono text-xs text-primary">
                        mode = &quot;good&quot;
                      </span>
                    </div>
                    <ul className="space-y-2.5 text-[13.5px] leading-6 text-foreground/90">
                      {content.solution.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                          <span>
                            <FormattedText text={item} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* DevTools Verification Checklist */}
                <div className="space-y-3 rounded-xl border border-border bg-background/60 p-5">
                  <div className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    {tPlaybook("devtoolsTitle")}
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                    {content.devtoolsSteps.map((step, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setStepIdx(idx)}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left text-[13.5px] leading-6 transition-colors",
                          stepIdx === idx
                            ? "border-primary/50 bg-primary/10 text-foreground"
                            : "border-border bg-card/70 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/15 font-mono text-[11px] font-semibold text-primary">
                          {idx + 1}
                        </span>
                        <span>
                          <FormattedText text={step} />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: TYPESCRIPT CODE COMPARISON */}
            {activeTab === "code" && (
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
            )}
          </div>

          {/* Stage Bottom Control Bars (Pattern Garden Signature: Try a scenario + Stepper) */}
          <div className="divide-y divide-border border-t border-border bg-background/40">
            {/* Bar 1: ⑂ Try a scenario */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <GitBranch className="size-3.5 text-primary" />
                  <span>{isVi ? "Thử kịch bản" : "Try a scenario"}</span>
                </span>

                <button
                  type="button"
                  onClick={() => handleModeChange("bad")}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    mode === "bad"
                      ? "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "bad" && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                  <span>{tHud("modeBad")}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleModeChange("good")}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition-colors",
                    mode === "good"
                      ? "border-primary/50 bg-primary/15 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                >
                  {mode === "good" && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                  <span>{tHud("modeGood")}</span>
                </button>
              </div>

              <span className="text-[12.5px] text-muted-foreground">
                {mode === "bad"
                  ? isVi
                    ? "Tái hiện trực tiếp điểm nghẽn trên Main Thread."
                    : "Reproduces the unoptimized bottleneck on the main thread."
                  : isVi
                    ? "Áp dụng mẫu kiến trúc tối ưu để giữ vững 60 FPS."
                    : "Applies the optimization pattern to protect the frame budget."}
              </span>
            </div>

            {/* Bar 2: ▶ STEP 1 / N Playback & Stepper Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                {/* Round Sage Play Button (Runs Stress Benchmark + Steps) */}
                <button
                  type="button"
                  onClick={() => {
                    setStressTrigger((c) => c + 1)
                    setStepIdx((s) => (s + 1) % totalSteps)
                  }}
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-transform hover:scale-105 active:scale-95"
                  title={tHud("runStressTest")}
                  aria-label={tHud("runStressTest")}
                >
                  <Play className="ml-0.5 size-4 fill-current" />
                </button>

                {/* Step Counter + Progress Pills */}
                <div className="shrink-0 space-y-1.5">
                  <div className="font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
                    STEP {stepIdx + 1} / {totalSteps}
                  </div>
                  <div className="flex items-center gap-1">
                    {content.devtoolsSteps.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setStepIdx(idx)}
                        className={cn(
                          "h-1.5 cursor-pointer rounded-full transition-all",
                          stepIdx === idx
                            ? "w-4 bg-primary"
                            : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                        )}
                        aria-label={`Go to step ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Current Step Text */}
                <div className="min-w-0 flex-1 pl-1">
                  <div className="truncate text-[13.5px] font-semibold text-foreground">
                    {isVi
                      ? `Bước kiểm chứng ${stepIdx + 1} (${tHud("runStressTest")})`
                      : `Verification Step ${stepIdx + 1} (Click Play to benchmark)`}
                  </div>
                  <div className="line-clamp-1 text-[13px] text-muted-foreground">
                    <FormattedText text={currentStepText} />
                  </div>
                </div>
              </div>

              {/* Prev / Next Step Chevron Buttons */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={stepIdx === 0}
                  onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={stepIdx >= totalSteps - 1}
                  onClick={() =>
                    setStepIdx((s) => Math.min(totalSteps - 1, s + 1))
                  }
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:text-foreground disabled:opacity-35"
                  aria-label="Next step"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO ROW 1: 📖 HOW IT WORKS (65%) + 🌱 KEY POINT (35%) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left Card: HOW IT WORKS */}
          <section className="space-y-5 rounded-2xl border border-border bg-card p-6 lg:col-span-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                <BookOpen className="size-3.5 text-primary" />
                <span>{isVi ? "CƠ CHẾ HOẠT ĐỘNG" : "HOW IT WORKS"}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {content.symptomSummary}
              </h2>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">
                <FormattedText text={content.rootCauseSummary} />
              </p>
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              {/* • The problem */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                  <span className="size-1.5 rounded-full bg-[var(--garden-pitfall-text)]" />
                  <span>{isVi ? "Vấn đề (The problem)" : "The problem"}</span>
                </div>
                <div className="space-y-2 pl-3.5 text-[14px] leading-relaxed text-muted-foreground">
                  {content.symptoms.slice(0, 2).map((item, i) => (
                    <p key={i}>
                      <FormattedText text={item} />
                    </p>
                  ))}
                  {content.underTheHood[0] && (
                    <p>
                      <FormattedText text={content.underTheHood[0]} />
                    </p>
                  )}
                </div>
              </div>

              {/* Down Arrow ↓ */}
              <div className="pl-3.5 text-muted-foreground">
                <ArrowDown className="size-4" />
              </div>

              {/* • The solution */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[15px] font-bold text-foreground">
                  <span className="size-1.5 rounded-full bg-primary" />
                  <span>
                    {isVi ? "Giải pháp (The solution)" : "The solution"}
                  </span>
                </div>
                <div className="space-y-2 pl-3.5 text-[14px] leading-relaxed text-muted-foreground">
                  {content.solution.map((item, i) => (
                    <p key={i}>
                      <FormattedText text={item} />
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Right Card: 🌱 KEY POINT (Olive Tinted Card with Quote & Isometric SVG) */}
          <section className="flex flex-col justify-between rounded-2xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] p-6 lg:col-span-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                <Sprout className="size-3.5 text-primary" />
                <span>{isVi ? "ĐIỂM CỐT LÕI" : "KEY POINT"}</span>
              </div>

              <div className="font-serif text-5xl leading-none text-primary/70 select-none">
                “
              </div>

              <p className="text-[17px] leading-snug font-bold text-foreground">
                <FormattedText text={content.takeaway} />
              </p>
            </div>

            <div className="mt-6 space-y-2">
              <div className="flex justify-end">
                <KeyPointIsometricIllustration pillarId={lab.pillarId} />
              </div>
              <div className="text-[12px] text-muted-foreground">
                {isVi
                  ? "Cơ chế cốt lõi đằng sau bài thực nghiệm."
                  : "The mechanism behind the example."}
              </div>
            </div>
          </section>
        </div>

        {/* 4. BENTO ROW 2: [✓] When to use it (50%) + [?] Trade-offs (50%) */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* When to use it */}
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/15 text-primary">
                <Check className="size-3.5" />
              </span>
              <h2 className="text-[17px] font-bold text-foreground">
                {isVi ? "Khi nào nên áp dụng" : "When to use it"}
              </h2>
            </div>

            <ul className="space-y-3 text-[14px] leading-relaxed text-muted-foreground">
              {patternMapping.whenToApply.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary/80" />
                  <span>
                    <FormattedText text={item} />
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* Trade-offs */}
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-2.5">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-[var(--garden-pitfall-border)] bg-[var(--garden-pitfall-bg)] text-[var(--garden-pitfall-text)]">
                <HelpCircle className="size-3.5" />
              </span>
              <h2 className="text-[17px] font-bold text-foreground">
                {isVi ? "Đánh đổi (Trade-offs)" : "Trade-offs"}
              </h2>
            </div>

            <ul className="space-y-3 text-[14px] leading-relaxed text-muted-foreground">
              {content.tradeoffs.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-muted-foreground/60" />
                  <span>
                    <FormattedText text={item} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* 5. FULL-WIDTH WARM AMBER CALLOUT: ? Common pitfall */}
        <section className="space-y-2.5 rounded-2xl border border-[var(--garden-pitfall-border)] bg-[var(--garden-pitfall-bg)] p-5 sm:p-6">
          <div className="flex items-center gap-2 text-[14.5px] font-bold text-[var(--garden-pitfall-text)]">
            <HelpCircle className="size-4 shrink-0" />
            <span>
              {isVi ? "Bẫy phổ biến & Khi KHÔNG nên áp dụng" : "Common pitfall"}
            </span>
          </div>
          <div className="space-y-2 text-[14px] leading-relaxed text-foreground/90">
            {patternMapping.whenNotToApply.map((item, idx) => (
              <p key={idx}>
                <FormattedText text={item} />
              </p>
            ))}
          </div>
        </section>

        {/* 6. REAL-WORLD SCENARIOS CARD (With Pattern Garden Pill Switcher) */}
        {activeProductScenario && (
          <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  <Compass className="size-3.5 text-primary" />
                  <span>
                    {isVi
                      ? "TÌNH HUỐNG SẢN PHẨM THỰC TẾ"
                      : "PRODUCTION SCENARIOS"}
                  </span>
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {tPlaybook("scenariosTitle")}
                </h2>
              </div>

              {/* Pill Switcher (#1 -> #4) */}
              <div className="flex flex-wrap items-center gap-1.5">
                {patternMapping.scenarios.map((sc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setScenarioCaseIdx(idx)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      scenarioCaseIdx === idx
                        ? "border-primary/50 bg-primary/15 text-foreground"
                        : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {scenarioCaseIdx === idx && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                    <span>{sc.domain}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-background/50 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[16px] font-bold text-foreground">
                  <FormattedText text={activeProductScenario.title} />
                </h3>
                <span className="font-mono text-xs text-muted-foreground">
                  Scenario #{scenarioCaseIdx + 1} /{" "}
                  {patternMapping.scenarios.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5 rounded-xl border border-border bg-card p-4">
                  <div className="text-[10.5px] font-semibold tracking-[0.12em] text-[var(--garden-pitfall-text)] uppercase">
                    {tPlaybook("scenarioProblemLabel")}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                    <FormattedText text={activeProductScenario.problem} />
                  </p>
                </div>

                <div className="space-y-1.5 rounded-xl border border-border bg-card p-4">
                  <div className="text-[10.5px] font-semibold tracking-[0.12em] text-primary uppercase">
                    {tPlaybook("scenarioApplicationLabel")}
                  </div>
                  <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                    <FormattedText text={activeProductScenario.application} />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] px-4 py-3 text-[13.5px] text-foreground">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
                <div>
                  <span className="font-semibold text-primary">
                    {tPlaybook("scenarioOutcomeLabel")}:{" "}
                  </span>
                  <span>
                    <FormattedText text={activeProductScenario.outcome} />
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 7. COMPARE PATTERNS CARD (Screenshot 3 Signature) */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                <GitCompare className="size-3.5 text-primary" />
                <span>{isVi ? "SO SÁNH PATTERN" : "COMPARE PATTERNS"}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {isVi
                  ? "Sự khác biệt giữa các kỹ thuật này"
                  : "How these patterns differ"}
              </h2>
            </div>

            {/* Dropdown: Compare with [...] */}
            <div className="flex items-center gap-2 rounded-xl border border-border bg-background/70 px-3 py-1.5 text-[12.5px]">
              <span className="text-muted-foreground">
                {isVi ? "So sánh với" : "Compare with"}
              </span>
              <select
                value={compareSlug}
                onChange={(e) =>
                  setCustomCompareSlug(e.target.value as LabSlug)
                }
                className="cursor-pointer bg-transparent font-semibold text-foreground focus:outline-none"
                aria-label="Select pattern to compare"
              >
                {ALL_LABS.filter((l) => l.slug !== lab.slug).map((item) => (
                  <option
                    key={item.slug}
                    value={item.slug}
                    className="bg-card text-foreground"
                  >
                    {item.code} — {item.content[locale].title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
            {/* Selected Component */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
                {isVi ? "PATTERN ĐANG XEM" : "SELECTED PATTERN"}
              </div>
              <div className="text-[17px] font-bold text-foreground">
                {content.title}
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                <FormattedText text={content.symptomSummary} />
              </p>
            </div>

            {/* Italic vs. */}
            <div className="font-serif text-base text-muted-foreground italic">
              vs.
            </div>

            {/* Related Pattern */}
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
                {isVi ? "PATTERN LIÊN QUAN" : "RELATED PATTERN"}
              </div>
              <Link
                href={`/labs/${comparedLab.slug}`}
                className="inline-flex cursor-pointer items-center gap-1 text-[17px] font-bold text-foreground transition-colors hover:text-primary"
              >
                <span>{comparedContent.title}</span>
                <ArrowUpRight className="size-4 text-muted-foreground" />
              </Link>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                <FormattedText text={comparedContent.symptomSummary} />
              </p>
            </div>
          </div>

          {/* Olive Summary Strip */}
          <div className="flex items-start gap-2.5 rounded-xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] px-4 py-3 text-[13.5px] text-foreground">
            <Leaf className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              {isVi ? (
                <>
                  Cả hai đều bảo vệ trải nghiệm người dùng trên trình duyệt.{" "}
                  <strong>{content.title}</strong> tập trung tối ưu chỉ số{" "}
                  <code>{lab.primaryMetric}</code>, trong khi{" "}
                  <strong>{comparedContent.title}</strong> giải quyết điểm nghẽn{" "}
                  <code>{comparedLab.primaryMetric}</code>.
                </>
              ) : (
                <>
                  Both patterns protect runtime responsiveness.{" "}
                  <strong>{content.title}</strong> targets{" "}
                  <code>{lab.primaryMetric}</code> bottlenecks, while{" "}
                  <strong>{comparedContent.title}</strong> addresses{" "}
                  <code>{comparedLab.primaryMetric}</code> constraints.
                </>
              )}
            </span>
          </div>
        </section>

        {/* 8. YOUR NOTES CARD (Screenshot 3 Signature — Saved automatically in localStorage) */}
        <section className="rounded-2xl border border-border bg-card p-6">
          <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-12">
            <div className="space-y-2 md:col-span-5">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                <FileText className="size-3.5 text-primary" />
                <span>{isVi ? "GHI CHÚ CỦA BẠN" : "YOUR NOTES"}</span>
              </div>
              <h2 className="text-[19px] font-bold tracking-tight text-foreground">
                {isVi
                  ? "Bạn có thể áp dụng mẫu này ở đâu?"
                  : "Where could you use this pattern?"}
              </h2>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                {isVi
                  ? "Ghi chú lại một vấn đề trong dự án thực tế của bạn mà kỹ thuật này có thể giải quyết."
                  : "Note a problem in your project that this pattern could help solve."}
              </p>
            </div>

            <div className="space-y-2 md:col-span-7">
              <textarea
                rows={3}
                value={currentNote}
                onChange={(e) => setLabNote(lab.slug, e.target.value)}
                placeholder={
                  isVi
                    ? `Ví dụ: Tôi có thể áp dụng ${content.title} cho màn hình...`
                    : `For example: I could use ${content.title} to optimize...`
                }
                className="w-full rounded-xl border border-border bg-background/70 p-3.5 text-[13.5px] text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none"
              />
              <div className="flex items-center justify-end gap-1.5 text-[11.5px] text-muted-foreground">
                <Check className="size-3 text-primary" />
                <span>
                  {isVi
                    ? "Đã lưu tự động trong trình duyệt này"
                    : "Saved automatically in this browser"}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 9. PATTERN LAB FOOTER & LESSON NAVIGATION */}
        <div className="space-y-6 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-muted-foreground">
            <span>
              {isVi
                ? "Perf Lab cung cấp mô phỏng, giải thích và mã nguồn thực nghiệm trực tiếp trên trình duyệt."
                : "Perf Lab provides live isolated benchmarks, explanations, and architectural comparisons."}
            </span>
            <Link
              href="/foundations"
              className="inline-flex cursor-pointer items-center gap-1 text-foreground hover:text-primary"
            >
              <span>
                {isVi
                  ? "Đọc tài liệu nền tảng Event Loop"
                  : "Read the Foundations reference"}
              </span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          {/* Prev / Next Lesson Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            {prev ? (
              <Link
                href={`/labs/${prev.slug}`}
                className="group flex cursor-pointer items-center gap-3 text-left"
              >
                <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
                <div>
                  <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    {isVi ? "BÀI HỌC TRƯỚC" : "PREVIOUS LESSON"}
                  </div>
                  <div className="mt-0.5 text-[15px] font-bold text-foreground group-hover:text-primary">
                    {prev.content[locale].title}
                  </div>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/labs/${next.slug}`}
                className="group flex cursor-pointer items-center gap-3 text-right"
              >
                <div>
                  <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    {isVi ? "BÀI HỌC TIẾP THEO" : "NEXT LESSON"}
                  </div>
                  <div className="mt-0.5 text-[15px] font-bold text-foreground group-hover:text-primary">
                    {next.content[locale].title}
                  </div>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Bottom Brand Signature */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-[12px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Sprout className="size-3.5 text-primary" />
              <span>
                Perf Lab ·{" "}
                {isVi
                  ? "Tối ưu hiệu năng Frontend qua ví dụ thực tế."
                  : "Frontend performance through interactive examples."}
              </span>
            </div>
            <span>
              {ALL_LABS.length} patterns ·{" "}
              {isVi ? "Không cần tài khoản." : "No account needed."}
            </span>
          </div>
        </div>
      </article>
    </div>
  )
}
