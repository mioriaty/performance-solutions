"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Box,
  Check,
  CheckCircle2,
  Code2,
  Compass,
  GitBranch,
  HelpCircle,
  Layers,
  Network,
  Play,
  RotateCcw,
  ShieldAlert,
  Terminal,
} from "lucide-react"
import type { Locale } from "@/i18n/request"
import {
  CLOSE_CODE_REFERENCE,
  REALTIME_TRANSPORT_COMPARISON,
  WEBSOCKET_FAILURE_PLAYBOOK,
  WEBSOCKET_SIM_SCENARIOS,
} from "@/lib/foundations/websocket-content"
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
  CardAction,
  CardContent,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  WorkbookHorizontalStepper,
  WorkbookMetricStrip,
  WorkbookRightInspector,
  type StageMetricItem,
} from "@/components/layout/workbook-stage-primitives"
import { useHighlightedCode } from "@/hooks/use-highlighted-code"
import { cn } from "@/lib/utils"

function WsCodeBlock({
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

export function WebSocketGuide() {
  const locale = useLocale() as Locale
  const isVi = locale === "vi"

  const markLabViewed = useTelemetryStore((s) => s.markLabViewed)

  const [activeTab, setActiveTab] = useState<"model" | "diagram" | "code">(
    "model"
  )
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(0)
  const [playbookIdx, setPlaybookIdx] = useState(0)

  useEffect(() => {
    markLabViewed("f:web-socket", "/foundations/web-socket")
  }, [markLabViewed])

  const activeScenario =
    WEBSOCKET_SIM_SCENARIOS[scenarioIdx] ?? WEBSOCKET_SIM_SCENARIOS[0]
  const totalSteps = activeScenario.steps.length
  const safeStepIdx = stepIdx < totalSteps ? stepIdx : 0
  const currentStep =
    activeScenario.steps[safeStepIdx] ?? activeScenario.steps[0]

  const activePlaybook =
    WEBSOCKET_FAILURE_PLAYBOOK[playbookIdx] ?? WEBSOCKET_FAILURE_PLAYBOOK[0]

  const topicMeta = FOUNDATION_TOPICS[1]
  const isClosed = currentStep.readyState.startsWith("3")

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
      label: "READY STATE",
      value: currentStep.readyState,
      tone: isClosed ? "warn" : "good",
      highlight: true,
    },
    {
      label: "TABS → SOCKETS",
      value: `${currentStep.clientMetrics.activeTabs} → ${currentStep.clientMetrics.tcpSockets}`,
    },
    {
      label: "SEQ CURSOR",
      value: `${currentStep.clientMetrics.lastSeqId}`,
    },
    {
      label: "BACKOFF DELAY",
      value: currentStep.clientMetrics.backoffDelay,
    },
    {
      label: "BUFFERED",
      value: currentStep.clientMetrics.bufferedBytes,
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
                        {isVi ? "Bài 2 / 2" : "Lesson 2 of 2"}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="amber">RFC 6455</Badge>
                  <Badge variant="mint">Production</Badge>
                  <Badge variant="periwinkle">
                    {totalSteps} {isVi ? "bước" : "steps"}
                  </Badge>
                </div>
              </div>

              <div>
                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-[30px] sm:leading-[1.18]">
                  WebSocket Architecture, Peak-Time & Resilience
                </h1>
                <p className="mt-1.5 max-w-3xl text-[14.5px] leading-relaxed text-muted-foreground">
                  {topicMeta.summary[locale]}
                </p>
              </div>
            </div>

            {/* Socket Telemetry Strip + Scenario Buttons */}
            <WorkbookMetricStrip
              metrics={stageMetrics}
              actions={
                <>
                  {WEBSOCKET_SIM_SCENARIOS.map((sc, idx) => (
                    <Button
                      key={sc.id}
                      variant={scenarioIdx === idx ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSelectScenario(idx)}
                    >
                      <span>{sc.badge}</span>
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

            {/* Stage Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) =>
                setActiveTab(v as "model" | "diagram" | "code")
              }
              className="gap-3"
            >
              <TabsList className="border border-border bg-muted/70 font-mono">
                <TabsTrigger value="model" className="font-mono text-xs">
                  <Box data-icon="inline-start" />
                  <span>{isVi ? "Mô hình tương tác" : "Interactive Wire"}</span>
                </TabsTrigger>
                <TabsTrigger value="diagram" className="font-mono text-xs">
                  <GitBranch data-icon="inline-start" />
                  <span>{isVi ? "Sơ đồ kiến trúc" : "Architecture"}</span>
                </TabsTrigger>
                <TabsTrigger value="code" className="font-mono text-xs">
                  <Code2 data-icon="inline-start" />
                  <span>TypeScript Code</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="model">
                <div className="bg-stage-grid flex flex-col gap-4 rounded-xl border border-border bg-background/55 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold text-foreground">
                      {activeScenario.title[locale]}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {activeScenario.subtitle[locale]}
                    </span>
                  </div>

                  {/* 3-Node Pipeline */}
                  <div className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-foreground uppercase">
                          1. Browser / SharedWorker
                        </span>
                        <span className="size-2.5 rounded-full border border-[var(--ink)] bg-primary" />
                      </div>
                      <div className="mt-2.5 flex flex-col gap-1.5 font-mono text-xs">
                        {currentStep.clientQueue.map((item, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border bg-background/80 px-2.5 py-1.5 text-foreground"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div
                      className={cn(
                        "rounded-xl border-[1.5px] border-[var(--ink)] p-4 shadow-[var(--shadow-ink-sm)]",
                        isClosed
                          ? "bg-[var(--garden-pitfall-bg)]"
                          : "bg-[var(--garden-keypoint-bg)]"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-foreground uppercase">
                          2. Wire Frames (TCP/TLS)
                        </span>
                        <Network className="size-3.5 text-foreground" />
                      </div>
                      <div className="mt-2.5 flex flex-col gap-1.5 font-mono text-xs">
                        {currentStep.wireFrames.map((frame, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-foreground"
                          >
                            {frame}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-foreground uppercase">
                          3. Gateway & Pub/Sub
                        </span>
                        <Layers className="size-3.5 text-foreground" />
                      </div>
                      <div className="mt-2.5 flex flex-col gap-1.5 font-mono text-xs">
                        {currentStep.serverState.map((st, idx) => (
                          <div
                            key={idx}
                            className="rounded-lg border border-border bg-background/80 px-2.5 py-1.5 text-muted-foreground"
                          >
                            {st}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Console Trace */}
                  <div className="rounded-xl border border-border bg-card p-3.5 font-mono text-xs">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                      <Terminal className="size-3.5 text-foreground" />
                      <span>Runtime Telemetry & Socket Trace</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {currentStep.consoleLogs.map((line, i) => (
                        <div key={i} className="text-foreground">
                          <span className="mr-2 font-bold">&gt;</span>
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="diagram">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Alert variant="pitfall" className="p-4">
                    <AlertTriangle />
                    <AlertTitle>
                      {isVi
                        ? "Triển Khai Ngây Thơ (Naive WebSocket)"
                        : "Naive Fragile WebSocket"}
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 flex flex-col gap-2">
                        <li>
                          • Mở `new WebSocket()` mỗi Tab → 10 Tab chiếm 10 kết
                          nối TCP riêng biệt.
                        </li>
                        <li>
                          • Không có Heartbeat `PING/PONG` → treo vô hạn khi đứt
                          mạng ngầm (Half-Open).
                        </li>
                        <li>
                          • Reconnect cố định 1000ms → gây bão Thundering Herd
                          tự DDoS cụm Gateway.
                        </li>
                        <li>
                          • `setState` từng gói tin (500 msg/s) → làm nghẽn cứng
                          Main Thread.
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Alert variant="goodToKnow" className="p-4">
                    <CheckCircle2 />
                    <AlertTitle>
                      {isVi
                        ? "Kiến Trúc Chuẩn Production (Resilient)"
                        : "Production Resilient Architecture"}
                    </AlertTitle>
                    <AlertDescription>
                      <ul className="mt-2 flex flex-col gap-2">
                        <li>
                          • <strong>SharedWorker Multiplexer</strong>: Gom mọi
                          Tab vào 1 kết nối TCP duy nhất.
                        </li>
                        <li>
                          • <strong>Heartbeat Watchdog</strong>: Phát hiện và
                          khôi phục Zombie Socket ≤ 5 giây.
                        </li>
                        <li>
                          • <strong>Exponential Backoff + Full Jitter</strong> +{" "}
                          <strong>Sequence Replay</strong>.
                        </li>
                        <li>
                          • <strong>rAF 60Hz Batching</strong> & kiểm soát
                          `bufferedAmount` chống tràn bộ nhớ.
                        </li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="code">
                <WsCodeBlock
                  title={activeScenario.title[locale]}
                  filename="resilient-websocket.ts"
                  code={activeScenario.code}
                />
              </TabsContent>
            </Tabs>

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
            lessonId="f:web-socket"
            stepIndex={safeStepIdx}
            totalSteps={totalSteps}
            badgeLabel={isClosed ? "DISCONNECTED" : "RFC 6455"}
            badgeVariant={isClosed ? "peach" : "sky"}
            stepTitle={currentStep.phase}
            stepBody={currentStep.explanation[locale]}
            goodToKnowTitle={isVi ? "ĐIỂM CỐT LÕI" : "GOOD TO KNOW"}
            goodToKnowText={
              isVi
                ? "Mở kết nối WebSocket chỉ tốn 3 dòng code, nhưng giữ nó sống sót qua rớt mạng ngầm và **Peak Time** luôn cần Heartbeat, Full Jitter Backoff, Sequence ID và SharedWorker."
                : "Opening a WebSocket takes 3 lines of code; surviving silent drops and **peak-time** reconnect storms requires Heartbeats, Full Jitter Backoff, Sequence IDs, and SharedWorkers."
            }
            whatChangedTitle={isVi ? "THÔNG SỐ SOCKET" : "WHAT CHANGED"}
            whatChangedItems={[
              `State: ${currentStep.readyState}`,
              `Tabs → TCP: ${currentStep.clientMetrics.activeTabs} → ${currentStep.clientMetrics.tcpSockets}`,
              `Seq Cursor: ${currentStep.clientMetrics.lastSeqId}`,
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
            nextLessonHref="/labs/rerender-storms"
            nextLessonTitle="Next: 1.1 Re-render Storms"
            backLabel={isVi ? "Trước" : "Back"}
            shortcutHints={[
              { keys: ["←", "→"], label: isVi ? "bước" : "step" },
              { keys: ["R"], label: "reset" },
            ]}
            youWillLearnTitle={isVi ? "BẠN SẼ NẮM VỮNG" : "YOU'LL LEARN"}
            youWillLearnItems={topicMeta.highlights[locale]}
          />
        </div>

        {/* BELOW-THE-FOLD: HOW IT WORKS + 6 PRODUCTION FAILURE PLAYBOOK */}
        <Card>
          <CardHeader>
            <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <BookOpen className="mr-1.5 inline size-3.5" />
              {isVi
                ? "LÝ THUYẾT & CƠ CHẾ HOẠT ĐỘNG (RFC 6455)"
                : "HOW WEBSOCKET WORKS UNDER THE HOOD"}
            </div>
            <CardTitle className="text-lg">
              {isVi
                ? "Nâng cấp từ HTTP/1.1 sang đường ống TCP Full-Duplex hai chiều"
                : "Upgrading HTTP/1.1 into a persistent Full-Duplex TCP Framing Tunnel"}
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-4 border-t border-border pt-4">
            <div className="flex flex-col gap-1.5">
              <div className="font-mono text-xs font-bold text-foreground">
                1.{" "}
                {isVi
                  ? "Bắt tay HTTP 101 & Cấu trúc Frame (FIN, Opcode, Masking)"
                  : "HTTP 101 Handshake & Wire Frame Structure"}
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                <FormattedText
                  text={
                    isVi
                      ? "Client gửi `Upgrade: websocket` và `Sec-WebSocket-Key`. Server băm `SHA-1` trả về `Sec-WebSocket-Accept`. Dữ liệu chia thành các Frame siêu nhẹ (chỉ 2–6 bytes header) gồm bit `FIN`, `Opcode` (`0x1` Text, `0x2` Binary, `0x8` Close, `0x9` Ping, `0xA` Pong) và `Masking Key` 4 bytes."
                      : "The client sends `Upgrade: websocket` and `Sec-WebSocket-Key`. Once upgraded (`101 Switching Protocols`), data travels in frames with only 2–6 bytes of overhead (`FIN`, `Opcode`, and client-to-server 4-byte `Masking Key`)."
                  }
                />
              </p>
            </div>

            <div className="text-muted-foreground">
              <ArrowDown className="size-4" />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="font-mono text-xs font-bold text-foreground">
                2.{" "}
                {isVi
                  ? "Kiến trúc Hạ tầng Stateful & Lớp đồng bộ Pub/Sub Backplane"
                  : "Stateful Gateways & Horizontal Pub/Sub Backplane"}
              </div>
              <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                <FormattedText
                  text={
                    isVi
                      ? "Mỗi kết nối WebSocket giữ 1 File Descriptor trên một Gateway Node cụ thể. Khi scale ngang 20 node, các bản tin liên node được định tuyến qua **Redis Streams / Kafka / NATS Backplane**."
                      : "Each open WebSocket holds a persistent OS file descriptor on a specific gateway node; cross-node messages route through a **Redis / Kafka / NATS Backplane**."
                  }
                />
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 6 Production Failure & Peak-Time Scenarios */}
        <Card>
          <CardHeader>
            <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <Compass className="mr-1.5 inline size-3.5" />
              {isVi
                ? "6 BÀI TOÁN THỰC CHIẾN (MẤT KẾT NỐI & PEAK TIME)"
                : "6 PRODUCTION FAILURE & PEAK-TIME PLAYBOOK"}
            </div>
            <CardTitle className="text-lg text-balance">
              {activePlaybook.title[locale]}
            </CardTitle>
            <CardAction>
              <Badge variant="secondary" className="tabular-nums">
                {playbookIdx + 1} / {WEBSOCKET_FAILURE_PLAYBOOK.length}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {WEBSOCKET_FAILURE_PLAYBOOK.map((item, idx) => (
                <Button
                  key={item.id}
                  variant={playbookIdx === idx ? "default" : "secondary"}
                  size="xs"
                  className="h-auto max-w-full py-1.5 text-left whitespace-normal"
                  onClick={() => setPlaybookIdx(idx)}
                >
                  {item.shortLabel[locale]}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="font-mono text-[10.5px] font-bold tracking-wider text-[var(--garden-pitfall-text)] uppercase">
                  1. {isVi ? "Hiện tượng" : "Symptom"}
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  <FormattedText text={activePlaybook.problem[locale]} />
                </p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <div className="font-mono text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                  2. {isVi ? "Nguyên nhân gốc" : "Root Cause"}
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-muted-foreground">
                  <FormattedText text={activePlaybook.rootCause[locale]} />
                </p>
              </div>
              <div className="rounded-xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] p-4">
                <div className="font-mono text-[10.5px] font-bold tracking-wider text-foreground uppercase">
                  3. {isVi ? "Giải pháp kiến trúc" : "Production Fix"}
                </div>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-foreground/90">
                  <FormattedText text={activePlaybook.solution[locale]} />
                </p>
              </div>
            </div>

            <WsCodeBlock
              title={activePlaybook.title[locale]}
              filename={activePlaybook.codeTitle}
              code={activePlaybook.code}
            />

            <Alert variant="goodToKnow">
              <CheckCircle2 />
              <AlertTitle>
                {isVi ? "Kết quả đạt được" : "Production Outcome"}
              </AlertTitle>
              <AlertDescription>
                <FormattedText text={activePlaybook.outcome[locale]} />
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Transport Comparison + When to use / Pitfall */}
        <Card>
          <CardHeader>
            <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              REAL-TIME TRANSPORT MATRIX
            </div>
            <CardTitle className="text-lg">
              WebSocket vs. SSE vs. Long Polling vs. WebTransport
            </CardTitle>
          </CardHeader>
          <CardContent className="gap-4">
            <div className="overflow-x-auto rounded-xl border border-border bg-background/55">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50 font-mono text-xs text-muted-foreground">
                    <th className="p-3.5 font-semibold">
                      {isVi ? "Tiêu chí" : "Criterion"}
                    </th>
                    <th className="p-3.5 font-bold text-foreground">
                      WebSocket (RFC 6455)
                    </th>
                    <th className="p-3.5 font-semibold">SSE (EventSource)</th>
                    <th className="p-3.5 font-semibold">Long Polling</th>
                    <th className="p-3.5 font-semibold">WebTransport</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {REALTIME_TRANSPORT_COMPARISON.map((row, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-3.5 align-top font-mono text-xs font-bold text-foreground">
                        {row.feature[locale]}
                      </td>
                      <td className="p-3.5 align-top leading-relaxed text-foreground">
                        <FormattedText text={row.websocket[locale]} />
                      </td>
                      <td className="p-3.5 align-top leading-relaxed text-muted-foreground">
                        <FormattedText text={row.sse[locale]} />
                      </td>
                      <td className="p-3.5 align-top leading-relaxed text-muted-foreground">
                        <FormattedText text={row.longPolling[locale]} />
                      </td>
                      <td className="p-3.5 align-top leading-relaxed text-muted-foreground">
                        <FormattedText text={row.webTransport[locale]} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Alert variant="goodToKnow">
                <Check />
                <AlertTitle>
                  {isVi ? "Khi nào chọn WebSocket" : "When to choose WebSocket"}
                </AlertTitle>
                <AlertDescription>
                  {isVi
                    ? "Khi cần truyền nhận **2 chiều (Bi-directional)** độ trễ mili-giây hoặc gửi khung dữ liệu nhị phân (`ArrayBuffer` / Protobuf) liên tục (Chat, Sàn giao dịch, Multiplayer)."
                    : "When you need low-latency **bi-directional** messaging or raw binary framing (`ArrayBuffer` / Protobuf) in both directions."}
                </AlertDescription>
              </Alert>

              <Alert variant="pitfall">
                <ShieldAlert />
                <AlertTitle>
                  {isVi
                    ? "Bẫy phổ biến: Luồng 1 chiều nên ưu tiên SSE"
                    : "Common Pitfall: Prefer SSE for Server-to-Client Only"}
                </AlertTitle>
                <AlertDescription>
                  {isVi
                    ? "Với AI LLM Streaming, thông báo đẩy hoặc bảng tin 1 chiều từ Server → Client, **SSE trên HTTP/2** đơn giản hơn, tự động gộp kênh và hỗ trợ sẵn `Last-Event-ID`."
                    : "For one-way Server → Client streams (AI token streaming, notifications), **SSE over HTTP/2** multiplexes natively and includes built-in `Last-Event-ID` recovery."}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>

        {/* Close Event Reference */}
        <Card>
          <CardHeader>
            <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <HelpCircle className="mr-1.5 inline size-3.5" />
              CLOSE EVENT REFERENCE
            </div>
            <CardTitle className="text-lg">
              {isVi
                ? "Bảng mã đóng kết nối (`CloseEvent.code`) & Hành động chuẩn"
                : "CloseEvent Code Reference & Reconnection Policy"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-xl border border-border bg-background/55">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50 font-mono text-xs text-muted-foreground">
                    <th className="p-3.5 font-semibold">Code</th>
                    <th className="p-3.5 font-semibold">Name</th>
                    <th className="p-3.5 font-semibold">
                      {isVi ? "Ý nghĩa" : "Meaning"}
                    </th>
                    <th className="p-3.5 font-semibold">
                      {isVi ? "Chiến lược xử lý" : "Client Action"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {CLOSE_CODE_REFERENCE.map((item) => (
                    <tr key={item.code} className="hover:bg-muted/30">
                      <td className="p-3.5 align-top font-mono font-bold whitespace-nowrap text-foreground">
                        <Badge variant="amber">{item.code}</Badge>
                      </td>
                      <td className="p-3.5 align-top font-mono text-xs font-semibold whitespace-nowrap text-foreground">
                        {item.name}
                      </td>
                      <td className="p-3.5 align-top leading-relaxed text-muted-foreground">
                        {item.meaning[locale]}
                      </td>
                      <td className="p-3.5 align-top leading-relaxed text-foreground">
                        {item.action[locale]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Footer Lesson Navigation */}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <Button
            variant="outline"
            render={<Link href="/foundations/event-loop" />}
            nativeButton={false}
          >
            <ArrowLeft data-icon="inline-start" />
            <span>F1 — Event Loop & Pixel Pipeline</span>
          </Button>
          <Button
            variant="default"
            render={<Link href="/labs/rerender-storms" />}
            nativeButton={false}
          >
            <span>02.1 — Re-render Storms & Context Bloat</span>
            <ArrowRight data-icon="inline-end" />
          </Button>
        </footer>
      </div>
    </div>
  )
}
