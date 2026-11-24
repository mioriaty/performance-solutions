"use client"

import React from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Check, Lightbulb } from "lucide-react"
import { useTelemetryStore } from "@/lib/telemetry/store"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge, type badgeVariants } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Kbd } from "@/components/ui/kbd"
import { FormattedText } from "@/components/ui/formatted-text"
import type { VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

export interface StageMetricItem {
  label: string
  value: string
  icon?: React.ReactNode
  tone?: "default" | "good" | "warn" | "danger"
  highlight?: boolean
}

export function WorkbookMetricStrip({
  metrics,
  actions,
}: {
  metrics: StageMetricItem[]
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-stretch justify-between gap-3">
      <div className="flex flex-wrap items-stretch gap-2">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className={cn(
              "flex min-w-[104px] flex-col justify-between rounded-xl border px-3 py-2 transition-colors",
              m.highlight
                ? "border-[1.5px] border-[var(--ink)] bg-background shadow-[var(--shadow-ink-sm)]"
                : "border-border bg-background/70"
            )}
          >
            <div className="flex items-center gap-1.5 font-mono text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              {m.icon && (
                <span className="shrink-0 opacity-80" aria-hidden="true">
                  {m.icon}
                </span>
              )}
              <span className="truncate">{m.label}</span>
            </div>
            <div
              className={cn(
                "mt-1 font-mono text-[15px] leading-tight font-bold tabular-nums",
                m.tone === "danger"
                  ? "text-destructive"
                  : m.tone === "warn"
                    ? "text-[var(--garden-pitfall-text)]"
                    : m.tone === "good"
                      ? "text-foreground"
                      : "text-foreground"
              )}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 self-center">
          {actions}
        </div>
      )}
    </div>
  )
}

export interface StepperNodeItem {
  label: string
}

export function WorkbookHorizontalStepper({
  heading = "IN THIS LESSON",
  steps,
  currentStepIdx,
  onSelectStep,
  stepCountLabel,
}: {
  heading?: string
  steps: StepperNodeItem[]
  currentStepIdx: number
  onSelectStep: (idx: number) => void
  stepCountLabel?: string
}) {
  return (
    <div className="rounded-xl border border-border bg-background/60 px-4 py-3.5 sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="font-mono text-[11px] font-bold tracking-wider text-foreground uppercase">
          {heading}
        </span>
        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
          {stepCountLabel ?? `Step ${currentStepIdx + 1} of ${steps.length}`}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <ol className="relative flex min-w-max items-start justify-between gap-2 sm:min-w-0">
          {steps.map((step, idx) => {
            const isCurrent = idx === currentStepIdx
            const isPast = idx < currentStepIdx
            const isLast = idx === steps.length - 1

            return (
              <li
                key={idx}
                className="relative flex min-w-[78px] flex-1 flex-col items-center text-center"
              >
                {/* Connecting horizontal line to next step */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute top-3.5 left-1/2 h-[2px] w-full",
                      isPast ? "bg-[var(--ink)]" : "bg-border"
                    )}
                  />
                )}

                <button
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    "relative z-10 flex size-7 cursor-pointer items-center justify-center rounded-full font-mono text-[11.5px] font-bold transition-all",
                    isCurrent
                      ? "border-[1.5px] border-[var(--ink)] bg-primary text-primary-foreground shadow-[var(--shadow-ink-sm)]"
                      : isPast
                        ? "border-[1.5px] border-[var(--ink)] bg-card text-foreground"
                        : "border border-border bg-card text-muted-foreground hover:border-[var(--ink)] hover:text-foreground"
                  )}
                >
                  {isPast ? <Check className="size-3.5" /> : idx + 1}
                </button>

                <button
                  type="button"
                  onClick={() => onSelectStep(idx)}
                  className={cn(
                    "mt-2 max-w-[115px] cursor-pointer truncate px-1 font-mono text-[11px] leading-snug transition-colors",
                    isCurrent
                      ? "font-bold text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={step.label}
                >
                  {step.label}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

export function WorkbookRightInspector({
  lessonId,
  stepIndex,
  totalSteps,
  badgeLabel = "TECHNIQUE",
  badgeVariant = "sky",
  stepTitle,
  stepBody,
  goodToKnowTitle = "GOOD TO KNOW",
  goodToKnowText,
  whatChangedTitle = "WHAT CHANGED",
  whatChangedItems,
  onPrevStep,
  onNextStep,
  nextStepLabel,
  nextLessonHref,
  nextLessonTitle,
  backLabel = "Back",
  shortcutHints,
  youWillLearnTitle = "YOU'LL LEARN",
  youWillLearnItems,
}: {
  lessonId: string
  stepIndex: number
  totalSteps: number
  badgeLabel?: string
  badgeVariant?: VariantProps<typeof badgeVariants>["variant"]
  stepTitle: string
  stepBody: string
  goodToKnowTitle?: string
  goodToKnowText: string
  whatChangedTitle?: string
  whatChangedItems?: string[]
  onPrevStep: () => void
  onNextStep: () => void
  nextStepLabel: string
  nextLessonHref?: string
  nextLessonTitle?: string
  backLabel?: string
  shortcutHints?: { keys: string[]; label: string }[]
  youWillLearnTitle?: string
  youWillLearnItems: string[]
}) {
  const learnedMap = useTelemetryStore((s) => s.learnedItems)
  const toggleLearnedItem = useTelemetryStore((s) => s.toggleLearnedItem)
  const checkedIndices = learnedMap[lessonId] ?? []
  const isAtFinalStep = stepIndex >= totalSteps - 1

  return (
    <aside className="flex flex-col gap-3.5">
      {/* Top Card: Step Detail + GOOD TO KNOW + WHAT CHANGED + Back/Next */}
      <Card className="flex flex-col justify-between gap-4">
        <CardHeader className="gap-2.5 pb-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-semibold tracking-wider text-muted-foreground uppercase tabular-nums">
              STEP {stepIndex + 1} / {totalSteps}
            </span>
            <Badge variant={badgeVariant}>{badgeLabel}</Badge>
          </div>
          <h2 className="font-mono text-[17px] leading-snug font-bold text-foreground">
            {stepTitle}
          </h2>
        </CardHeader>

        <CardContent className="gap-4">
          <div className="text-[13.5px] leading-relaxed text-muted-foreground">
            <FormattedText text={stepBody} />
          </div>

          {/* Green GOOD TO KNOW Callout matching Reference Image */}
          <Alert variant="goodToKnow">
            <Lightbulb />
            <AlertTitle>{goodToKnowTitle}</AlertTitle>
            <AlertDescription>
              <FormattedText text={goodToKnowText} />
            </AlertDescription>
          </Alert>

          {/* WHAT CHANGED Diff List */}
          {whatChangedItems && whatChangedItems.length > 0 && (
            <div className="flex flex-col gap-1.5 pt-0.5">
              <div className="font-mono text-[10.5px] font-bold tracking-wider text-muted-foreground uppercase">
                {whatChangedTitle}
              </div>
              <ul className="flex flex-col gap-1 font-mono text-[12px] text-foreground">
                {whatChangedItems.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="font-bold text-foreground/75">+</span>
                    <span className="leading-snug">
                      <FormattedText text={item} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Step Navigation Controls + Keyboard Shortcut Legend */}
          <div className="flex flex-col gap-2.5 border-t border-border pt-3.5">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="default"
                disabled={stepIndex === 0}
                onClick={onPrevStep}
              >
                <ArrowLeft data-icon="inline-start" />
                <span>{backLabel}</span>
              </Button>

              {isAtFinalStep && nextLessonHref ? (
                <Button
                  variant="default"
                  size="default"
                  className="min-w-0 flex-1 justify-between"
                  render={<Link href={nextLessonHref} />}
                  nativeButton={false}
                >
                  <span className="truncate">
                    {nextLessonTitle ?? nextStepLabel}
                  </span>
                  <ArrowRight data-icon="inline-end" />
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="default"
                  disabled={isAtFinalStep}
                  onClick={onNextStep}
                  className="min-w-0 flex-1 justify-between"
                >
                  <span className="truncate">{nextStepLabel}</span>
                  <ArrowRight data-icon="inline-end" />
                </Button>
              )}
            </div>

            {shortcutHints && shortcutHints.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 font-mono text-[10.5px] text-muted-foreground">
                {shortcutHints.map((hint, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1">
                    {hint.keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                    <span>{hint.label}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Card: YOU'LL LEARN Interactive Checklist */}
      <Card size="sm" className="gap-3">
        <CardHeader className="pb-0">
          <div className="font-mono text-[11px] font-bold tracking-wider text-foreground uppercase">
            {youWillLearnTitle}
          </div>
        </CardHeader>
        <CardContent className="gap-2.5">
          {youWillLearnItems.map((item, idx) => {
            const isChecked = checkedIndices.includes(idx) || idx < stepIndex
            const checkboxId = `learn-${lessonId}-${idx}`
            return (
              <label
                key={idx}
                htmlFor={checkboxId}
                className="flex cursor-pointer items-start gap-2.5 text-[12.5px] leading-snug"
              >
                <Checkbox
                  id={checkboxId}
                  checked={isChecked}
                  onCheckedChange={() => toggleLearnedItem(lessonId, idx)}
                  className="mt-0.5"
                />
                <span
                  className={cn(
                    "transition-colors",
                    isChecked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  <FormattedText text={item} />
                </span>
              </label>
            )
          })}
        </CardContent>
      </Card>
    </aside>
  )
}
