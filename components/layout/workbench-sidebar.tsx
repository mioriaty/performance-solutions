"use client"

import React, { useEffect, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useLocale } from "next-intl"
import {
  Bookmark,
  CheckCircle2,
  ChevronRight,
  FileText,
  Folder,
} from "lucide-react"
import { useTelemetryStore } from "@/lib/telemetry/store"
import {
  getCourseChapters,
  getTotalCourseLessonsCount,
} from "@/lib/course-tree"
import type { Locale } from "@/i18n/request"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

/**
 * Pastel Ink-Bordered Folder Icon matching the System Design reference sidebar
 */
function ChapterFolderIcon({ colorVar }: { colorVar: string }) {
  return (
    <svg
      viewBox="0 0 20 16"
      className="size-4 shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1.5 3.2C1.5 2.26 2.26 1.5 3.2 1.5H7.3C7.77 1.5 8.21 1.72 8.5 2.09L9.65 3.55H16.8C17.74 3.55 18.5 4.31 18.5 5.25V12.8C18.5 13.74 17.74 14.5 16.8 14.5H3.2C2.26 14.5 1.5 13.74 1.5 12.8V3.2Z"
        fill={colorVar}
        stroke="var(--ink)"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WorkbenchSidebar() {
  const pathname = usePathname()
  const locale = useLocale() as Locale
  const isVi = locale === "vi"

  const viewedLabs = useTelemetryStore((s) => s.viewedLabs)
  const savedLabs = useTelemetryStore((s) => s.savedLabs)
  const snapshots = useTelemetryStore((s) => s.snapshots)
  const openChapters = useTelemetryStore((s) => s.openChapters)
  const setOpenChapters = useTelemetryStore((s) => s.setOpenChapters)
  const sidebarCollapsed = useTelemetryStore((s) => s.sidebarCollapsed)
  const mobileSidebarOpen = useTelemetryStore((s) => s.mobileSidebarOpen)
  const setMobileSidebarOpen = useTelemetryStore((s) => s.setMobileSidebarOpen)
  const hydrateGardenState = useTelemetryStore((s) => s.hydrateGardenState)

  const chapters = useMemo(() => getCourseChapters(locale), [locale])
  const totalCount = getTotalCourseLessonsCount()

  useEffect(() => {
    hydrateGardenState()
  }, [hydrateGardenState])

  // Auto-expand the chapter containing the active route
  const activeChapterId = useMemo(() => {
    const found = chapters.find((ch) =>
      ch.lessons.some((l) => l.href === pathname)
    )
    return found?.id
  }, [chapters, pathname])

  useEffect(() => {
    if (!activeChapterId) return
    const current = useTelemetryStore.getState().openChapters
    if (!current.includes(activeChapterId)) {
      setOpenChapters([...current, activeChapterId])
    }
  }, [activeChapterId, setOpenChapters])

  const allLessonIds = useMemo(
    () => chapters.flatMap((c) => c.lessons.map((l) => l.id)),
    [chapters]
  )

  const viewedCount = useMemo(
    () => viewedLabs.filter((id) => allLessonIds.includes(id)).length,
    [viewedLabs, allLessonIds]
  )

  const progressPct = Math.min(
    100,
    Math.round((viewedCount / Math.max(1, totalCount)) * 100)
  )

  const courseTreeContent = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground select-none">
      {/* Course Header Row: 📁 Course   20 lessons */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2.5">
        <div className="flex items-center gap-2 font-mono text-[13px] font-bold text-foreground">
          <Folder className="size-4 fill-foreground text-foreground" />
          <span>{isVi ? "Khóa học" : "Course"}</span>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {totalCount} {isVi ? "bài học" : "lessons"}
        </span>
      </div>

      {/* Collapsible Chapter Tree (shadcn Accordion) */}
      <ScrollArea className="min-h-0 flex-1 px-2.5">
        <Accordion
          multiple
          value={openChapters}
          onValueChange={(nextValue) => setOpenChapters(nextValue as string[])}
          className="flex flex-col gap-0.5 pb-4"
        >
          {chapters.map((chapter) => {
            const completedInChapter = chapter.lessons.filter((l) =>
              viewedLabs.includes(l.id)
            ).length

            return (
              <AccordionItem
                key={chapter.id}
                value={chapter.id}
                className="border-none"
              >
                <AccordionTrigger
                  hideIndicator
                  className="rounded-lg px-2 py-2 font-mono text-[12.5px] font-semibold text-foreground hover:bg-sidebar-accent/70 hover:no-underline"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <ChevronRight
                      className="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150 group-aria-expanded/accordion-trigger:rotate-90"
                      aria-hidden="true"
                    />
                    <ChapterFolderIcon colorVar={chapter.folderColorVar} />
                    <span className="truncate">
                      {chapter.number}. {chapter.title}
                    </span>
                  </div>
                  <span className="ml-2 shrink-0 font-mono text-[11px] font-normal text-muted-foreground tabular-nums">
                    {completedInChapter}/{chapter.lessons.length}
                  </span>
                </AccordionTrigger>

                <AccordionContent className="pt-0.5 pb-1.5">
                  <ul className="ml-[22px] flex flex-col">
                    {chapter.lessons.map((lesson, idx) => {
                      const isLast = idx === chapter.lessons.length - 1
                      const isActive = pathname === lesson.href
                      const isViewed = viewedLabs.includes(lesson.id)
                      const isSaved = savedLabs.includes(lesson.id)
                      const snap = snapshots[lesson.id]
                      const isBenchmarked = Boolean(snap?.bad && snap?.good)

                      return (
                        <li
                          key={lesson.id}
                          className="relative flex items-center py-0.5 pl-4"
                        >
                          {/* Tree vertical trunk */}
                          <span
                            aria-hidden="true"
                            className={cn(
                              "pointer-events-none absolute left-0 w-px bg-border",
                              isLast ? "top-0 h-1/2" : "inset-y-0"
                            )}
                          />
                          {/* Tree horizontal elbow */}
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute top-1/2 left-0 h-px w-3 bg-border"
                          />

                          <Link
                            href={lesson.href}
                            onClick={() => setMobileSidebarOpen(false)}
                            aria-current={isActive ? "page" : undefined}
                            className={cn(
                              "group flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 font-mono text-[12px] leading-snug transition-all",
                              isActive
                                ? "border-[1.5px] border-[var(--ink)] bg-primary font-bold text-primary-foreground shadow-[var(--shadow-ink-sm)]"
                                : "border-transparent text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
                            )}
                          >
                            <div className="flex min-w-0 items-center gap-2">
                              {isBenchmarked || (isViewed && !isActive) ? (
                                <CheckCircle2
                                  className={cn(
                                    "size-3.5 shrink-0",
                                    isActive
                                      ? "text-primary-foreground"
                                      : "text-foreground/70"
                                  )}
                                  aria-hidden="true"
                                />
                              ) : (
                                <FileText
                                  className={cn(
                                    "size-3.5 shrink-0",
                                    isActive
                                      ? "text-primary-foreground"
                                      : "text-muted-foreground/80 group-hover:text-foreground"
                                  )}
                                  aria-hidden="true"
                                />
                              )}
                              <span className="truncate">{lesson.title}</span>
                            </div>

                            {isSaved && (
                              <Bookmark
                                className={cn(
                                  "size-3 shrink-0 fill-current",
                                  isActive
                                    ? "text-primary-foreground"
                                    : "text-foreground/70"
                                )}
                                aria-label="Saved"
                              />
                            )}
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </ScrollArea>

      {/* Bottom Sticky PROGRESS Card (Matching Reference Screenshot Bottom-Left) */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          onClick={() => setMobileSidebarOpen(false)}
          className="group block rounded-xl border border-border bg-card px-3.5 py-2.5 transition-colors hover:border-[var(--ink)]"
        >
          <div className="flex items-center justify-between font-mono text-[11.5px]">
            <span className="font-bold tracking-wider text-muted-foreground uppercase">
              PROGRESS
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-foreground tabular-nums">
              <span>
                {viewedCount} / {totalCount}
              </span>
              <ChevronRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
          <Progress value={progressPct} className="mt-2" />
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Drawer using shadcn Sheet */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          showCloseButton
          className="w-76 border-r border-sidebar-border bg-sidebar p-0 sm:max-w-76"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>
              {isVi ? "Danh mục Khóa học" : "Course Navigation"}
            </SheetTitle>
            <SheetDescription>
              {isVi
                ? "Chọn chương và bài thực hành hiệu năng"
                : "Browse Foundations and Performance Lab chapters"}
            </SheetDescription>
          </SheetHeader>
          {courseTreeContent}
        </SheetContent>
      </Sheet>

      {/* Desktop Collapsible Left Course Sidebar */}
      {!sidebarCollapsed && (
        <aside className="hidden w-70 shrink-0 border-r border-sidebar-border bg-sidebar lg:block xl:w-74">
          <div className="sticky top-13.5 h-[calc(100svh-3.375rem)]">
            {courseTreeContent}
          </div>
        </aside>
      )}
    </>
  )
}
