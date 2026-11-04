"use client"

import React, { useMemo, useState } from "react"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import {
  Activity,
  ArrowRight,
  BookOpen,
  Cpu,
  Database,
  Globe,
  Layers,
  Package,
  SearchCheck,
  Zap,
} from "lucide-react"
import { ALL_LABS, PILLARS } from "@/lib/labs/catalog"
import type { MetricCategory } from "@/lib/labs/types"
import type { Locale } from "@/i18n/request"
import { cn } from "@/lib/utils"

const METRIC_FILTERS: ("ALL" | MetricCategory)[] = [
  "ALL",
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

const PILLAR_ICONS: Record<string, React.ComponentType<{ className?: string }>> =
  {
    Layers,
    Cpu,
    Database,
    Globe,
    Activity,
    Package,
  }

export function DiagnosticDashboard() {
  const locale = useLocale() as Locale
  const tApp = useTranslations("app")
  const tDash = useTranslations("dashboard")

  const [selectedMetric, setSelectedMetric] = useState<"ALL" | MetricCategory>(
    "ALL"
  )

  const matrixLabs = useMemo(() => {
    if (selectedMetric === "ALL") return ALL_LABS
    return ALL_LABS.filter((l) => l.primaryMetric === selectedMetric)
  }, [selectedMetric])

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      {/* Editorial Documentation Hero */}
      <section className="space-y-4 border-b pb-8">
        <div className="inline-flex items-center gap-2 rounded-full border bg-muted/60 px-3 py-1 font-mono text-xs text-primary">
          <BookOpen className="size-3.5" />
          <span>{tApp("badge")}</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {tApp("title")}
        </h1>

        <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-[17px]">
          {tDash("heroDesc")}
        </p>

        <div className="grid grid-cols-2 gap-4 pt-3 sm:grid-cols-4">
          <div className="rounded-xl border bg-card p-4">
            <div className="font-mono text-2xl font-bold text-primary">6</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {tApp("allPillars")}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="font-mono text-2xl font-bold text-primary">18</div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {tApp("labsCount")}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="font-mono text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              100% Live
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Isolated Main-Thread Labs
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="font-mono text-2xl font-bold text-foreground">
              VI / EN
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              Bilingual Engineering Docs
            </div>
          </div>
        </div>
      </section>

      {/* 6 Performance Pillars Documentation Catalog */}
      <section className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {tDash("pillarsTitle")}
        </h2>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PILLARS.map((pillar) => {
            const labs = ALL_LABS.filter((l) => l.pillarId === pillar.id)
            const Icon = PILLAR_ICONS[pillar.iconName] ?? Layers

            return (
              <div
                key={pillar.id}
                className="flex flex-col justify-between rounded-xl border bg-card p-5 shadow-2xs transition-colors hover:border-primary/40"
              >
                <div>
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <h3 className="text-base font-bold text-foreground">
                      {pillar.id}. {pillar.title[locale]}
                    </h3>
                  </div>

                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                    {pillar.description[locale]}
                  </p>

                  <div className="mt-4 space-y-2 border-t pt-3.5">
                    {labs.map((lab) => (
                      <Link
                        key={lab.slug}
                        href={`/labs/${lab.slug}`}
                        className="group flex items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-[13.5px] transition-colors hover:border-primary/40 hover:bg-primary/8 cursor-pointer"
                      >
                        <div className="min-w-0 truncate">
                          <span className="font-mono text-xs font-semibold text-primary">
                            {lab.code}
                          </span>{" "}
                          <span className="font-medium text-foreground">
                            {lab.content[locale].title}
                          </span>
                        </div>
                        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Symptom-to-Solution Diagnostic Reference Matrix */}
      <section className="space-y-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <SearchCheck className="size-5 text-primary" />
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              {tDash("matrixTitle")}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {tDash("matrixSubtitle")}
          </p>
        </div>

        {/* Metric Category Filter Pills */}
        <div className="flex flex-wrap gap-2">
          {METRIC_FILTERS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSelectedMetric(m)}
              className={cn(
                "cursor-pointer rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors",
                selectedMetric === m
                  ? "border-primary bg-primary text-primary-foreground font-semibold"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {m === "ALL" ? tDash("filterAll") : m}
            </button>
          ))}
        </div>

        {/* Reference Table */}
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-muted-foreground">
                <th className="p-4 font-semibold">{tDash("symptomCol")}</th>
                <th className="p-4 font-semibold">{tDash("metricCol")}</th>
                <th className="p-4 font-semibold">{tDash("rootCauseCol")}</th>
                <th className="p-4 text-right font-semibold">
                  {tDash("actionCol")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {matrixLabs.map((lab) => {
                const c = lab.content[locale]
                return (
                  <tr
                    key={lab.slug}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="max-w-xs p-4 align-top leading-6 font-medium text-foreground">
                      {c.symptomSummary}
                    </td>

                    <td className="p-4 align-top whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-xs font-semibold text-primary">
                        <Zap className="size-3" />
                        {lab.primaryMetric}
                      </span>
                    </td>

                    <td className="max-w-md p-4 align-top leading-6 text-muted-foreground">
                      <div>{c.rootCauseSummary}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {lab.libraries.map((lib) => (
                          <span
                            key={lib}
                            className="rounded-md bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground/80"
                          >
                            {lib}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="p-4 align-top text-right whitespace-nowrap">
                      <Link
                        href={`/labs/${lab.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 font-mono text-xs font-semibold text-primary-foreground shadow-2xs transition-opacity hover:opacity-90 cursor-pointer"
                      >
                        <span>
                          {lab.code} • {tDash("openLab")}
                        </span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
