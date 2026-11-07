"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  CheckCircle2,
  Cpu,
  LayoutGrid,
  Leaf,
  SearchCheck,
  Sprout,
  Zap,
} from "lucide-react"
import { ALL_LABS, PILLARS } from "@/lib/labs/catalog"
import type { MetricCategory } from "@/lib/labs/types"
import { useTelemetryStore } from "@/lib/telemetry/store"
import type { Locale } from "@/i18n/request"
import { cn } from "@/lib/utils"

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

const PILLAR_DOT_COLORS: Record<number, string> = {
  1: "bg-[#86efac]",
  2: "bg-[#eab308]",
  3: "bg-[#60a5fa]",
  4: "bg-[#c084fc]",
  5: "bg-[#f472b6]",
  6: "bg-[#fb923c]",
}

export function DiagnosticDashboard() {
  const locale = useLocale() as Locale
  const isVi = locale === "vi"
  const tApp = useTranslations("app")
  const tDash = useTranslations("dashboard")

  const viewedLabs = useTelemetryStore((s) => s.viewedLabs)
  const savedLabs = useTelemetryStore((s) => s.savedLabs)
  const snapshots = useTelemetryStore((s) => s.snapshots)

  const [selectedMetric, setSelectedMetric] = useState<
    "ALL" | "SAVED" | MetricCategory
  >("ALL")

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
    <div className="mx-auto max-w-[1350px] space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* 1. PATTERN GARDEN CATALOG HEADER */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-primary/30 bg-primary/12 px-2.5 py-0.5 text-[12px] font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{tApp("badge")}</span>
          </span>
          <span className="font-mono text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            6 PILLARS · {ALL_LABS.length} PATTERNS
          </span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-[38px] sm:leading-[1.15]">
          <span>
            {isVi
              ? "Thư Viện Mẫu Tối Ưu Hiệu Năng"
              : "Performance Pattern Garden"}
          </span>{" "}
          <span className="font-light text-primary select-none">*</span>
        </h1>

        <p className="max-w-3xl text-[15.5px] leading-relaxed text-muted-foreground">
          {tDash("heroDesc")}
        </p>
      </header>

      {/* 2. TOP BENTO ROW: OVERVIEW & PROGRESS (65%) + FOUNDATIONS KEY POINT (35%) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left Card: Interactive Progress & Stats */}
        <section className="flex flex-col justify-between space-y-5 rounded-2xl border border-border bg-card p-6 lg:col-span-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <LayoutGrid className="size-3.5 text-primary" />
              <span>
                {isVi ? "TỔNG QUAN HỆ THỐNG" : "INTERACTIVE WORKBENCH"}
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {isVi
                ? "Tái hiện điểm nghẽn, đo đạc Telemetry và kiểm chứng mã nguồn"
                : "Reproduce bottlenecks, inspect telemetry, and verify fixes step by step"}
            </h2>
            <p className="text-[14px] leading-relaxed text-muted-foreground">
              {isVi
                ? "Mỗi bài học cô lập hoàn toàn Main Thread để bạn trực tiếp so sánh phiên bản Chưa tối ưu (Baseline) và Đã tối ưu (Optimized) qua FPS, TBT, INP và Memory Heap."
                : "Every pattern mounts in an isolated sandbox so you can compare Baseline vs. Optimized behavior across live FPS, TBT, INP, and Heap Memory metrics."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <div className="font-mono text-xl font-bold text-primary">
                {viewedLabs.length} / {ALL_LABS.length}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {isVi ? "Pattern đã xem" : "Patterns viewed"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <div className="font-mono text-xl font-bold text-primary">
                {savedLabs.length}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {isVi ? "Pattern đã lưu" : "Saved patterns"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <div className="font-mono text-xl font-bold text-foreground">
                {benchmarkedCount} / {ALL_LABS.length}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {isVi ? "Đã chạy Benchmark" : "Benchmarked"}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background/60 p-3.5">
              <div className="font-mono text-xl font-bold text-foreground">
                16.67ms
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {isVi ? "Ngân sách 60Hz Frame" : "60Hz Frame budget"}
              </div>
            </div>
          </div>
        </section>

        {/* Right Card: Olive KEY POINT — Event Loop & Pixel Pipeline Foundations */}
        <section className="flex flex-col justify-between rounded-2xl border border-[var(--garden-keypoint-border)] bg-[var(--garden-keypoint-bg)] p-6 lg:col-span-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              <Cpu className="size-3.5 text-primary" />
              <span>
                {isVi ? "KIẾN THỨC NỀN TẢNG" : "FOUNDATIONS APPENDIX"}
              </span>
            </div>

            <div className="font-serif text-4xl leading-none text-primary/70 select-none">
              “
            </div>

            <h3 className="text-[17px] leading-snug font-bold text-foreground">
              {isVi
                ? "Hiểu rõ JS Event Loop, Microtasks và 5 bước Pixel Pipeline trước khi tối ưu."
                : "Master the JS Event Loop, Microtasks, and the 5-stage Pixel Pipeline."}
            </h3>
          </div>

          <div className="mt-6 pt-2">
            <Link
              href="/foundations"
              className="inline-flex w-full cursor-pointer items-center justify-between rounded-xl border border-primary/40 bg-primary/18 px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-primary/28"
            >
              <span>
                {isVi ? "Mở Mô phỏng Event Loop" : "Open Event Loop Simulator"}
              </span>
              <ArrowRight className="size-4 text-primary" />
            </Link>
          </div>
        </section>
      </div>

      {/* 3. THE 6 PILLARS BENTO CATALOG */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {tDash("pillarsTitle")}
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {ALL_LABS.length} patterns
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => {
            const labs = ALL_LABS.filter((l) => l.pillarId === pillar.id)
            const dotColor = PILLAR_DOT_COLORS[pillar.id] ?? "bg-primary"

            return (
              <div
                key={pillar.id}
                className="flex flex-col justify-between space-y-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("size-2 rounded-full", dotColor)} />
                      <span className="font-mono text-[11px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
                        PILLAR 0{pillar.id}
                      </span>
                    </div>
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {labs.length}
                    </span>
                  </div>

                  <h3 className="text-[17px] font-bold text-foreground">
                    {pillar.title[locale]}
                  </h3>

                  <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                    {pillar.description[locale]}
                  </p>
                </div>

                <div className="space-y-1.5 border-t border-border pt-3.5">
                  {labs.map((lab) => {
                    const isSaved = savedLabs.includes(lab.slug)
                    const snap = snapshots[lab.slug]
                    const hasBothSnapshots = Boolean(snap?.bad && snap?.good)

                    return (
                      <Link
                        key={lab.slug}
                        href={`/labs/${lab.slug}`}
                        className="group flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-border/80 bg-background/60 px-3 py-2 text-[13px] transition-colors hover:border-primary/45 hover:bg-accent/50"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 font-mono text-[11px] font-semibold text-primary">
                            {lab.code}
                          </span>
                          <span className="truncate font-medium text-foreground">
                            {lab.content[locale].title}
                          </span>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {isSaved && (
                            <Bookmark className="size-3 fill-primary text-primary" />
                          )}
                          {hasBothSnapshots ? (
                            <CheckCircle2 className="size-3.5 text-primary" />
                          ) : (
                            <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. SYMPTOM-TO-PATTERN DIAGNOSTIC MATRIX */}
      <section className="space-y-5 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            <SearchCheck className="size-3.5 text-primary" />
            <span>{isVi ? "MA TRẬN CHẨN ĐOÁN" : "DIAGNOSTIC MATRIX"}</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {tDash("matrixTitle")}
          </h2>
          <p className="text-[13.5px] text-muted-foreground">
            {tDash("matrixSubtitle")}
          </p>
        </div>

        {/* Metric & Saved Filter Pills */}
        <div className="flex flex-wrap gap-1.5">
          {METRIC_FILTERS.map((m) => {
            const isSelected = selectedMetric === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMetric(m)}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors",
                  isSelected
                    ? "border-primary/50 bg-primary/15 font-semibold text-foreground"
                    : "border-border bg-background/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {isSelected && (
                  <span className="size-1.5 rounded-full bg-primary" />
                )}
                {m === "ALL" ? (
                  tDash("filterAll")
                ) : m === "SAVED" ? (
                  <span className="inline-flex items-center gap-1">
                    <Bookmark className="size-3 text-primary" />
                    <span>
                      {isVi
                        ? `Đã lưu (${savedLabs.length})`
                        : `Saved (${savedLabs.length})`}
                    </span>
                  </span>
                ) : (
                  m
                )}
              </button>
            )
          })}
        </div>

        {/* Matrix Table */}
        {matrixLabs.length === 0 ? (
          <div className="rounded-xl border border-border bg-background/50 p-6 text-center text-sm text-muted-foreground">
            {isVi
              ? "Chưa có pattern nào được lưu. Hãy bấm nút 'Lưu pattern này' ở đầu mỗi bài Lab!"
              : "No saved patterns yet. Click 'Save this pattern' at the top of any lab!"}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-background/50">
            <table className="w-full text-left text-[13.5px]">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-[12px] text-muted-foreground">
                  <th className="p-3.5 font-semibold">{tDash("symptomCol")}</th>
                  <th className="p-3.5 font-semibold">{tDash("metricCol")}</th>
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
                    <tr
                      key={lab.slug}
                      className="transition-colors hover:bg-muted/25"
                    >
                      <td className="max-w-xs p-3.5 align-top leading-relaxed font-medium text-foreground">
                        {c.symptomSummary}
                      </td>

                      <td className="p-3.5 align-top whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-primary">
                          <Zap className="size-3" />
                          {lab.primaryMetric}
                        </span>
                      </td>

                      <td className="max-w-md p-3.5 align-top leading-relaxed text-muted-foreground">
                        <div>{c.rootCauseSummary}</div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {lab.libraries.map((lib) => (
                            <span
                              key={lib}
                              className="rounded-md border border-[var(--garden-code-pill-border)] bg-[var(--garden-code-pill-bg)] px-2 py-0.5 font-mono text-[11px] text-foreground/85"
                            >
                              {lib}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5 text-right align-top whitespace-nowrap">
                        <Link
                          href={`/labs/${lab.slug}`}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-3 py-1.5 font-mono text-xs font-semibold text-foreground transition-colors hover:bg-primary/25"
                        >
                          <span>
                            {lab.code} · {c.title}
                          </span>
                          <ArrowUpRight className="size-3.5 text-primary" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Footer Signature */}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-4 text-[12px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Sprout className="size-3.5 text-primary" />
          <span>
            Perf Lab ·{" "}
            {isVi
              ? "Tối ưu hiệu năng Frontend qua ví dụ thực tế."
              : "Frontend performance through interactive examples."}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Leaf className="size-3.5 text-primary" />
          <span>
            {ALL_LABS.length} patterns ·{" "}
            {isVi ? "Không cần tài khoản." : "No account needed."}
          </span>
        </div>
      </footer>
    </div>
  )
}
