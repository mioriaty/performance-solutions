"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Layers,
  Lightbulb,
  ListChecks,
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
    <CodeBlock className="bg-card">
      <CodeBlockHeader className="border-b bg-muted/30 pb-3">
        <CodeBlockTitle>
          <Code2 className="text-primary" />
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_240px] xl:gap-10">
        {/* Main Documentation Column */}
        <article className="max-w-4xl min-w-0 space-y-12">
          {/* 1. Document Header */}
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
              <span className="rounded-md border bg-primary/10 px-2 py-0.5 font-mono font-medium text-primary">
                {isVi
                  ? "Phụ lục Nền tảng (Foundations Appendix)"
                  : "Foundations Appendix"}
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-[34px] lg:leading-[1.2]">
              {isVi
                ? "Cơ chế JavaScript Event Loop & Browser Rendering Pipeline"
                : "JavaScript Event Loop & Browser Rendering Pipeline Internals"}
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground sm:text-[17px]">
              {isVi
                ? "Nền tảng lý thuyết bắt buộc cho Senior Frontend Engineer: Hiểu rõ cách trình duyệt điều phối Call Stack, Microtasks, Macrotasks, nhịp VSync 16.67ms và 5 bước của Pixel Pipeline (JS → Style → Layout → Paint → Composite) để giải thích mọi bài toán hiệu năng."
                : "Essential mental models for Senior Frontend Engineers: How the browser orchestrates the Call Stack, Microtask & Macrotask Queues, 16.67ms VSync frames, and the 5-stage Pixel Pipeline (JS → Style → Layout → Paint → Composite)."}
            </p>

            <div className="mt-4 rounded-xl border bg-muted/30 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-foreground uppercase">
                <Lightbulb className="size-4 shrink-0 text-primary" />
                <span>
                  {isVi
                    ? "Nguyên lý cốt lõi (The 16.67ms Frame Contract)"
                    : "The 16.67ms Frame Contract"}
                </span>
              </div>
              <p className="mt-2 text-[15px] leading-7 text-foreground/90">
                <FormattedText
                  text={
                    isVi
                      ? "Trên màn hình **60Hz**, trình duyệt chỉ có đúng **16.67ms** (hoặc **8.33ms** trên màn hình **120Hz ProMotion**) để hoàn tất cả **JavaScript + Microtasks + requestAnimationFrame + Recalculate Style + Layout + Paint + Composite**. Bất kỳ mắt xích nào vượt quá ngân sách này đều gây **Dropped Frame (Jank)** hoặc làm đơ thao tác người dùng (**High INP**)."
                      : "On a **60Hz** display, the browser has exactly **16.67ms** (**8.33ms** on **120Hz ProMotion**) to complete **JavaScript + Microtasks + requestAnimationFrame + Style + Layout + Paint + Composite**. Exceeding this budget in any stage causes **Dropped Frames (Jank)** or delayed input response (**High INP**)."
                  }
                />
              </p>
            </div>
          </header>

          {/* 2. JavaScript Event Loop Architecture */}
          <section id="event-loop-theory" className="scroll-mt-20 space-y-6">
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                <Clock className="size-3.5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {isVi
                  ? "1. Kiến trúc JavaScript Event Loop & Thứ tự Ưu tiên Hàng đợi"
                  : "1. JavaScript Event Loop Architecture & Queue Priority"}
              </h2>
            </div>

            <p className="text-[15.5px] leading-7 text-foreground/90">
              <FormattedText
                text={
                  isVi
                    ? "Bản thân JavaScript Engine (V8) chỉ có **1 Call Stack** và **1 Memory Heap** trên Main Thread, nhưng trình duyệt hiện đại là một hệ thống đa luồng (Network Thread, Timer Thread, Compositor Thread, Worker Threads). **Event Loop** chính là bộ điều phối trung tâm quyết định khi nào lấy công việc từ hàng đợi nào đưa vào Call Stack và khi nào dừng lại để vẽ màn hình."
                    : "While the V8 JavaScript Engine has a **single Call Stack** and **Memory Heap** on the Main Thread, the browser surrounding it is multi-threaded (Network, Timers, Compositor, Workers). The **Event Loop** is the central coordinator deciding which queue feeds the Call Stack next and when to pause for rendering."
                }
              />
            </p>

            {/* 5 Core Runtime Components Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2 rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-foreground">
                    1. Call Stack (LIFO)
                  </h3>
                  <span className="rounded border bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                    Run-to-Completion
                  </span>
                </div>
                <p className="text-[14px] leading-6 text-foreground/85">
                  <FormattedText
                    text={
                      isVi
                        ? "Nơi thực thi từng hàm JS đồng bộ. Theo nguyên tắc **Run-to-Completion**, khi Call Stack chưa rỗng (ví dụ đang chạy vòng lặp `while` 500ms), trình duyệt **tuyệt đối không thể** xử lý sự kiện Click hay Paint màn hình."
                        : "Executes synchronous function frames. Due to **Run-to-Completion**, while the Call Stack is non-empty (e.g., a 500ms synchronous loop), the browser **cannot** process click events or paint frames."
                    }
                  />
                </p>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-primary">
                    2. Microtask Queue (Job Queue)
                  </h3>
                  <span className="rounded border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                    Highest Priority
                  </span>
                </div>
                <p className="text-[14px] leading-6 text-foreground/85">
                  <FormattedText
                    text={
                      isVi
                        ? "Chứa `Promise.then/catch/finally`, phần code sau `await`, `queueMicrotask()`, và `MutationObserver`. **Đặc điểm sống còn**: Ngay khi Call Stack trống, Event Loop sẽ **chạy cạn kiệt 100% Microtasks** (kể cả microtask mới đẻ thêm) trước khi làm bất kỳ việc gì khác!"
                        : "Holds `Promise.then`, `await` continuations, `queueMicrotask()`, and `MutationObserver`. **Critical rule**: Whenever the Call Stack empties, the Event Loop **drains 100% of the Microtask Queue** (including newly spawned microtasks) before yielding to Render or Macrotasks!"
                    }
                  />
                </p>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    3. Render Opportunity (VSync 16.6ms)
                  </h3>
                  <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    60Hz / 120Hz
                  </span>
                </div>
                <p className="text-[14px] leading-6 text-foreground/85">
                  <FormattedText
                    text={
                      isVi
                        ? "Sau khi Microtask Queue đã rỗng và đến nhịp quét màn hình (VSync), trình duyệt chạy: `ResizeObserver` → `IntersectionObserver` → **`requestAnimationFrame` (rAF)** → **Style → Layout → Paint → Composite**."
                        : "Once Microtasks drain and the display VSync approaches, the browser executes: `ResizeObserver` → `IntersectionObserver` → **`requestAnimationFrame` (rAF)** → **Style → Layout → Paint → Composite**."
                    }
                  />
                </p>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-mono text-sm font-bold text-amber-600 dark:text-amber-400">
                    4. Macrotask Queue (Task Queue)
                  </h3>
                  <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                    1 Task Per Tick
                  </span>
                </div>
                <p className="text-[14px] leading-6 text-foreground/85">
                  <FormattedText
                    text={
                      isVi
                        ? "Chứa sự kiện người dùng (`click`, `keydown`), `MessageChannel`, `setTimeout`, `setInterval`, I/O. **Khác biệt lớn nhất với Microtask**: Mỗi vòng lặp Event Loop chỉ lấy ra **ĐÚNG 1 Macrotask** để chạy, sau đó phải quay lại kiểm tra Microtask và Render!"
                        : "Holds DOM Input Events (`click`, `keydown`), `MessageChannel`, `setTimeout`, `setInterval`, and I/O. **Key difference from Microtasks**: The Event Loop executes **ONLY 1 Macrotask per tick**, then immediately re-drains Microtasks and checks if a Frame Render is due!"
                    }
                  />
                </p>
              </div>
            </div>

            {/* Single Tick Execution Order Visual Banner */}
            <div className="space-y-3 rounded-xl border bg-card p-5">
              <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {isVi
                  ? "Chu trình chuẩn của 1 Vòng lặp Event Loop (1 Tick Lifecycle)"
                  : "Exact Execution Order Within a Single Event Loop Tick"}
              </div>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
                {[
                  {
                    step: "Step 1",
                    title: "1 Macrotask",
                    desc: isVi
                      ? "Lấy đúng 1 task từ Macrotask Queue đưa vào Call Stack"
                      : "Pop exactly 1 task from Macrotask Queue onto Call Stack",
                  },
                  {
                    step: "Step 2",
                    title: "All Microtasks",
                    desc: isVi
                      ? "Rút cạn 100% Promise / queueMicrotask cho tới khi rỗng"
                      : "Drain 100% of Promise / queueMicrotask until empty",
                  },
                  {
                    step: "Step 3",
                    title: "rAF Callbacks",
                    desc: isVi
                      ? "Nếu đến nhịp VSync (16.6ms): chạy requestAnimationFrame"
                      : "If VSync frame is due (16.6ms): run requestAnimationFrame",
                  },
                  {
                    step: "Step 4",
                    title: "Style • Layout • Paint",
                    desc: isVi
                      ? "Tính CSS, hình học Layout, tạo lệnh Paint và đẩy xuống GPU"
                      : "Compute CSS, Layout geometry, Paint records & Composite",
                  },
                  {
                    step: "Step 5",
                    title: "Idle / Next Tick",
                    desc: isVi
                      ? "Chạy requestIdleCallback (nếu còn dư giờ) rồi sang Macrotask mới"
                      : "Run requestIdleCallback (if budget left), then next Macrotask",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="relative space-y-1 rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="font-mono text-[11px] font-semibold text-primary">
                      {item.step}
                    </div>
                    <div className="font-mono text-xs font-bold text-foreground">
                      {item.title}
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 3. Interactive Event Loop & Frame Lifecycle Simulator */}
          <section
            id="interactive-simulator"
            className="scroll-mt-20 space-y-5 border-t pt-8"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                  <Play className="size-3.5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isVi
                    ? "2. Mô phỏng Tương tác Event Loop & Vòng đời Frame (Interactive Stepper)"
                    : "2. Interactive Event Loop & Frame Lifecycle Simulator"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isVi
                  ? "Chọn kịch bản bên dưới và bấm Step qua từng bước để quan sát trực tiếp Call Stack, Microtasks, rAF và Macrotasks:"
                  : "Select a scenario below and step through each tick to inspect the Call Stack, Microtasks, rAF, and Macrotasks:"}
              </p>
            </div>

            {/* Scenario Selector Tabs */}
            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
              {EVENT_LOOP_SCENARIOS.map((sc, idx) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(idx)}
                  className={cn(
                    "cursor-pointer rounded-xl border p-3.5 text-left transition-all",
                    scenarioIdx === idx
                      ? "border-primary bg-primary/8 text-foreground shadow-2xs"
                      : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  <div className="text-[13.5px] leading-snug font-semibold text-foreground">
                    {sc.title[locale]}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {sc.subtitle[locale]}
                  </div>
                </button>
              ))}
            </div>

            {/* Simulator Frame */}
            <div className="overflow-hidden rounded-xl border bg-card">
              {/* Top Stepper Control Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="rounded-md border bg-background px-2.5 py-1 font-mono text-xs font-semibold text-foreground">
                    Step {currentStep.stepNumber} /{" "}
                    {activeScenario.steps.length}
                  </span>
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                    {currentStep.phase}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={stepIdx === 0}
                    onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
                    className="cursor-pointer gap-1"
                  >
                    <ChevronLeft className="size-3.5" />
                    <span>{isVi ? "Bước trước" : "Prev"}</span>
                  </Button>

                  <Button
                    size="xs"
                    disabled={stepIdx >= activeScenario.steps.length - 1}
                    onClick={() =>
                      setStepIdx((s) =>
                        Math.min(activeScenario.steps.length - 1, s + 1)
                      )
                    }
                    className="cursor-pointer gap-1"
                  >
                    <span>{isVi ? "Bước tiếp theo" : "Next Step"}</span>
                    <ChevronRight className="size-3.5" />
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => setStepIdx(0)}
                    className="cursor-pointer gap-1"
                  >
                    <RotateCcw className="size-3.5" />
                    <span>{isVi ? "Đặt lại" : "Reset"}</span>
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 p-4 sm:p-5 lg:grid-cols-2">
                {/* Left: Highlighted Code Preview */}
                <div className="space-y-3">
                  <FoundationCodeBlock
                    title={activeScenario.title[locale]}
                    filename="event-loop-trace.ts"
                    code={activeScenario.code}
                  />
                </div>

                {/* Right: Live Queues & Console Output */}
                <div className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    {/* Explanation Box */}
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 text-[13.5px] leading-6 text-foreground">
                      <FormattedText text={currentStep.explanation[locale]} />
                    </div>

                    {/* 4 Queue Visualization Boxes */}
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="font-mono text-[11px] font-semibold text-muted-foreground uppercase">
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
                                className="rounded border bg-background px-2 py-1 text-foreground"
                              >
                                {item}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="font-mono text-[11px] font-semibold text-primary uppercase">
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

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="font-mono text-[11px] font-semibold text-emerald-600 uppercase dark:text-emerald-400">
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
                                className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-600 dark:text-emerald-400"
                              >
                                {item}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="rounded-lg border bg-muted/20 p-3">
                        <div className="font-mono text-[11px] font-semibold text-amber-600 uppercase dark:text-amber-400">
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
                                className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-600 dark:text-amber-400"
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
                  <div className="rounded-lg border bg-muted/40 p-3 font-mono text-xs">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                      <Terminal className="size-3.5" />
                      <span>Console Output</span>
                    </div>
                    <div className="space-y-1">
                      {currentStep.consoleOutput.map((line, i) => (
                        <div key={i} className="text-foreground">
                          <span className="mr-2 text-muted-foreground">
                            &gt;
                          </span>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. Browser Rendering Pipeline & Pixel Pipeline */}
          <section
            id="rendering-pipeline"
            className="scroll-mt-20 space-y-6 border-t pt-8"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                  <Monitor className="size-3.5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isVi
                    ? "3. Browser Rendering Pipeline: Từ DOM/CSSOM đến Điểm ảnh trên Màn hình"
                    : "3. Browser Rendering Pipeline: From DOM/CSSOM to Screen Pixels"}
                </h2>
              </div>
              <p className="text-[15px] leading-7 text-foreground/90">
                <FormattedText
                  text={
                    isVi
                      ? "Trước khi bước vào vòng lặp khung hình, trình duyệt phân tích cú pháp HTML thành **DOM Tree** và CSS thành **CSSOM Tree**, sau đó kết hợp cả hai thành **Render Tree** (chỉ giữ lại các node hiển thị; các phần tử có `display: none` bị loại bỏ hoàn toàn khỏi Render Tree, trong khi `visibility: hidden` vẫn chiếm không gian hình học). Trong mỗi khung hình 16.67ms, trình duyệt thực thi tuần tự **5 giai đoạn của Pixel Pipeline** dưới đây:"
                      : "Before entering the frame loop, the browser parses HTML into the **DOM Tree** and CSS into the **CSSOM Tree**, combining them into the **Render Tree** (omitting `display: none` nodes entirely while keeping `visibility: hidden` boxes). Within each 16.67ms frame, the browser executes the **5-stage Pixel Pipeline** below:"
                  }
                />
              </p>
            </div>

            {/* Interactive 5-Stage Pixel Pipeline Selector */}
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
                        ? "border-primary bg-primary/10 shadow-2xs"
                        : "bg-card hover:bg-muted/40"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-primary">
                        Stage {stage.step}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 font-mono text-[10px]",
                          stage.thread === "Main Thread"
                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                            : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
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

            {/* Selected Pipeline Stage Deep-Dive Card */}
            <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {activeStage.name}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeStage.summary[locale]}
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="rounded-md border bg-muted px-2.5 py-1 text-foreground">
                    Thread: {activeStage.thread}
                  </span>
                  <span className="rounded-md border bg-muted px-2.5 py-1 text-foreground">
                    Cost: {activeStage.costLevel}
                  </span>
                </div>
              </div>

              <ul className="space-y-3 border-l-2 border-primary/40 pl-4 text-[15px] leading-7 text-foreground/90">
                {activeStage.details[locale].map((detail, idx) => (
                  <li key={idx}>
                    <FormattedText text={detail} />
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                <span className="text-xs font-semibold text-muted-foreground">
                  {isVi
                    ? "Bài Lab thực hành tương ứng:"
                    : "Related Interactive Labs:"}
                </span>
                {activeStage.relatedLabs.map((lab) => (
                  <Link
                    key={lab.slug}
                    href={`/labs/${lab.slug}`}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border bg-muted/50 px-2.5 py-1 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                  >
                    <span>
                      Lab {lab.code} • {lab.label}
                    </span>
                    <ArrowRight className="size-3" />
                  </Link>
                ))}
              </div>
            </div>
          </section>

          {/* 5. CSS Triggers Matrix: Layout vs. Paint vs. Composite */}
          <section
            id="css-triggers"
            className="scroll-mt-20 space-y-6 border-t pt-8"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                  <Layers className="size-3.5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isVi
                    ? "4. Bảng Phân loại CSS Triggers: Thay đổi thuộc tính nào kích hoạt bước nào?"
                    : "4. CSS Triggers Matrix: Which CSS Properties Trigger Layout, Paint, or Composite?"}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground">
                {isVi
                  ? "Không phải mọi thuộc tính CSS đều có chi phí như nhau. Trình duyệt có thể bỏ qua hoàn toàn bước Layout hoặc cả bước Paint tùy thuộc vào thuộc tính bạn thay đổi:"
                  : "Not all CSS mutations are equal. The browser engine can skip Layout or both Layout and Paint depending on which property you mutate:"}
              </p>
            </div>

            <div className="space-y-4">
              {CSS_TRIGGER_CATEGORIES.map((cat, idx) => (
                <div
                  key={idx}
                  className="space-y-4 rounded-xl border bg-card p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-foreground">
                      {cat.tier}
                    </h3>
                    <span
                      className={cn(
                        "rounded-md border px-2.5 py-1 font-mono text-xs font-medium",
                        cat.badgeColor === "amber"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : cat.badgeColor === "blue"
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      {cat.threadImpact[locale]}
                    </span>
                  </div>

                  {/* Pipeline Path Pills */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Pipeline:
                    </span>
                    {cat.pipelinePath.map((step, sIdx) => (
                      <React.Fragment key={sIdx}>
                        <span className="rounded border bg-muted px-2.5 py-0.5 font-mono text-xs font-semibold text-foreground">
                          {step}
                        </span>
                        {sIdx < cat.pipelinePath.length - 1 && (
                          <ArrowRight className="size-3.5 text-muted-foreground" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* CSS Properties List */}
                  <div className="flex flex-wrap gap-1.5">
                    {cat.properties.map((prop) => (
                      <code
                        key={prop}
                        className="rounded-md border bg-muted/40 px-2 py-0.5 font-mono text-xs text-foreground"
                      >
                        {prop}
                      </code>
                    ))}
                  </div>

                  <p className="border-t pt-3 text-[14px] leading-6 text-foreground/85">
                    <FormattedText text={cat.recommendation[locale]} />
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 6. React 19 Fiber & Concurrent Scheduler Mapping */}
          <section
            id="react-concurrent-scheduler"
            className="scroll-mt-20 space-y-6 border-t pt-8"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 items-center justify-center rounded-md border bg-muted/60 text-foreground">
                  <Cpu className="size-3.5" />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground">
                  {isVi
                    ? "5. React 19 Concurrent Scheduler: Tại sao React dùng MessageChannel thay vì setTimeout hay Promise?"
                    : "5. React 19 Concurrent Scheduler: Why React Uses MessageChannel Instead of setTimeout or Promises"}
                </h2>
              </div>
              <p className="text-[15px] leading-7 text-foreground/90">
                <FormattedText
                  text={
                    isVi
                      ? "Một câu hỏi phỏng vấn Senior/Staff FE kinh điển: **Làm thế nào React Concurrent Mode (`startTransition`) có thể tạm dừng việc render cây Component sau mỗi 5ms để nhường cho trình duyệt vẽ khung hình và nhận sự kiện bàn phím?**"
                      : "A classic Senior/Staff FE architecture question: **How does React Concurrent Mode (`startTransition`) pause component tree rendering every 5ms to let the browser paint and process user input?**"
                  }
                />
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Tại sao KHÔNG dùng Promise?</span>
                </div>
                <p className="text-[13.5px] leading-6 text-foreground/85">
                  <FormattedText
                    text={
                      isVi
                        ? "`Promise.then` đẩy công việc vào **Microtask Queue**. Như đã thấy ở phần 1, trình duyệt rút cạn toàn bộ Microtask trước khi Paint → Giao diện vẫn bị treo cứng (Microtask Starvation)!"
                        : "`Promise.then` queues into the **Microtask Queue**. Because the browser drains all microtasks before painting, yielding to a Promise still starves Browser Paint and User Input!"
                    }
                  />
                </p>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span>Tại sao KHÔNG dùng setTimeout(0)?</span>
                </div>
                <p className="text-[13.5px] leading-6 text-foreground/85">
                  <FormattedText
                    text={
                      isVi
                        ? "Theo chuẩn HTML5 Spec, khi `setTimeout` lồng nhau quá 5 cấp, trình duyệt tự động áp đặt mức phạt **4ms Minimum Clamping**. Nghĩa là mỗi lần nhường luồng sẽ bị lãng phí mất 4ms chết trong quỹ 16.67ms!"
                        : "Per the HTML5 spec, nested `setTimeout(..., 0)` calls beyond depth 5 are throttled to a **minimum 4ms delay**. Wasting 4ms per yield would destroy a 16.67ms frame budget!"
                    }
                  />
                </p>
              </div>

              <div className="space-y-2 rounded-xl border bg-card p-4">
                <div className="flex items-center gap-2 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Giải pháp: MessageChannel & scheduler.yield()</span>
                </div>
                <p className="text-[13.5px] leading-6 text-foreground/85">
                  <FormattedText
                    text={
                      isVi
                        ? "React Scheduler tạo một cặp cổng `const { port1, port2 } = new MessageChannel()`. Gọi `port2.postMessage(null)` đẩy một **Macrotask thực thụ với độ trễ ~0ms** (không bị phạt 4ms), cho phép trình duyệt xử lý Input & Paint ngay giữa các lát cắt 5ms!"
                        : "React Scheduler uses `new MessageChannel()`. Calling `port2.postMessage(null)` enqueues a **Macrotask with ~0ms clamping delay**, letting the browser handle Input and Paint between 5ms work slices!"
                    }
                  />
                </p>
              </div>
            </div>

            <FoundationCodeBlock
              title={
                isVi
                  ? "Bên trong bộ lập lịch Time-Slicing 5ms của React Concurrent Scheduler"
                  : "Inside React's 5ms Time-Slicing Concurrent Scheduler Loop"
              }
              filename="react-scheduler-internals.ts"
              code={`const YIELD_INTERVAL_MS = 5; // React yields every 5ms so 60Hz/120Hz frames stay smooth
const channel = new MessageChannel();

function workLoopConcurrent() {
  const startTime = performance.now();

  while (workInProgressFiber !== null) {
    // Check if 5ms budget has elapsed or high-priority user input is pending
    if (performance.now() - startTime >= YIELD_INTERVAL_MS) {
      // Yield back to Browser Event Loop via MessageChannel (0ms Macrotask!)
      channel.port2.postMessage(null);
      return; // Pause Fiber rendering -> Browser can now handle Click & Paint!
    }
    workInProgressFiber = performUnitOfWork(workInProgressFiber);
  }
}

channel.port1.onmessage = () => {
  // Resumes Fiber rendering in the next Macrotask tick
  workLoopConcurrent();
};`}
            />
          </section>

          {/* Footer Navigation to First Lab */}
          <footer className="flex flex-wrap items-center justify-between gap-4 border-t pt-8">
            <Link
              href="/"
              className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted/50"
            >
              <ArrowLeft className="size-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">Overview</div>
                <div className="font-semibold text-foreground">
                  {isVi
                    ? "Tổng quan & Ma trận Chẩn đoán"
                    : "Overview & Diagnostic Matrix"}
                </div>
              </div>
            </Link>

            <Link
              href="/labs/rerender-storms"
              className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-right text-sm transition-colors hover:bg-muted/50"
            >
              <div>
                <div className="text-xs text-muted-foreground">
                  Start Pillar 1
                </div>
                <div className="font-semibold text-foreground">
                  1.1 — Re-render Storms & Context Bloat
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground" />
            </Link>
          </footer>
        </article>

        {/* Right Sticky Table of Contents */}
        <aside className="hidden xl:block">
          <div className="sticky top-20 space-y-6 border-l pl-5">
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-foreground uppercase">
                <ListChecks className="size-3.5 text-muted-foreground" />
                <span>{isVi ? "Mục lục phụ lục" : "On this page"}</span>
              </div>

              <ul className="space-y-2 text-[13px] text-muted-foreground">
                <li>
                  <a
                    href="#overview"
                    className="block transition-colors hover:text-foreground"
                  >
                    {isVi
                      ? "Ngân sách khung hình 16.67ms"
                      : "The 16.67ms Frame Contract"}
                  </a>
                </li>
                <li>
                  <a
                    href="#event-loop-theory"
                    className="block transition-colors hover:text-foreground"
                  >
                    {isVi
                      ? "1. Kiến trúc Event Loop"
                      : "1. Event Loop Architecture"}
                  </a>
                </li>
                <li>
                  <a
                    href="#interactive-simulator"
                    className="block transition-colors hover:text-foreground"
                  >
                    {isVi
                      ? "2. Mô phỏng Event Loop"
                      : "2. Interactive Simulator"}
                  </a>
                </li>
                <li>
                  <a
                    href="#rendering-pipeline"
                    className="block transition-colors hover:text-foreground"
                  >
                    {isVi
                      ? "3. Browser Pixel Pipeline"
                      : "3. Browser Pixel Pipeline"}
                  </a>
                </li>
                <li>
                  <a
                    href="#css-triggers"
                    className="block transition-colors hover:text-foreground"
                  >
                    {isVi
                      ? "4. Bảng phân loại CSS Triggers"
                      : "4. CSS Triggers Matrix"}
                  </a>
                </li>
                <li>
                  <a
                    href="#react-concurrent-scheduler"
                    className="block transition-colors hover:text-foreground"
                  >
                    {isVi
                      ? "5. React 19 Concurrent Scheduler"
                      : "5. React 19 Concurrent Scheduler"}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
