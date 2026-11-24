"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Cpu,
  Folder,
  SearchCheck,
  Zap,
} from "lucide-react"
import { ALL_LABS } from "@/lib/labs/catalog"
import type { MetricCategory } from "@/lib/labs/types"
import {
  getCourseChapters,
  getTotalCourseLessonsCount,
} from "@/lib/course-tree"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const METRIC_FILTERS: ("ALL" | "SAVED" | MetricCategory)[] = [
  "ALL",
  "SAVED",
  "Re-renders",
  "INP",
  "FPS",
  "TBT",
  "Memory",
  "LCP / TTFB",
  "CLS",
  "Network",
  "Bundle",
]

export function DiagnosticDashboard({
  initialFilter = "ALL",
}: {
  initialFilter?: "ALL" | "SAVED" | MetricCategory
}) {
  const locale = useLocale() as Locale
  const isVi = locale === "vi"
  const tApp = useTranslations("app")
  const tDash = useTranslations("dashboard")

  const viewedLabs = useTelemetryStore((s) => s.viewedLabs)
  const savedLabs = useTelemetryStore((s) => s.savedLabs)
  const snapshots = useTelemetryStore((s) => s.snapshots)
  const lastLessonHref = useTelemetryStore((s) => s.lastLessonHref)

  const [selectedMetric, setSelectedMetric] = useState<
    "ALL" | "SAVED" | MetricCategory
  >(initialFilter)

  const chapters = useMemo(() => getCourseChapters(locale), [locale])
  const totalCourseLessons = getTotalCourseLessonsCount()

  const allLessonIds = useMemo(
    () => chapters.flatMap((c) => c.lessons.map((l) => l.id)),
    [chapters]
  )

  const completedCourseCount = useMemo(
    () => viewedLabs.filter((id) => allLessonIds.includes(id)).length,
    [viewedLabs, allLessonIds]
  )

  const progressPct = Math.min(
    100,
    Math.round((completedCourseCount / Math.max(1, totalCourseLessons)) * 100)
  )

  const benchmarkedCount = useMemo(() => {
    return ALL_LABS.filter((lab) => {
      const s = snapshots[lab.slug]
      return Boolean(s?.bad && s?.good)
    }).length
  }, [snapshots])

  const matrixLabs = useMemo(() => {
    if (selectedMetric === "ALL") return ALL_LABS
    if (selectedMetric === "SAVED") {
      return ALL_LABS.filter((l) => savedLabs.includes(l.slug))
    }
    return ALL_LABS.filter((l) => l.primaryMetric === selectedMetric)
  }, [selectedMetric, savedLabs])

  return (
    <div className="mx-auto max-w-[1460px] p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6">
        {/* 1. WORKBOOK HERO CARD */}
        <Card className="bg-stage-grid gap-5 p-6 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="mint">{tApp("badge")}</Badge>
              <Badge variant="amber">7 Chapters · 20 Lessons</Badge>
              <Badge variant="sky">16.67ms Frame Budget</Badge>
            </div>

            <Button
              variant="default"
              render={
                <Link href={lastLessonHref || "/foundations/event-loop"} />
              }
              nativeButton={false}
            >
              <BookOpen data-icon="inline-start" />
              <span>
                {completedCourseCount > 0
                  ? isVi
                    ? "Tiếp tục bài học"
                    : "Resume learning"
                  : isVi
                    ? "Bắt đầu bài 01. Foundations"
                    : "Start 01. Foundations"}
              </span>
              <ArrowRight data-icon="inline-end" />
            </Button>
          </div>

          <div className="max-w-3xl">
            <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-[34px] sm:leading-[1.15]">
              {initialFilter === "SAVED"
                ? isVi
                  ? "Danh Mục Pattern Đã Lưu"
                  : "Saved Performance Patterns"
                : isVi
                  ? "Sổ Tay Thực Nghiệm Hiệu Năng Frontend"
                  : "Frontend Performance Engineering Workbook"}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
              {tDash("heroDesc")}
            </p>
          </div>

          {/* 4 Crisp Workbook Stat Cards */}
          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="font-mono text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                COURSE PROGRESS
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-foreground tabular-nums">
                {completedCourseCount} / {totalCourseLessons}
              </div>
              <Progress value={progressPct} className="mt-2" />
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="font-mono text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                SAVED PATTERNS
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-foreground tabular-nums">
                {savedLabs.length}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                {isVi ? "Đánh dấu xem lại" : "Bookmarked labs"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3.5">
              <div className="font-mono text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                BENCHMARKED
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-foreground tabular-nums">
                {benchmarkedCount} / {ALL_LABS.length}
              </div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                Baseline vs Optimized
              </div>
            </div>

            <div className="rounded-xl border-[1.5px] border-[var(--ink)] bg-primary/45 p-3.5 shadow-[var(--shadow-ink-sm)]">
              <div className="font-mono text-[10.5px] font-bold tracking-wider text-foreground uppercase">
                TARGET FRAME
              </div>
              <div className="mt-1 font-mono text-xl font-bold text-foreground tabular-nums">
                16.67 ms
              </div>
              <div className="mt-1 font-mono text-[11px] text-foreground/80">
                60 FPS · INP &lt; 200ms
              </div>
            </div>
          </div>
        </Card>

        {/* 2. ALL 7 COURSE CHAPTERS BENTO GRID */}
        {initialFilter !== "SAVED" && (
          <section className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <h2 className="font-mono text-lg font-bold tracking-tight text-foreground">
                {isVi
                  ? "Lộ Trình 7 Chương (01 → 07)"
                  : "Curriculum Chapters (01 → 07)"}
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                20 {isVi ? "bài học tương tác" : "interactive lessons"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {chapters.map((chapter) => {
                const doneCount = chapter.lessons.filter((l) =>
                  viewedLabs.includes(l.id)
                ).length

                return (
                  <Card key={chapter.id} className="justify-between gap-4">
                    <CardHeader className="gap-2 pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant={chapter.badgeVariant}>
                          <Folder className="size-3" />
                          <span>Chapter {chapter.number}</span>
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground tabular-nums">
                          {doneCount}/{chapter.lessons.length}
                        </span>
                      </div>
                      <CardTitle className="text-[17px]">
                        {chapter.number}. {chapter.title}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="gap-1.5">
                      {chapter.lessons.map((lesson) => {
                        const isViewed = viewedLabs.includes(lesson.id)
                        const isSaved = savedLabs.includes(lesson.id)
                        return (
                          <Link
                            key={lesson.id}
                            href={lesson.href}
                            className="group flex items-center justify-between gap-2 rounded-lg border border-border bg-background/65 px-3 py-2 font-mono text-xs transition-all hover:border-[var(--ink)] hover:bg-card"
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              <span className="shrink-0 font-bold text-muted-foreground">
                                {lesson.code}
                              </span>
                              <span className="truncate font-semibold text-foreground">
                                {lesson.title}
                              </span>
                            </div>

                            <div className="flex shrink-0 items-center gap-1.5">
                              {isSaved && (
                                <Bookmark className="size-3 fill-foreground text-foreground" />
                              )}
                              {isViewed ? (
                                <CheckCircle2 className="size-3.5 text-foreground" />
                              ) : (
                                <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* 3. SYMPTOM-TO-SOLUTION DIAGNOSTIC MATRIX */}
        <Card>
          <CardHeader>
            <div className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
              <SearchCheck className="mr-1.5 inline size-3.5" />
              {isVi ? "MA TRẬN CHẨN ĐOÁN" : "DIAGNOSTIC MATRIX"}
            </div>
            <CardTitle className="text-lg">{tDash("matrixTitle")}</CardTitle>
            <CardDescription>{tDash("matrixSubtitle")}</CardDescription>
          </CardHeader>

          <CardContent className="gap-4">
            <div className="flex flex-wrap gap-1.5">
              {METRIC_FILTERS.map((m) => {
                const isSelected = selectedMetric === m
                return (
                  <Button
                    key={m}
                    variant={isSelected ? "default" : "secondary"}
                    size="xs"
                    onClick={() => setSelectedMetric(m)}
                  >
                    {m === "ALL" ? (
                      <span>{tDash("filterAll")}</span>
                    ) : m === "SAVED" ? (
                      <>
                        <Bookmark data-icon="inline-start" />
                        <span>
                          {isVi
                            ? `Đã lưu (${savedLabs.length})`
                            : `Saved (${savedLabs.length})`}
                        </span>
                      </>
                    ) : (
                      <span>{m}</span>
                    )}
                  </Button>
                )
              })}
            </div>

            {matrixLabs.length === 0 ? (
              <Alert variant="goodToKnow">
                <Cpu />
                <AlertTitle>
                  {isVi ? "Chưa có bài học được lưu" : "No saved patterns yet"}
                </AlertTitle>
                <AlertDescription>
                  {isVi
                    ? "Mở bất kỳ bài Lab nào trong menu bên trái và bấm nút 'Lưu' ở góc trên phải để ghim vào đây."
                    : "Open any Lab from the course tree on the left and click 'Save' in the top-right header to bookmark it here."}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-border bg-background/55">
                <table className="w-full text-left text-[13.5px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/50 font-mono text-xs text-muted-foreground">
                      <th className="p-3.5 font-semibold">
                        {tDash("symptomCol")}
                      </th>
                      <th className="p-3.5 font-semibold">
                        {tDash("metricCol")}
                      </th>
                      <th className="p-3.5 font-semibold">
                        {tDash("rootCauseCol")}
                      </th>
                      <th className="p-3.5 text-right font-semibold">
                        {tDash("actionCol")}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {matrixLabs.map((lab) => {
                      const c = lab.content[locale]
                      return (
                        <tr key={lab.slug} className="hover:bg-muted/30">
                          <td className="max-w-xs p-3.5 align-top leading-relaxed font-medium text-foreground">
                            {c.symptomSummary}
                          </td>
                          <td className="p-3.5 align-top whitespace-nowrap">
                            <Badge variant="mint">
                              <Zap />
                              <span>{lab.primaryMetric}</span>
                            </Badge>
                          </td>
                          <td className="max-w-md p-3.5 align-top leading-relaxed text-muted-foreground">
                            <div>{c.rootCauseSummary}</div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {lab.libraries.map((lib) => (
                                <span
                                  key={lib}
                                  className="rounded border border-[var(--garden-code-pill-border)] bg-[var(--garden-code-pill-bg)] px-2 py-0.5 font-mono text-[11px] text-foreground"
                                >
                                  {lib}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 text-right align-top whitespace-nowrap">
                            <Button
                              variant="outline"
                              size="sm"
                              render={<Link href={`/labs/${lab.slug}`} />}
                              nativeButton={false}
                            >
                              <span>
                                {lab.code} · {c.title}
                              </span>
                              <ArrowUpRight data-icon="inline-end" />
                            </Button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>

          <CardFooter className="justify-between border-t border-border font-mono text-xs text-muted-foreground">
            <span>PerfLab Workbook · Warm Paper & Ink System</span>
            <span>2 Foundations · 6 Pillars · 18 Live Labs</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
