"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Box,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Compass,
  Cpu,
  Eye,
  FileText,
  Gauge,
  GitBranch,
  GitCompare,
  HelpCircle,
  Layers,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react"
import type { LabDefinition, LabSlug } from "@/lib/labs/types"
import {
  ALL_LABS,
  getAdjacentLabs,
  getLabPatternMapping,
  getPillarById,
} from "@/lib/labs/catalog"
import { getCourseChapters } from "@/lib/course-tree"
import { useTelemetryStore, type LabMode } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  WorkbookHorizontalStepper,
  WorkbookMetricStrip,
  WorkbookRightInspector,
  type StageMetricItem,
} from "@/components/layout/workbook-stage-primitives"
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
    <CodeBlock className="border-border bg-card">
      <CodeBlockHeader className="border-b border-border bg-muted/45 pb-3">
        <CodeBlockTitle>
          <span
            className={cn(
              "size-2.5 rounded-full border border-[var(--ink)]",
              tone === "baseline"
                ? "bg-[var(--chapter-4)]"
                : "bg-[var(--chapter-2)]"
            )}
          />
          <span className="font-mono text-[12.5px] font-bold">{title}</span>
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

function extractShortStepLabel(rawStep: string, idx: number, isVi: boolean) {
  const cleaned = rawStep.replace(/[*`]/g, "").trim()
  const colonIdx = cleaned.indexOf(":")
  if (colonIdx > 0 && colonIdx <= 26) {
    return cleaned.slice(0, colonIdx)
  }
  const words = cleaned.split(/\s+/).slice(0, 3).join(" ")
  return words || (isVi ? `Bước ${idx + 1}` : `Step ${idx + 1}`)
}

export function LabWorkbench({ lab }: { lab: LabDefinition }) {
  const locale = useLocale() as Locale
  const isVi = locale === "vi"
  const tHud = useTranslations("hud")
  const tPlaybook = useTranslations("playbook")

  const mode = useTelemetryStore((s) => s.mode)
  const setMode = useTelemetryStore((s) => s.setMode)
  const fps = useTelemetryStore((s) => s.fps)
  const minFps = useTelemetryStore((s) => s.minFps)
  const tbtMs = useTelemetryStore((s) => s.tbtMs)
  const inpMs = useTelemetryStore((s) => s.inpMs)
  const domNodes = useTelemetryStore((s) => s.domNodes)
  const heapMb = useTelemetryStore((s) => s.heapMb)
  const renderCount = useTelemetryStore((s) => s.renderCount)
  const renderFlashEnabled = useTelemetryStore((s) => s.renderFlashEnabled)
  const toggleRenderFlash = useTelemetryStore((s) => s.toggleRenderFlash)
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

  const chapters = useMemo(() => getCourseChapters(locale), [locale])
  const currentChapter = useMemo(
    () => chapters.find((c) => c.lessons.some((l) => l.id === lab.slug)),
    [chapters, lab.slug]
  )
  const currentLessonMeta = useMemo(
    () => currentChapter?.lessons.find((l) => l.id === lab.slug),
    [currentChapter, lab.slug]
  )

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
    markLabViewed(lab.slug, `/labs/${lab.slug}`)
  }, [lab.slug, setMode, markLabViewed])

  const totalSteps = Math.max(1, content.devtoolsSteps.length)
  const safeStepIdx = stepIdx < totalSteps ? stepIdx : 0

  // Keyboard shortcuts matching right-inspector legend
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === "ArrowRight") {
        setStepIdx((s) => Math.min(totalSteps - 1, s + 1))
      } else if (e.key === "ArrowLeft") {
        setStepIdx((s) => Math.max(0, s - 1))
      } else if (e.key.toLowerCase() === "r") {
        setStressTrigger((c) => c + 1)
      } else if (e.key.toLowerCase() === "m") {
        const cur = useTelemetryStore.getState().mode
        setStressTrigger(0)
        setMode(cur === "bad" ? "good" : "bad")
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [totalSteps, setMode])

  const handleModeChange = (nextMode: LabMode) => {
    if (nextMode === mode) return
    setStressTrigger(0)
    setMode(nextMode)
  }

  const badSnap = labSnapshots?.bad
  const goodSnap = labSnapshots?.good
  const isSaved = savedLabs.includes(lab.slug)
  const currentNote = labNotes[lab.slug] ?? ""

  const currentStepText =
    content.devtoolsSteps[safeStepIdx] ?? content.devtoolsSteps[0] ?? ""

  const stepperNodes = useMemo(
    () =>
      content.devtoolsSteps.map((raw, idx) => ({
        label: extractShortStepLabel(raw, idx, isVi),
      })),
    [content.devtoolsSteps, isVi]
  )

  const stageMetrics: StageMetricItem[] = [
    {
      label: "FPS",
      value: `${fps} fps`,
      icon: <Gauge className="size-3" />,
      tone: fps < 30 || minFps < 25 ? "danger" : fps < 50 ? "warn" : "good",
    },
    {
      label: "TBT (BLOCK)",
      value: `${tbtMs} ms`,
      icon: <Clock className="size-3" />,
      tone: tbtMs > 100 ? "warn" : "default",
    },
    {
      label: "INP",
      value: `${inpMs} ms`,
      icon: <Activity className="size-3" />,
      tone: inpMs > 200 ? "warn" : "default",
    },
    {
      label: "DOM · HEAP",
      value: `${domNodes.toLocaleString()} · ${Math.round(heapMb)}MB`,
      icon: <Cpu className="size-3" />,
    },
    {
      label: customMetric ? customMetric.label : "RENDERS",
      value: customMetric
        ? `${customMetric.value}${customMetric.unit}`
        : `${renderCount}x`,
      icon: <Layers className="size-3" />,
      highlight: true,
    },
  ]

  const comparedLab =
    ALL_LABS.find((l) => l.slug === compareSlug) ?? defaultCompareLab
  const comparedContent = comparedLab.content[locale] ?? comparedLab.content.vi

  const compareSelectItems = useMemo(
    () =>
      ALL_LABS.filter((l) => l.slug !== lab.slug).map((item) => ({
        value: item.slug,
        label: `${item.code} — ${item.content[locale].title}`,
      })),
    [lab.slug, locale]
  )

  const safeScenarioCaseIdx =
    scenarioCaseIdx < patternMapping.scenarios.length ? scenarioCaseIdx : 0
  const activeProductScenario =
    patternMapping.scenarios[safeScenarioCaseIdx] ?? patternMapping.scenarios[0]

  const nextStepButtonLabel =
    safeStepIdx < totalSteps - 1
      ? `${isVi ? "Tiếp" : "Next"}: ${stepperNodes[safeStepIdx + 1]?.label ?? ""}`
      : isVi
        ? "Đã hoàn thành các bước"
        : "All steps reviewed"

  const whatChangedBullets =
    mode === "bad"
      ? [
          isVi
            ? "Đang mount bản Baseline (tái hiện điểm nghẽn)"
            : "Mounted: Baseline (unoptimized bottleneck)",
          content.symptoms[0] ?? content.symptomSummary,
        ]
      : [
          isVi
            ? "Đang mount bản Optimized (kiến trúc chuẩn Production)"
            : "Mounted: Optimized production architecture",
          content.solution[0] ?? content.takeaway,
        ]

  return (
    <div className="mx-auto max-w-[1640px] p-3.5 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-6">
        {/* ABOVE-THE-FOLD 3-COLUMN WORKBOOK WORKSPACE (Center Stage + Right Inspector) */}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_350px] 2xl:grid-cols-[minmax(0,1fr)_375px]">
          {/* CENTER STAGE CARD */}
          <Card className="gap-4 p-4 sm:p-6">
            {/* Breadcrumb + Title + Pastel Ink Metadata Pills */}
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Breadcrumb>
                  <BreadcrumbList className="font-mono text-xs">
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href="/" />}>
                        {currentChapter
                          ? `${currentChapter.number}. ${currentChapter.title}`
                          : pillar?.title[locale]}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-muted-foreground">
                        {isVi
                          ? `Bài ${currentLessonMeta?.indexInChapter ?? 1} / ${currentLessonMeta?.totalInChapter ?? 3}`
                          : `Lesson ${currentLessonMeta?.indexInChapter ?? 1} of ${currentLessonMeta?.totalInChapter ?? 3}`}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="amber">Lab {lab.code}</Badge>
                  <Badge variant="mint">{lab.primaryMetric}</Badge>
                  <Badge variant="periwinkle">
                    {totalSteps} {isVi ? "bước" : "steps"}
                  </Badge>
                  <Button
                    variant={isSaved ? "default" : "outline"}
                    size="xs"
                    onClick={() => toggleSavedLab(lab.slug)}
                    aria-label={isVi ? "Lưu bài học" : "Save lesson"}
                  >
                    <Bookmark
                      data-icon="inline-start"
                      className={cn(isSaved && "fill-current")}
                    />
                    <span>
                      {isSaved
                        ? isVi
                          ? "Đã lưu"
                          : "Saved"
                        : isVi
                          ? "Lưu"
                          : "Save"}
                    </span>
                  </Button>
                </div>
              </div>

              <div>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-[30px] sm:leading-[1.18]">
                  {content.title}
                </h1>
                <p className="mt-1.5 max-w-3xl text-[14.5px] leading-relaxed text-muted-foreground">
                  <FormattedText text={content.subtitle} />
                </p>
              </div>
            </div>

            {/* Live Telemetry Metric Strip + Replay/Benchmark/Mode Controls */}
            <WorkbookMetricStrip
              metrics={stageMetrics}
              actions={
                <>
                  <ToggleGroup
                    spacing={1}
                    value={[mode]}
                    onValueChange={(vals) => {
                      const nextVal = vals[0] as LabMode | undefined
                      if (nextVal) handleModeChange(nextVal)
                    }}
                    className="rounded-lg border-[1.5px] border-[var(--ink)] bg-background p-0.5 shadow-[var(--shadow-ink-sm)]"
                  >
                    <ToggleGroupItem
                      value="bad"
                      size="sm"
                      className="h-7 rounded-md px-2.5 font-mono text-[11.5px] data-pressed:bg-[var(--chapter-4)] data-pressed:font-bold data-pressed:text-[var(--chapter-4-ink)]"
                    >
                      {isVi ? "Baseline" : "Baseline"}
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="good"
                      size="sm"
                      className="h-7 rounded-md px-2.5 font-mono text-[11.5px] data-pressed:bg-primary data-pressed:font-bold data-pressed:text-primary-foreground"
                    >
                      {isVi ? "Optimized" : "Optimized"}
                    </ToggleGroupItem>
                  </ToggleGroup>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setStressTrigger((c) => c + 1)}
                  >
                    <Play data-icon="inline-start" />
                    <span>{isVi ? "Benchmark" : "Benchmark"}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => captureSnapshot(lab.slug, mode)}
                    title={tHud("captureSnapshot")}
                  >
                    <Camera data-icon="inline-start" />
                    <span className="hidden sm:inline">Snapshot</span>
                  </Button>

                  <Button
                    variant={renderFlashEnabled ? "secondary" : "ghost"}
                    size="icon-sm"
                    onClick={toggleRenderFlash}
                    title={tHud("renderFlash")}
                    aria-label={tHud("renderFlash")}
                  >
                    <Eye />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      resetCounters()
                      setStressTrigger(0)
                    }}
                    title={tHud("resetMetrics")}
                    aria-label={tHud("resetMetrics")}
                  >
                    <RotateCcw />
                  </Button>
                </>
              }
            />

            {/* Stage Canvas Tabs (Interactive Lab | Mechanism Diagram | TypeScript Code) */}
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "model" | "diagram" | "code")
              }
              className="gap-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TabsList className="border border-border bg-muted/70 font-mono">
                  <TabsTrigger value="model" className="font-mono text-xs">
                    <Box data-icon="inline-start" />
                    <span>
                      {isVi ? "Mô phỏng trực tiếp" : "Interactive Lab"}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="diagram" className="font-mono text-xs">
                    <GitBranch data-icon="inline-start" />
                    <span>{isVi ? "Sơ đồ cơ chế" : "Architecture"}</span>
                  </TabsTrigger>
                  <TabsTrigger value="code" className="font-mono text-xs">
                    <Code2 data-icon="inline-start" />
                    <span>TypeScript Diff</span>
                  </TabsTrigger>
                </TabsList>

                <div className="hidden items-center gap-3 font-mono text-[11px] text-muted-foreground sm:flex">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full border border-[var(--ink)] bg-[var(--chapter-4)]" />
                    <span>bottleneck</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full border border-[var(--ink)] bg-primary" />
                    <span>optimized</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="size-2 rounded-full border border-[var(--ink)] bg-[var(--chapter-5)]" />
                    <span>telemetry</span>
                  </span>
                </div>
              </div>

              <TabsContent value="model">
                <div className="bg-stage-grid rounded-xl border border-border bg-background/55 p-4 sm:p-5">
                  <ActiveSandbox
                    key={`${lab.slug}-${mode}`}
                    mode={mode}
                    locale={locale}
                    stressTrigger={stressTrigger}
                  />
                </div>
              </TabsContent>

              <TabsContent value="diagram">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Alert variant="pitfall" className="p-4">
                    <AlertTriangle />
                    <AlertTitle>
                      {isVi
                        ? "Luồng Chưa Tối Ưu (Baseline Anti-Pattern)"
                        : "Baseline Bottleneck Path"}
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 flex flex-col gap-2">
                        {content.underTheHood.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--garden-pitfall-text)]" />
                            <span>
                              <FormattedText text={item} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert variant="goodToKnow" className="p-4">
                    <CheckCircle2 />
                    <AlertTitle>
                      {isVi
                        ? "Kiến Trúc Đã Tối Ưu (Production Solution)"
                        : "Optimized Production Architecture"}
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 flex flex-col gap-2">
                        {content.solution.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                            <span>
                              <FormattedText text={item} />
                            </span>
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="code">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
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
              </TabsContent>
            </Tabs>

            {/* Saved Benchmark Scorecard (When user captures snapshots) */}
            {(badSnap || goodSnap) && (
              <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {tHud("scorecardTitle")}
                  </span>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => clearSnapshots(lab.slug)}
                  >
                    <Trash2 data-icon="inline-start" />
                    <span>{tHud("clearSnapshots")}</span>
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="pb-2 font-medium">Metric</th>
                        <th className="pb-2 font-medium">Baseline</th>
                        <th className="pb-2 font-medium">Optimized</th>
                        <th className="pb-2 font-medium">Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(badSnap?.customMetric || goodSnap?.customMetric) && (
                        <tr>
                          <td className="py-2 font-semibold text-foreground">
                            {badSnap?.customMetric?.label ??
                              goodSnap?.customMetric?.label}
                          </td>
                          <td className="py-2">
                            {badSnap?.customMetric
                              ? `${badSnap.customMetric.value}${badSnap.customMetric.unit}`
                              : "—"}
                          </td>
                          <td className="py-2 font-bold">
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
                        <td className="py-1.5">Min FPS</td>
                        <td className="py-1.5">
                          {badSnap ? `${badSnap.minFps} FPS` : "—"}
                        </td>
                        <td className="py-1.5 font-bold">
                          {goodSnap ? `${goodSnap.minFps} FPS` : "—"}
                        </td>
                        <td className="py-1.5">
                          {formatDelta(badSnap?.minFps, goodSnap?.minFps, false)
                            ?.text ?? "—"}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1.5">TBT / INP</td>
                        <td className="py-1.5">
                          {badSnap
                            ? `${badSnap.tbtMs}ms / ${badSnap.inpMs}ms`
                            : "—"}
                        </td>
                        <td className="py-1.5 font-bold">
                          {goodSnap
                            ? `${goodSnap.tbtMs}ms / ${goodSnap.inpMs}ms`
                            : "—"}
                        </td>
                        <td className="py-1.5">
                          {formatDelta(badSnap?.tbtMs, goodSnap?.tbtMs, true)
                            ?.text ?? "—"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bottom Horizontal Stepper ("IN THIS LESSON") */}
            <WorkbookHorizontalStepper
              heading={isVi ? "CÁC BƯỚC TRONG BÀI HỌC" : "IN THIS LESSON"}
              steps={stepperNodes}
              currentStepIdx={safeStepIdx}
              onSelectStep={setStepIdx}
              stepCountLabel={
                isVi
                  ? `Bước ${safeStepIdx + 1} / ${totalSteps}`
                  : `Step ${safeStepIdx + 1} of ${totalSteps}`
              }
            />
          </Card>

          {/* RIGHT INSPECTOR COLUMN (Step Detail + GOOD TO KNOW + YOU'LL LEARN) */}
          <WorkbookRightInspector
            lessonId={lab.slug}
            stepIndex={safeStepIdx}
            totalSteps={totalSteps}
            badgeLabel={mode === "bad" ? "BOTTLENECK" : "OPTIMIZED"}
            badgeVariant={mode === "bad" ? "peach" : "sky"}
            stepTitle={
              stepperNodes[safeStepIdx]?.label ??
              (isVi
                ? `Bước kiểm chứng ${safeStepIdx + 1}`
                : `Step ${safeStepIdx + 1}`)
            }
            stepBody={currentStepText}
            goodToKnowTitle={isVi ? "ĐIỂM CỐT LÕI" : "GOOD TO KNOW"}
            goodToKnowText={content.takeaway}
            whatChangedTitle={isVi ? "TRẠNG THÁI HIỆN TẠI" : "WHAT CHANGED"}
            whatChangedItems={whatChangedBullets}
            onPrevStep={() => setStepIdx((s) => Math.max(0, s - 1))}
            onNextStep={() =>
              setStepIdx((s) => Math.min(totalSteps - 1, s + 1))
            }
            nextStepLabel={nextStepButtonLabel}
            nextLessonHref={next ? `/labs/${next.slug}` : undefined}
            nextLessonTitle={
              next ? `${isVi ? "Bài tiếp" : "Next"}: ${next.code}` : undefined
            }
            backLabel={isVi ? "Trước" : "Back"}
            shortcutHints={[
              { keys: ["←", "→"], label: isVi ? "bước" : "step" },
              { keys: ["R"], label: "benchmark" },
              { keys: ["M"], label: "mode" },
            ]}
            youWillLearnTitle={isVi ? "BẠN SẼ NẮM VỮNG" : "YOU'LL LEARN"}
            youWillLearnItems={patternMapping.whenToApply}
          />
        </div>

        {/* BELOW-THE-FOLD DEEP-DIVE ENGINEERING PLAYBOOK */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* How It Works */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <BookOpen className="mr-1.5 inline size-3.5" />
                {isVi ? "CƠ CHẾ HOẠT ĐỘNG" : "HOW IT WORKS"}
              </div>
              <CardTitle className="text-lg">
                {content.symptomSummary}
              </CardTitle>
              <CardDescription>
                <FormattedText text={content.rootCauseSummary} />
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4 border-t border-border pt-4">
              <div className="flex flex-col gap-1.5">
                <div className="font-mono text-xs font-bold text-[var(--garden-pitfall-text)] uppercase">
                  • {isVi ? "Điểm nghẽn (The Bottleneck)" : "The Bottleneck"}
                </div>
                <div className="flex flex-col gap-2 pl-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  {content.symptoms.slice(0, 2).map((item, i) => (
                    <p key={i}>
                      <FormattedText text={item} />
                    </p>
                  ))}
                </div>
              </div>

              <div className="pl-3 text-muted-foreground">
                <ArrowDown className="size-4" />
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="font-mono text-xs font-bold text-foreground uppercase">
                  • {isVi ? "Giải pháp (The Fix)" : "The Optimization"}
                </div>
                <div className="flex flex-col gap-2 pl-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  {content.solution.map((item, i) => (
                    <p key={i}>
                      <FormattedText text={item} />
                    </p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trade-offs & Common Pitfalls */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <HelpCircle className="mr-1.5 inline size-3.5" />
                {isVi ? "ĐÁNH ĐỔI & LƯU Ý" : "TRADE-OFFS & PITFALLS"}
              </div>
              <CardTitle className="text-lg">
                {isVi
                  ? "Giới hạn kỹ thuật & Khi KHÔNG nên lạm dụng"
                  : "Engineering Trade-offs & Over-engineering Traps"}
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-4">
              <ul className="flex flex-col gap-2.5 text-[13.5px] leading-relaxed text-muted-foreground">
                {content.tradeoffs.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="mt-1 size-3.5 shrink-0 text-foreground" />
                    <span>
                      <FormattedText text={item} />
                    </span>
                  </li>
                ))}
              </ul>

              <Alert variant="pitfall">
                <AlertTriangle />
                <AlertTitle>
                  {isVi ? "Khi KHÔNG cần áp dụng" : "When NOT to apply"}
                </AlertTitle>
                <AlertDescription>
                  {patternMapping.whenNotToApply.map((item, idx) => (
                    <p key={idx}>
                      <FormattedText text={item} />
                    </p>
                  ))}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Real-World Production Scenarios */}
        {activeProductScenario && (
          <Card>
            <CardHeader>
              <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <Compass className="mr-1.5 inline size-3.5" />
                {isVi ? "TÌNH HUỐNG SẢN PHẨM THỰC TẾ" : "PRODUCTION SCENARIOS"}
              </div>
              <CardTitle className="text-lg">
                {tPlaybook("scenariosTitle")}
              </CardTitle>
              <CardAction>
                <div className="flex flex-wrap items-center gap-1.5">
                  {patternMapping.scenarios.map((sc, idx) => (
                    <Button
                      key={idx}
                      variant={
                        scenarioCaseIdx === idx ? "default" : "secondary"
                      }
                      size="xs"
                      onClick={() => setScenarioCaseIdx(idx)}
                    >
                      {sc.domain}
                    </Button>
                  ))}
                </div>
              </CardAction>
            </CardHeader>

            <CardContent className="gap-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="font-mono text-[10.5px] font-bold tracking-wider text-[var(--garden-pitfall-text)] uppercase">
                    {tPlaybook("scenarioProblemLabel")}
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-foreground">
                    <FormattedText text={activeProductScenario.title} />
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                    <FormattedText text={activeProductScenario.problem} />
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <div className="font-mono text-[10.5px] font-bold tracking-wider text-foreground uppercase">
                    {tPlaybook("scenarioApplicationLabel")}
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-muted-foreground">
                    <FormattedText text={activeProductScenario.application} />
                  </p>
                </div>
              </div>

              <Alert variant="goodToKnow">
                <CheckCircle2 />
                <AlertTitle>{tPlaybook("scenarioOutcomeLabel")}</AlertTitle>
                <AlertDescription>
                  <FormattedText text={activeProductScenario.outcome} />
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}

        {/* Compare Patterns (using shadcn Select) + Personal Notes (using shadcn Textarea) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <Card className="lg:col-span-7">
            <CardHeader>
              <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <GitCompare className="mr-1.5 inline size-3.5" />
                {isVi ? "SO SÁNH PATTERN" : "COMPARE PATTERNS"}
              </div>
              <CardTitle className="text-lg">
                {isVi
                  ? "Đối chiếu với các kỹ thuật khác"
                  : "How these patterns differ"}
              </CardTitle>
              <CardAction>
                <Select
                  items={compareSelectItems}
                  value={compareSlug}
                  onValueChange={(val) => {
                    if (val) setCustomCompareSlug(val as LabSlug)
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-56 border-[1.5px] border-[var(--ink)] bg-card font-mono text-xs"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    align="end"
                    className="border-[1.5px] border-[var(--ink)] bg-card font-mono"
                  >
                    <SelectGroup>
                      {compareSelectItems.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                          className="font-mono text-xs"
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </CardAction>
            </CardHeader>

            <CardContent className="gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <Badge variant="mint" className="mb-2">
                    {lab.code} · {lab.primaryMetric}
                  </Badge>
                  <div className="font-mono text-sm font-bold text-foreground">
                    {content.title}
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    <FormattedText text={content.symptomSummary} />
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background/60 p-4">
                  <Badge variant="periwinkle" className="mb-2">
                    {comparedLab.code} · {comparedLab.primaryMetric}
                  </Badge>
                  <Link
                    href={`/labs/${comparedLab.slug}`}
                    className="inline-flex items-center gap-1 font-mono text-sm font-bold text-foreground hover:underline"
                  >
                    <span>{comparedContent.title}</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                    <FormattedText text={comparedContent.symptomSummary} />
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Notes Card */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                <FileText className="mr-1.5 inline size-3.5" />
                {isVi ? "GHI CHÚ CÁ NHÂN" : "YOUR NOTES"}
              </div>
              <CardTitle className="text-lg">
                {isVi
                  ? "Bạn sẽ áp dụng kỹ thuật này ở đâu?"
                  : "Where could you apply this pattern?"}
              </CardTitle>
              <CardDescription>
                {isVi
                  ? "Tự động lưu trên trình duyệt của bạn."
                  : "Saved automatically in your browser."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={4}
                value={currentNote}
                onChange={(e) => setLabNote(lab.slug, e.target.value)}
                placeholder={
                  isVi
                    ? `Ghi chú cách áp dụng ${content.title} vào dự án của bạn...`
                    : `Jot down how ${content.title} applies to your codebase...`
                }
                className="bg-background/70 text-[13.5px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Bottom Prev / Next Lesson Bar */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          {prev ? (
            <Button
              variant="outline"
              render={<Link href={`/labs/${prev.slug}`} />}
              nativeButton={false}
            >
              <ArrowLeft data-icon="inline-start" />
              <span>
                {prev.code} — {prev.content[locale].title}
              </span>
            </Button>
          ) : (
            <Button
              variant="outline"
              render={<Link href="/foundations/web-socket" />}
              nativeButton={false}
            >
              <ArrowLeft data-icon="inline-start" />
              <span>F2 — WebSocket & Real-time</span>
            </Button>
          )}

          {next ? (
            <Button
              variant="default"
              render={<Link href={`/labs/${next.slug}`} />}
              nativeButton={false}
            >
              <span>
                {next.code} — {next.content[locale].title}
              </span>
              <ArrowRight data-icon="inline-end" />
            </Button>
          ) : (
            <Button
              variant="default"
              render={<Link href="/" />}
              nativeButton={false}
            >
              <span>{isVi ? "Về trang Tổng quan" : "Back to Catalog"}</span>
              <ArrowRight data-icon="inline-end" />
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}
