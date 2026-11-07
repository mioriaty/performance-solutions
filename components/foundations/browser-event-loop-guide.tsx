"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Cpu,
  GitBranch,
  Layers,
  Monitor,
  Play,
  RotateCcw,
  Sprout,
  Terminal,
} from "lucide-react"
import type { Locale } from "@/i18n/request"
import {
  CSS_TRIGGER_CATEGORIES,
  EVENT_LOOP_SCENARIOS,
  PIXEL_PIPELINE_STAGES,
} from "@/lib/foundations/content"
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
    <CodeBlock className="border-border bg-background/70">
      <CodeBlockHeader className="border-b border-border bg-muted/40 pb-3">
        <CodeBlockTitle>
          <Code2 className="text-primary" />
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

  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [selectedStageId, setSelectedStageId] = useState<string>("javascript")

  const activeScenario =
    EVENT_LOOP_SCENARIOS[scenarioIdx] ?? EVENT_LOOP_SCENARIOS[0]
  const currentStep = activeScenario.steps[stepIdx] ?? activeScenario.steps[0]
  const activeStage =
    PIXEL_PIPELINE_STAGES.find((s) => s.id === selectedStageId) ??
    PIXEL_PIPELINE_STAGES[0]

  const handleSelectScenario = (idx: number) => {
    setScenarioIdx(idx)
    setStepIdx(0)
  }

  return (
    <div className="mx-auto max-w-[1350px] px-4 py-8 sm:px-6 lg:px-8">
      <article className="space-y-6">
        {/* 1. PATTERN GARDEN HEADER */}
        <header className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/12 px-2.5 py-0.5 text-[12px] font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary" />
              <span>{isVi ? "Phụ lục Nền tảng" : "Foundations Appendix"}</span>
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              CORE RUNTIME · 16.67MS FRAME BUDGET
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[38px] sm:leading-[1.15]">
              <span>
                {isVi
                  ? "Event Loop & Pixel Pipeline"
                  : "Event Loop & Pixel Pipeline"}
              </span>{" "}
              <span className="font-light text-primary select-none">*</span>
            </h1>

            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                title="Overview"
                aria-label="Back to overview"
              >
                <ChevronLeft className="size-4" />
              </Link>
              <Link
                href="/labs/rerender-storms"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                title="Lab 1.1"
                aria-label="First pattern"
              >
                <ChevronRight className="size-4" />
              </Link>
            </div>
          </div>

          <p className="max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">
            {isVi
              ? "Hiểu rõ cách trình duyệt điều phối Call Stack, Microtasks, Macrotasks, nhịp VSync 16.67ms và 5 bước của Pixel Pipeline (JS → Style → Layout → Paint → Composite) để giải thích mọi bài toán hiệu năng."
              : "Understand how the browser orchestrates the Call Stack, Microtask & Macrotask Queues, 16.67ms VSync frames, and the 5-stage Pixel Pipeline (JS → Style → Layout → Paint → Composite)."}
          </p>
        </header>

        {/* 2. INTERACTIVE EVENT LOOP SIMULATOR STAGE (Pattern Garden Stage Format) */}
        <section className="overflow-hidden rounded-2xl border border-border bg-card">
          {/* Top Stage Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 pt-3">
            <div className="flex items-center gap-6 text-[13px]">
              <div className="flex items-center gap-2 border-b-2 border-primary pb-3 font-medium text-foreground">
                <Box className="size-3.5 text-primary" />
                <span>
                  {isVi
                    ? "Mô phỏng Event Loop từng bước"
                    : "Interactive Event Loop Stepper"}
                </span>
              </div>
            </div>
            <div className="pb-2.5">
              <button
                type="button"
                onClick={() => setStepIdx(0)}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-background/70 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <RotateCcw className="size-3" />
                <span>{isVi ? "Đặt lại" : "Reset"}</span>
              </button>
            </div>
          </div>

          {/* Stage Body */}
          <div className="space-y-5 p-5 sm:p-6">
            <div className="space-y-1.5">
              <div className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {isVi ? "KỊCH BẢN MÔ PHỎNG" : "THE EXAMPLE"}
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-[22px]">
                {activeScenario.title[locale]}
              </h2>
              <p className="text-[14px] text-muted-foreground">
                {activeScenario.subtitle[locale]}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <FoundationCodeBlock
                title={activeScenario.title[locale]}
                filename="event-loop-trace.ts"
                code={activeScenario.code}
              />

              <div className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Step Explanation Callout */}
                  <div className="rounded-xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] p-3.5 text-[13.5px] leading-relaxed text-foreground">
                    <div className="mb-1 font-mono text-[11px] font-semibold text-primary uppercase">
                      {currentStep.phase}
                    </div>
                    <FormattedText text={currentStep.explanation[locale]} />
                  </div>

                  {/* 4 Queues */}
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background/60 p-3">
                      <div className="font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Call Stack
                      </div>
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        {currentStep.callStack.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Empty]
                          </span>
                        ) : (
                          currentStep.callStack.map((item, i) => (
                            <div
                              key={i}
                              className="rounded border border-border bg-card px-2 py-1 text-foreground"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-3">
                      <div className="font-mono text-[10.5px] font-semibold tracking-wider text-primary uppercase">
                        Microtask Queue
                      </div>
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        {currentStep.microtasks.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Empty — Drained]
                          </span>
                        ) : (
                          currentStep.microtasks.map((item, i) => (
                            <div
                              key={i}
                              className="rounded border border-primary/30 bg-primary/10 px-2 py-1 text-primary"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-3">
                      <div className="font-mono text-[10.5px] font-semibold tracking-wider text-primary uppercase">
                        rAF / Render Pipeline
                      </div>
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        {currentStep.rafQueue.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Idle]
                          </span>
                        ) : (
                          currentStep.rafQueue.map((item, i) => (
                            <div
                              key={i}
                              className="rounded border border-primary/30 bg-primary/10 px-2 py-1 text-primary"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-background/60 p-3">
                      <div className="font-mono text-[10.5px] font-semibold tracking-wider text-[var(--garden-pitfall-text)] uppercase">
                        Macrotask Queue
                      </div>
                      <div className="mt-2 space-y-1 font-mono text-xs">
                        {currentStep.macrotasks.length === 0 ? (
                          <span className="text-muted-foreground/60">
                            [Empty]
                          </span>
                        ) : (
                          currentStep.macrotasks.map((item, i) => (
                            <div
                              key={i}
                              className="rounded border border-[var(--garden-pitfall-border)] bg-[var(--garden-pitfall-bg)] px-2 py-1 text-[var(--garden-pitfall-text)]"
                            >
                              {item}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Console Output */}
                <div className="rounded-xl border border-border bg-background/70 p-3 font-mono text-xs">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <Terminal className="size-3.5 text-primary" />
                    <span>Console Output</span>
                  </div>
                  <div className="space-y-1">
                    {currentStep.consoleOutput.map((line, i) => (
                      <div key={i} className="text-foreground">
                        <span className="mr-2 text-primary">&gt;</span>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stage Bottom Control Bars: Try a scenario + Stepper */}
          <div className="divide-y divide-border border-t border-border bg-background/40">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground">
                  <GitBranch className="size-3.5 text-primary" />
                  <span>{isVi ? "Chọn kịch bản" : "Try a scenario"}</span>
                </span>
                {EVENT_LOOP_SCENARIOS.map((sc, idx) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleSelectScenario(idx)}
                    className={cn(
                      "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium transition-colors",
                      scenarioIdx === idx
                        ? "border-primary/50 bg-primary/15 text-foreground"
                        : "border-border bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {scenarioIdx === idx && (
                      <span className="size-1.5 rounded-full bg-primary" />
                    )}
                    <span>#{idx + 1}</span>
                  </button>
                ))}
              </div>
              <span className="text-[12px] text-muted-foreground">
                {activeScenario.title[locale]}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <button
                  type="button"
                  onClick={() =>
                    setStepIdx((s) => (s + 1) % activeScenario.steps.length)
                  }
                  className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs transition-transform hover:scale-105"
                  aria-label="Next tick step"
                >
                  <Play className="ml-0.5 size-4 fill-current" />
                </button>

                <div className="shrink-0 space-y-1.5">
                  <div className="font-mono text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
                    STEP {currentStep.stepNumber} /{" "}
                    {activeScenario.steps.length}
                  </div>
                  <div className="flex items-center gap-1">
                    {activeScenario.steps.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setStepIdx(idx)}
                        className={cn(
                          "h-1.5 cursor-pointer rounded-full transition-all",
                          stepIdx === idx
                            ? "w-4 bg-primary"
                            : "w-2 bg-muted-foreground/30"
                        )}
                        aria-label={`Step ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="min-w-0 flex-1 pl-1">
                  <div className="truncate text-[13.5px] font-semibold text-foreground">
                    {currentStep.phase}
                  </div>
                  <div className="line-clamp-1 text-[13px] text-muted-foreground">
                    <FormattedText text={currentStep.explanation[locale]} />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  disabled={stepIdx === 0}
                  onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-35"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={stepIdx >= activeScenario.steps.length - 1}
                  onClick={() =>
                    setStepIdx((s) =>
                      Math.min(activeScenario.steps.length - 1, s + 1)
                    )
                  }
                  className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground disabled:opacity-35"
                  aria-label="Next step"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. BENTO ROW: HOW IT WORKS (65%) + KEY POINT (35%) */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <section className="space-y-4 rounded-2xl border border-border bg-card p-6 lg:col-span-8">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <BookOpen className="size-3.5 text-primary" />
              <span>{isVi ? "THỨ TỰ ƯU TIÊN" : "HOW IT WORKS"}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {isVi
                ? "Chu trình 1 Vòng lặp Event Loop (Single Tick)"
                : "Exact Execution Order Within a Single Tick"}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-xl border border-border bg-background/60 p-4">
                <div className="font-mono text-xs font-bold text-primary">
                  1. Microtask Queue (Drains 100%)
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {isVi
                    ? "Ngay khi Call Stack trống, Event Loop rút cạn 100% Promise.then / queueMicrotask trước khi nhường cho Paint."
                    : "Whenever the Call Stack empties, the Event Loop drains 100% of Microtasks before yielding to Render."}
                </p>
              </div>
              <div className="space-y-1.5 rounded-xl border border-border bg-background/60 p-4">
                <div className="font-mono text-xs font-bold text-[var(--garden-pitfall-text)]">
                  2. Macrotask Queue (1 Per Tick)
                </div>
                <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                  {isVi
                    ? "Mỗi vòng lặp chỉ lấy đúng 1 Macrotask (click, MessageChannel, setTimeout), sau đó kiểm tra lại Microtask và VSync."
                    : "Executes only 1 Macrotask per tick, then immediately re-drains Microtasks and checks if VSync Paint is due."}
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-between rounded-2xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] p-6 lg:col-span-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                <Sprout className="size-3.5 text-primary" />
                <span>KEY POINT</span>
              </div>
              <div className="font-serif text-4xl leading-none text-primary/70">
                “
              </div>
              <p className="text-[16.5px] leading-snug font-bold text-foreground">
                {isVi
                  ? "Trên màn hình 60Hz, trình duyệt chỉ có 16.67ms để hoàn tất cả JS, rAF, Style, Layout, Paint và Composite."
                  : "On a 60Hz display, the browser has 16.67ms to finish JS, rAF, Style, Layout, Paint, and Composite."}
              </p>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              The 16.67ms Frame Contract.
            </div>
          </section>
        </div>

        {/* 4. 5-STAGE PIXEL PIPELINE CARD */}
        <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <Monitor className="size-3.5 text-primary" />
              <span>PIXEL PIPELINE</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {isVi
                ? "5 Giai đoạn Render Khung hình (JS → Style → Layout → Paint → Composite)"
                : "The 5-Stage Pixel Pipeline (JS → Style → Layout → Paint → Composite)"}
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
            {PIXEL_PIPELINE_STAGES.map((stage) => {
              const isSelected = stage.id === selectedStageId
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedStageId(stage.id)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 text-left transition-colors",
                    isSelected
                      ? "border-primary/50 bg-primary/15"
                      : "border-border bg-background/60 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-xs font-bold text-primary">
                      Stage {stage.step}
                    </span>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                      {stage.thread === "Main Thread" ? "Main" : "GPU"}
                    </span>
                  </div>
                  <div className="mt-1.5 font-mono text-xs font-semibold text-foreground">
                    {stage.name.replace(/^\d+\.\s*/, "")}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-4 rounded-xl border border-border bg-background/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  {activeStage.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {activeStage.summary[locale]}
                </p>
              </div>
              <span className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs text-foreground">
                {activeStage.thread} · {activeStage.costLevel}
              </span>
            </div>

            <ul className="space-y-2.5 text-[14px] leading-relaxed text-muted-foreground">
              {activeStage.details[locale].map((detail, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>
                    <FormattedText text={detail} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 5. CSS TRIGGERS & REACT CONCURRENT SCHEDULER */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <Layers className="size-3.5 text-primary" />
            <span>CSS TRIGGERS MATRIX</span>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {CSS_TRIGGER_CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="flex flex-col justify-between space-y-3 rounded-xl border border-border bg-background/60 p-4"
              >
                <div className="space-y-2">
                  <div className="text-sm font-bold text-foreground">
                    {cat.tier}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {cat.properties.map((prop) => (
                      <code
                        key={prop}
                        className="rounded border border-[var(--garden-code-pill-border)] bg-[var(--garden-code-pill-bg)] px-1.5 py-0.5 font-mono text-[11px] text-foreground"
                      >
                        {prop}
                      </code>
                    ))}
                  </div>
                </div>
                <p className="border-t border-border pt-2.5 text-[12.5px] leading-relaxed text-muted-foreground">
                  <FormattedText text={cat.recommendation[locale]} />
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 6. REACT CONCURRENT SCHEDULER INTERNALS */}
        <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <Cpu className="size-3.5 text-primary" />
            <span>REACT 19 CONCURRENT SCHEDULER</span>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5 rounded-xl border border-[var(--garden-pitfall-border)] bg-[var(--garden-pitfall-bg)] p-4">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--garden-pitfall-text)]">
                <AlertTriangle className="size-3.5" />
                <span>Why NOT Promise?</span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/85">
                <FormattedText
                  text={
                    isVi
                      ? "`Promise.then` đẩy vào Microtask Queue — trình duyệt rút cạn toàn bộ Microtask trước khi Paint nên vẫn gây treo giao diện."
                      : "`Promise.then` queues into Microtasks, which drain completely before Paint and starve user input."
                  }
                />
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-[var(--garden-pitfall-border)] bg-[var(--garden-pitfall-bg)] p-4">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[var(--garden-pitfall-text)]">
                <AlertTriangle className="size-3.5" />
                <span>Why NOT setTimeout(0)?</span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/85">
                <FormattedText
                  text={
                    isVi
                      ? "HTML5 Spec áp phạt tối thiểu 4ms khi lồng nhau >5 cấp, làm lãng phí quỹ 16.67ms."
                      : "Nested `setTimeout(0)` calls incur a 4ms minimum clamping penalty per HTML5 spec."
                  }
                />
              </p>
            </div>

            <div className="space-y-1.5 rounded-xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] p-4">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-primary">
                <CheckCircle2 className="size-3.5" />
                <span>MessageChannel & scheduler.yield()</span>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/90">
                <FormattedText
                  text={
                    isVi
                      ? "Đẩy Macrotask với độ trễ ~0ms, cho phép trình duyệt Paint và nhận sự kiện sau mỗi lát cắt 5ms."
                      : "Enqueues a ~0ms Macrotask so the browser can Paint and process input every 5ms slice."
                  }
                />
              </p>
            </div>
          </div>
        </section>

        {/* Footer Lesson Navigation */}
        <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <Link
            href="/"
            className="group flex cursor-pointer items-center gap-3 text-left"
          >
            <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-primary" />
            <div>
              <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                OVERVIEW
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-foreground group-hover:text-primary">
                {isVi ? "Tất cả mẫu hiệu năng" : "All performance patterns"}
              </div>
            </div>
          </Link>

          <Link
            href="/labs/rerender-storms"
            className="group flex cursor-pointer items-center gap-3 text-right"
          >
            <div>
              <div className="font-mono text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                NEXT LESSON
              </div>
              <div className="mt-0.5 text-[15px] font-bold text-foreground group-hover:text-primary">
                1.1 — Re-render Storms & Context Bloat
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
          </Link>
        </footer>
      </article>
    </div>
  )
}
