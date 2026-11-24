"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Code2,
  Cpu,
  Layers,
  Monitor,
  Play,
  RotateCcw,
  Terminal,
} from "lucide-react"
import type { Locale } from "@/i18n/request"
import {
  CSS_TRIGGER_CATEGORIES,
  EVENT_LOOP_SCENARIOS,
  PIXEL_PIPELINE_STAGES,
} from "@/lib/foundations/content"
import { FOUNDATION_TOPICS } from "@/lib/foundations/catalog"
import { useTelemetryStore } from "@/lib/telemetry/store"
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
  WorkbookHorizontalStepper,
  WorkbookMetricStrip,
  WorkbookRightInspector,
  type StageMetricItem,
} from "@/components/layout/workbook-stage-primitives"
import { useHighlightedCode } from "@/hooks/use-highlighted-code"
import { cn } from "@/lib/utils"

function FoundationCodeBlock({
  title,
  filename,
  code,
}: {
  title: string
  filename: string
  code: string
}) {
  const lines = useHighlightedCode(code, "tsx")

  return (
    <CodeBlock className="border-border bg-card">
      <CodeBlockHeader className="border-b border-border bg-muted/45 pb-3">
        <CodeBlockTitle>
          <Code2 className="text-foreground" />
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
        {lines.map((line, idx) => (
          <CodeBlockLine key={idx}>{line}</CodeBlockLine>
        ))}
      </CodeBlockContent>
    </CodeBlock>
  )
}

export function BrowserEventLoopGuide() {
  const locale = useLocale() as Locale
  const isVi = locale === "vi"

  const markLabViewed = useTelemetryStore((s) => s.markLabViewed)

  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [selectedStageId, setSelectedStageId] = useState<string>("javascript")

  useEffect(() => {
    markLabViewed("f:event-loop", "/foundations/event-loop")
  }, [markLabViewed])

  const activeScenario =
    EVENT_LOOP_SCENARIOS[scenarioIdx] ?? EVENT_LOOP_SCENARIOS[0]
  const totalSteps = activeScenario.steps.length
  const safeStepIdx = stepIdx < totalSteps ? stepIdx : 0
  const currentStep =
    activeScenario.steps[safeStepIdx] ?? activeScenario.steps[0]

  const activeStage =
    PIXEL_PIPELINE_STAGES.find((s) => s.id === selectedStageId) ??
    PIXEL_PIPELINE_STAGES[0]

  const topicMeta = FOUNDATION_TOPICS[0]

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
        setStepIdx(0)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [totalSteps])

  const handleSelectScenario = (idx: number) => {
    setScenarioIdx(idx)
    setStepIdx(0)
  }

  const stageMetrics: StageMetricItem[] = [
    {
      label: "FRAME BUDGET",
      value: "16.67 ms",
      icon: <Clock className="size-3" />,
      highlight: true,
    },
    {
      label: "CALL STACK",
      value: `${currentStep.callStack.length} frame`,
      icon: <Cpu className="size-3" />,
    },
    {
      label: "MICROTASKS",
      value: `${currentStep.microtasks.length} queued`,
      icon: <Layers className="size-3" />,
    },
    {
      label: "rAF / RENDER",
      value: `${currentStep.rafQueue.length} pending`,
      icon: <Monitor className="size-3" />,
    },
    {
      label: "MACROTASKS",
      value: `${currentStep.macrotasks.length} task`,
      tone: currentStep.macrotasks.length > 0 ? "warn" : "default",
    },
  ]

  const stepperNodes = activeScenario.steps.map((st) => ({
    label: st.phase,
  }))

  return (
    <div className="mx-auto max-w-[1640px] p-3.5 sm:p-5 lg:p-6">
      <div className="flex flex-col gap-6">
        {/* 3-COLUMN WORKBOOK WORKSPACE */}
        <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_350px] 2xl:grid-cols-[minmax(0,1fr)_375px]">
          {/* CENTER STAGE */}
          <Card className="gap-4 p-4 sm:p-6">
            <div className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Breadcrumb>
                  <BreadcrumbList className="font-mono text-xs">
                    <BreadcrumbItem>
                      <BreadcrumbLink render={<Link href="/foundations" />}>
                        01. {isVi ? "Nền tảng Runtime" : "Foundations"}
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    <BreadcrumbItem>
                      <BreadcrumbPage className="text-muted-foreground">
                        {isVi ? "Bài 1 / 2" : "Lesson 1 of 2"}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="amber">16.67ms VSync</Badge>
                  <Badge variant="mint">Beginner</Badge>
                  <Badge variant="periwinkle">
                    {totalSteps} {isVi ? "bước" : "steps"}
                  </Badge>
                </div>
              </div>

              <div>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-[30px] sm:leading-[1.18]">
                  Event Loop & Pixel Pipeline
                </h1>
                <p className="mt-1.5 max-w-3xl text-[14.5px] leading-relaxed text-muted-foreground">
                  {topicMeta.summary[locale]}
                </p>
              </div>
            </div>

            {/* Queue Telemetry Strip + Scenario Buttons */}
            <WorkbookMetricStrip
              metrics={stageMetrics}
              actions={
                <>
                  {EVENT_LOOP_SCENARIOS.map((sc, idx) => (
                    <Button
                      key={sc.id}
                      variant={scenarioIdx === idx ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSelectScenario(idx)}
                    >
                      <span>Case #{idx + 1}</span>
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setStepIdx((s) => (s + 1) % activeScenario.steps.length)
                    }
                  >
                    <Play data-icon="inline-start" />
                    <span>{isVi ? "Bước tiếp" : "Step"}</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setStepIdx(0)}
                    aria-label="Reset steps"
                  >
                    <RotateCcw />
                  </Button>
                </>
              }
            />

            {/* Interactive Event Loop Queues + Trace Code on Grid Surface */}
            <div className="bg-stage-grid rounded-xl border border-border bg-background/55 p-4 sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="font-mono text-sm font-bold text-foreground">
                  {activeScenario.title[locale]}
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {activeScenario.subtitle[locale]}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <FoundationCodeBlock
                  title={activeScenario.title[locale]}
                  filename="event-loop-trace.ts"
                  code={activeScenario.code}
                />

                <div className="flex flex-col justify-between gap-3">
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="font-mono text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                        Call Stack
                      </div>
                      <div className="mt-2 flex flex-col gap-1 font-mono text-xs">
                        {currentStep.callStack.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Empty]
                          </span>
                        ) : (
                          currentStep.callStack.map((item, i) => (
                            <div
                              key={i}
                              className="rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--chapter-1)] px-2 py-1 font-semibold text-[var(--chapter-1-ink)]"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="font-mono text-[10.5px] font-bold tracking-wider text-foreground uppercase">
                        Microtask Queue
                      </div>
                      <div className="mt-2 flex flex-col gap-1 font-mono text-xs">
                        {currentStep.microtasks.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Empty — Drained]
                          </span>
                        ) : (
                          currentStep.microtasks.map((item, i) => (
                            <div
                              key={i}
                              className="rounded-md border-[1.5px] border-[var(--ink)] bg-primary px-2 py-1 font-semibold text-primary-foreground"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="font-mono text-[10.5px] font-bold tracking-wider text-foreground uppercase">
                        rAF / Render Pipeline
                      </div>
                      <div className="mt-2 flex flex-col gap-1 font-mono text-xs">
                        {currentStep.rafQueue.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Idle]
                          </span>
                        ) : (
                          currentStep.rafQueue.map((item, i) => (
                            <div
                              key={i}
                              className="rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--chapter-5)] px-2 py-1 font-semibold text-[var(--chapter-5-ink)]"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-3">
                      <div className="font-mono text-[10.5px] font-bold tracking-wider text-[var(--garden-pitfall-text)] uppercase">
                        Macrotask Queue
                      </div>
                      <div className="mt-2 flex flex-col gap-1 font-mono text-xs">
                        {currentStep.macrotasks.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Empty]
                          </span>
                        ) : (
                          currentStep.macrotasks.map((item, i) => (
                            <div
                              key={i}
                              className="rounded-md border-[1.5px] border-[var(--ink)] bg-[var(--chapter-4)] px-2 py-1 font-semibold text-[var(--chapter-4-ink)]"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Console Output */}
                  <div className="rounded-xl border border-border bg-card p-3 font-mono text-xs">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                      <Terminal className="size-3.5 text-foreground" />
                      <span>Console Output</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {currentStep.consoleOutput.length === 0 ? (
                        <span className="text-muted-foreground/60">
                          {"// waiting for execution..."}
                        </span>
                      ) : (
                        currentStep.consoleOutput.map((line, i) => (
                          <div key={i} className="text-foreground">
                            <span className="mr-2 font-bold">&gt;</span>
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Horizontal Stepper */}
            <WorkbookHorizontalStepper
              heading={isVi ? "CÁC BƯỚC TRONG BÀI HỌC" : "IN THIS LESSON"}
              steps={stepperNodes}
              currentStepIdx={safeStepIdx}
              onSelectStep={setStepIdx}
            />
          </Card>

          {/* RIGHT INSPECTOR */}
          <WorkbookRightInspector
            lessonId="f:event-loop"
            stepIndex={safeStepIdx}
            totalSteps={totalSteps}
            badgeLabel="RUNTIME"
            badgeVariant="sky"
            stepTitle={currentStep.phase}
            stepBody={currentStep.explanation[locale]}
            goodToKnowTitle={isVi ? "ĐIỂM CỐT LÕI" : "GOOD TO KNOW"}
            goodToKnowText={
              isVi
                ? "Trên màn hình 60Hz, trình duyệt chỉ có **16.67ms** để hoàn tất cả JS, rAF, Style, Layout, Paint và Composite. Microtask luôn rút cạn 100% trước khi nhường cho Paint."
                : "On a 60Hz display, the browser has **16.67ms** to finish JS, rAF, Style, Layout, Paint, and Composite. Microtasks drain 100% before yielding to Render."
            }
            whatChangedTitle={isVi ? "TRẠNG THÁI HÀNG ĐỢI" : "WHAT CHANGED"}
            whatChangedItems={[
              `Call Stack: ${currentStep.callStack.length} · Microtasks: ${currentStep.microtasks.length}`,
              `Console lines emitted: ${currentStep.consoleOutput.length}`,
            ]}
            onPrevStep={() => setStepIdx((s) => Math.max(0, s - 1))}
            onNextStep={() =>
              setStepIdx((s) => Math.min(totalSteps - 1, s + 1))
            }
            nextStepLabel={
              safeStepIdx < totalSteps - 1
                ? `${isVi ? "Tiếp" : "Next"}: ${stepperNodes[safeStepIdx + 1]?.label ?? ""}`
                : isVi
                  ? "Hoàn thành kịch bản"
                  : "Scenario complete"
            }
            nextLessonHref="/foundations/web-socket"
            nextLessonTitle="Next: F2 WebSockets"
            backLabel={isVi ? "Trước" : "Back"}
            shortcutHints={[
              { keys: ["←", "→"], label: isVi ? "bước" : "step" },
              { keys: ["R"], label: "reset" },
            ]}
            youWillLearnTitle={isVi ? "BẠN SẼ NẮM VỮNG" : "YOU'LL LEARN"}
            youWillLearnItems={topicMeta.highlights[locale]}
          />
        </div>

        {/* BELOW-THE-FOLD: 5-STAGE PIXEL PIPELINE + CSS TRIGGERS + CONCURRENT SCHEDULER */}
        <Card>
          <CardHeader>
            <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <Monitor className="mr-1.5 inline size-3.5" />
              5-STAGE PIXEL PIPELINE
            </div>
            <CardTitle className="text-lg">
              {isVi
                ? "5 Giai đoạn Render Khung hình (JS → Style → Layout → Paint → Composite)"
                : "The 5-Stage Pixel Pipeline (JS → Style → Layout → Paint → Composite)"}
            </CardTitle>
            <CardDescription>
              {isVi
                ? "Bấm vào từng giai đoạn để xem chi phí CPU/GPU thực tế."
                : "Select any stage below to inspect thread ownership and cost."}
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
              {PIXEL_PIPELINE_STAGES.map((stage) => {
                const isSelected = stage.id === selectedStageId
                return (
                  <button
                    key={stage.id}
                    type="button"
                    onClick={() => setSelectedStageId(stage.id)}
                    className={cn(
                      "cursor-pointer rounded-xl border p-3.5 text-left transition-all",
                      isSelected
                        ? "border-[1.5px] border-[var(--ink)] bg-primary text-primary-foreground shadow-[var(--shadow-ink-sm)]"
                        : "border-border bg-background/60 hover:border-[var(--ink)]"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                      <span className="font-bold">Stage {stage.step}</span>
                      <span className="rounded border border-current/25 px-1.5 py-0.5 text-[10px]">
                        {stage.thread === "Main Thread" ? "Main" : "GPU"}
                      </span>
                    </div>
                    <div className="mt-1.5 font-mono text-xs font-bold">
                      {stage.name.replace(/^\d+\.\s*/, "")}
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
                <div>
                  <h3 className="font-mono text-base font-bold text-foreground">
                    {activeStage.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeStage.summary[locale]}
                  </p>
                </div>
                <Badge variant="outline">
                  {activeStage.thread} · {activeStage.costLevel}
                </Badge>
              </div>

              <ul className="mt-3 flex flex-col gap-2 text-[13.5px] leading-relaxed text-muted-foreground">
                {activeStage.details[locale].map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground" />
                    <span>
                      <FormattedText text={detail} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* CSS Triggers + React 19 Concurrent Scheduler */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                CSS TRIGGERS MATRIX
              </div>
              <CardTitle className="text-lg">
                Layout Reflow vs. Paint vs. GPU Composite
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              {CSS_TRIGGER_CATEGORIES.map((cat, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
                  <div className="font-mono text-xs font-bold text-foreground">
                    {cat.tier}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {cat.properties.map((prop) => (
                      <code
                        key={prop}
                        className="rounded border border-[var(--garden-code-pill-border)] bg-[var(--garden-code-pill-bg)] px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                      >
                        {prop}
                      </code>
                    ))}
                  </div>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted-foreground">
                    <FormattedText text={cat.recommendation[locale]} />
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                REACT 19 CONCURRENT SCHEDULER
              </div>
              <CardTitle className="text-lg">
                Why MessageChannel & scheduler.yield() Win
              </CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Alert variant="pitfall">
                <AlertTriangle />
                <AlertTitle>Why NOT Promise.then?</AlertTitle>
                <AlertDescription>
                  <FormattedText
                    text={
                      isVi
                        ? "`Promise.then` đẩy vào Microtask Queue — trình duyệt rút cạn toàn bộ Microtask trước khi Paint nên vẫn gây treo giao diện."
                        : "`Promise.then` queues into Microtasks, which drain completely before Paint and starve user input."
                    }
                  />
                </AlertDescription>
              </Alert>

              <Alert variant="pitfall">
                <AlertTriangle />
                <AlertTitle>Why NOT setTimeout(0)?</AlertTitle>
                <AlertDescription>
                  <FormattedText
                    text={
                      isVi
                        ? "HTML5 Spec áp phạt tối thiểu 4ms khi lồng nhau >5 cấp, làm lãng phí quỹ 16.67ms."
                        : "Nested `setTimeout(0)` calls incur a 4ms minimum clamping penalty per HTML5 spec."
                    }
                  />
                </AlertDescription>
              </Alert>

              <Alert variant="goodToKnow">
                <CheckCircle2 />
                <AlertTitle>MessageChannel & scheduler.yield()</AlertTitle>
                <AlertDescription>
                  <FormattedText
                    text={
                      isVi
                        ? "Đẩy Macrotask với độ trễ ~0ms, cho phép trình duyệt Paint và nhận sự kiện sau mỗi lát cắt 5ms."
                        : "Enqueues a ~0ms Macrotask so the browser can Paint and process input every 5ms slice."
                    }
                  />
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>

        {/* Footer Navigation */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            variant="outline"
            render={<Link href="/foundations" />}
            nativeButton={false}
          >
            <ArrowLeft data-icon="inline-start" />
            <span>{isVi ? "Về Hub Nền tảng" : "Foundations Hub"}</span>
          </Button>
          <Button
            variant="default"
            render={<Link href="/foundations/web-socket" />}
            nativeButton={false}
          >
            <span>F2 — WebSocket Architecture & Resilience</span>
            <ArrowRight data-icon="inline-end" />
          </Button>
        </footer>
      </div>
    </div>
  )
}
