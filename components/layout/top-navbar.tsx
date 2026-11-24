"use client"

import React, { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  Check,
  ChevronDown,
  Cpu,
  FileText,
  Globe,
  LayoutGrid,
  Menu,
  Moon,
  PanelLeft,
  Search,
  Sun,
} from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useTelemetryStore } from "@/lib/telemetry/store"
import { setUserLocale } from "@/i18n/actions"
import type { Locale } from "@/i18n/request"
import { getCourseChapters } from "@/lib/course-tree"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface PerformanceWithMemory extends Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
  }
}

/**
 * Isometric System Node Logo matching the reference workbook aesthetic
 */
function WorkbookLogoIcon() {
  return (
    <svg
      viewBox="0 0 28 28"
      className="size-6 shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="9"
        y="3"
        width="10"
        height="7"
        rx="2"
        fill="var(--chapter-1)"
        stroke="var(--ink)"
        strokeWidth="1.6"
      />
      <path
        d="M14 10V14M14 14H7V18M14 14H21V18"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="3"
        y="18"
        width="8"
        height="7"
        rx="2"
        fill="var(--chapter-2)"
        stroke="var(--ink)"
        strokeWidth="1.6"
      />
      <rect
        x="17"
        y="18"
        width="8"
        height="7"
        rx="2"
        fill="var(--chapter-5)"
        stroke="var(--ink)"
        strokeWidth="1.6"
      />
    </svg>
  )
}

/**
 * Headless runtime telemetry observer (FPS, Long Tasks, INP, DOM, Heap)
 */
function TelemetryObserverDaemon() {
  useEffect(() => {
    let frameCount = 0
    let lastSampleTime = performance.now()
    let lastFrameTime = lastSampleTime
    let maxFrameDelta = 16.6
    let rafId = 0

    const loop = (now: number) => {
      frameCount += 1
      const delta = now - lastFrameTime
      lastFrameTime = now
      if (delta > maxFrameDelta) {
        maxFrameDelta = delta
      }

      const elapsed = now - lastSampleTime
      if (elapsed >= 500) {
        const avgFps = (frameCount * 1000) / elapsed
        const worstInstantFps = 1000 / Math.max(16.6, maxFrameDelta)
        const effectiveFps = maxFrameDelta > 55 ? worstInstantFps : avgFps

        const nodes = document.getElementsByTagName("*").length
        const perfMem = (performance as PerformanceWithMemory).memory
        const baseHeapMb = perfMem ? perfMem.usedJSHeapSize / (1024 * 1024) : 24

        useTelemetryStore
          .getState()
          .updateFpsSample(effectiveFps, nodes, baseHeapMb)

        if (maxFrameDelta > 55) {
          useTelemetryStore.getState().recordLongTask(maxFrameDelta)
        }

        frameCount = 0
        maxFrameDelta = 16.6
        lastSampleTime = now
      }

      rafId = window.requestAnimationFrame(loop)
    }

    rafId = window.requestAnimationFrame(loop)

    let longTaskObserver: PerformanceObserver | null = null
    let eventObserver: PerformanceObserver | null = null

    if (typeof PerformanceObserver !== "undefined") {
      try {
        longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              useTelemetryStore.getState().recordLongTask(entry.duration)
            }
          }
        })
        longTaskObserver.observe({ entryTypes: ["longtask"] })
      } catch {
        // Fallback handled via rAF delta detection
      }

      try {
        eventObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration >= 16) {
              useTelemetryStore.getState().recordInteraction(entry.duration)
            }
          }
        })
        eventObserver.observe({
          type: "event",
          buffered: false,
        } as PerformanceObserverInit)
      } catch {
        // Ignore if event timing API not supported
      }
    }

    return () => {
      window.cancelAnimationFrame(rafId)
      longTaskObserver?.disconnect()
      eventObserver?.disconnect()
    }
  }, [])

  return null
}

function CommandSearchDialog({ locale }: { locale: Locale }) {
  const isVi = locale === "vi"
  const router = useRouter()
  const searchOpen = useTelemetryStore((s) => s.searchOpen)
  const setSearchOpen = useTelemetryStore((s) => s.setSearchOpen)

  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)

  const chapters = useMemo(() => getCourseChapters(locale), [locale])

  const filteredChapters = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return chapters
    return chapters
      .map((ch) => ({
        ...ch,
        lessons: ch.lessons.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.subtitle.toLowerCase().includes(q) ||
            item.code.toLowerCase().includes(q) ||
            item.primaryMetric.toLowerCase().includes(q) ||
            item.tags.some((t) => t.toLowerCase().includes(q)) ||
            ch.title.toLowerCase().includes(q)
        ),
      }))
      .filter((ch) => ch.lessons.length > 0)
  }, [chapters, query])

  const flatResults = useMemo(
    () => filteredChapters.flatMap((c) => c.lessons),
    [filteredChapters]
  )

  const safeIndex = activeIndex < flatResults.length ? activeIndex : 0

  const handleSelectLesson = (href: string) => {
    setSearchOpen(false)
    setQuery("")
    router.push(href)
  }

  return (
    <Dialog
      open={searchOpen}
      onOpenChange={(open) => {
        setSearchOpen(open)
        if (!open) setQuery("")
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex w-[calc(100vw-2rem)] max-w-[620px] flex-col gap-0 overflow-hidden rounded-2xl border-[1.5px] border-[var(--ink)] bg-card p-0 shadow-[var(--shadow-ink)] sm:max-w-[620px]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>
            {isVi ? "Tìm bài học & khái niệm" : "Search lessons & concepts"}
          </DialogTitle>
          <DialogDescription>
            {isVi
              ? "Tìm kiếm nhanh trong 20 bài học Foundations và Performance Labs"
              : "Quickly jump to any of the 20 Foundations and Performance Labs"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex w-full min-w-0 items-center gap-3 border-b border-border px-5 py-4">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault()
                setActiveIndex((i) =>
                  flatResults.length > 0 ? (i + 1) % flatResults.length : 0
                )
              } else if (e.key === "ArrowUp") {
                e.preventDefault()
                setActiveIndex((i) =>
                  flatResults.length > 0
                    ? (i - 1 + flatResults.length) % flatResults.length
                    : 0
                )
              } else if (e.key === "Enter" && flatResults[safeIndex]) {
                e.preventDefault()
                handleSelectLesson(flatResults[safeIndex].href)
              }
            }}
            placeholder={
              isVi
                ? "Tìm bài học, chỉ số (INP, CLS, FPS, Zustand...)"
                : "Search lessons, metrics (INP, CLS, FPS, Zustand...)"
            }
            className="h-8 min-w-0 flex-1 border-0 bg-transparent px-0 font-mono text-[13px] shadow-none focus-visible:ring-0"
          />
          <Kbd className="shrink-0">ESC</Kbd>
        </div>

        <div className="max-h-[min(420px,60vh)] w-full min-w-0 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-5">
          <div className="flex w-full min-w-0 flex-col gap-4">
            {filteredChapters.length === 0 ? (
              <div className="px-4 py-10 text-center font-mono text-xs text-muted-foreground">
                {isVi
                  ? `Không tìm thấy bài học phù hợp cho "${query}"`
                  : `No matching lessons found for "${query}"`}
              </div>
            ) : (
              filteredChapters.map((ch) => (
                <div key={ch.id} className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-center gap-2 px-2 py-1 font-mono text-[11px] font-bold text-muted-foreground">
                    <span
                      className="size-2.5 shrink-0 rounded-[3px] border border-[var(--ink)]"
                      style={{ backgroundColor: ch.folderColorVar }}
                    />
                    <span className="truncate">
                      {ch.number}. {ch.title}
                    </span>
                  </div>
                  {ch.lessons.map((lesson) => {
                    const globalIdx = flatResults.findIndex(
                      (x) => x.id === lesson.id
                    )
                    const isHighlighted = globalIdx === safeIndex
                    return (
                      <button
                        key={lesson.id}
                        type="button"
                        onMouseEnter={() => setActiveIndex(globalIdx)}
                        onClick={() => handleSelectLesson(lesson.href)}
                        className={cn(
                          "flex w-full min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                          isHighlighted
                            ? "border-[1.5px] border-[var(--ink)] bg-primary text-primary-foreground shadow-[var(--shadow-ink-sm)]"
                            : "border-transparent text-foreground hover:bg-muted/70"
                        )}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <FileText className="size-4 shrink-0 opacity-75" />
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-mono text-[12.5px] font-semibold">
                              {lesson.title}
                            </div>
                            <div
                              className={cn(
                                "mt-0.5 truncate text-[12px]",
                                isHighlighted
                                  ? "text-primary-foreground/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {lesson.subtitle}
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={ch.badgeVariant}
                            className="h-5 px-2 text-[10px]"
                          >
                            {lesson.primaryMetric}
                          </Badge>
                          <ArrowRight className="size-3.5 opacity-70" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex w-full min-w-0 items-center justify-between gap-3 border-t border-border bg-muted/50 px-5 py-3 font-mono text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              <span>{isVi ? "di chuyển" : "navigate"}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <Kbd>↵</Kbd>
              <span>{isVi ? "mở bài" : "open"}</span>
            </span>
          </div>
          <span className="shrink-0">20 {isVi ? "bài học" : "lessons"}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function TopNavbar() {
  const pathname = usePathname()
  const locale = useLocale() as Locale
  const isVi = locale === "vi"
  const { resolvedTheme, setTheme } = useTheme()
  const [isPendingLocale, startLocaleTransition] = useTransition()

  const savedLabs = useTelemetryStore((s) => s.savedLabs)
  const lastLessonHref = useTelemetryStore((s) => s.lastLessonHref)
  const toggleSidebarCollapsed = useTelemetryStore(
    (s) => s.toggleSidebarCollapsed
  )
  const setMobileSidebarOpen = useTelemetryStore((s) => s.setMobileSidebarOpen)
  const setSearchOpen = useTelemetryStore((s) => s.setSearchOpen)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        useTelemetryStore.getState().setSearchOpen(true)
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault()
        if (window.innerWidth < 1024) {
          const cur = useTelemetryStore.getState().mobileSidebarOpen
          useTelemetryStore.getState().setMobileSidebarOpen(!cur)
        } else {
          useTelemetryStore.getState().toggleSidebarCollapsed()
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSwitchLocale = (nextLocale: Locale) => {
    if (nextLocale === locale) return
    startLocaleTransition(async () => {
      await setUserLocale(nextLocale)
    })
  }

  const isLearnActive =
    pathname.startsWith("/labs/") ||
    pathname.startsWith("/foundations/") ||
    pathname.startsWith("/foundation/")
  const isCatalogActive = pathname === "/"
  const isFoundationsHubActive = pathname === "/foundations"
  const isSavedActive = pathname === "/saved"

  return (
    <>
      <TelemetryObserverDaemon />
      <CommandSearchDialog locale={locale} />

      <header className="sticky top-0 z-40 h-13.5 w-full border-b border-border bg-background/95 backdrop-blur-xs">
        <div className="flex h-full items-center justify-between gap-3 px-3 sm:px-4 lg:px-5">
          {/* Left: Sidebar Toggle + Brand + Primary Navigation Tabs */}
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              {/* Mobile Sheet Trigger */}
              <Button
                variant="ghost"
                size="icon-sm"
                className="lg:hidden"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label={isVi ? "Mở danh mục khóa học" : "Open course menu"}
              >
                <Menu />
              </Button>

              {/* Desktop Sidebar Collapse Toggle */}
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="hidden lg:inline-flex"
                      onClick={toggleSidebarCollapsed}
                      aria-label={
                        isVi ? "Ẩn/hiện cây khóa học" : "Toggle course sidebar"
                      }
                    />
                  }
                >
                  <PanelLeft />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <span>{isVi ? "Ẩn/hiện menu" : "Toggle sidebar"}</span>
                  <Kbd>⌘B</Kbd>
                </TooltipContent>
              </Tooltip>

              <Link
                href="/"
                className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-opacity hover:opacity-85"
              >
                <WorkbookLogoIcon />
                <span className="font-mono text-[15.5px] font-bold tracking-tight text-foreground">
                  PerfLab
                </span>
              </Link>
            </div>

            {/* Primary Navigation Pills (System Design Workbook Style) */}
            <nav
              aria-label="Primary"
              className="hidden items-center gap-1 md:flex"
            >
              <Button
                variant={isLearnActive ? "default" : "ghost"}
                size="sm"
                render={
                  <Link href={lastLessonHref || "/foundations/event-loop"} />
                }
                nativeButton={false}
                aria-current={isLearnActive ? "page" : undefined}
              >
                <BookOpen data-icon="inline-start" />
                <span>{isVi ? "Bài học" : "Learn"}</span>
              </Button>

              <Button
                variant={isCatalogActive ? "default" : "ghost"}
                size="sm"
                render={<Link href="/" />}
                nativeButton={false}
                aria-current={isCatalogActive ? "page" : undefined}
              >
                <LayoutGrid data-icon="inline-start" />
                <span>{isVi ? "Tổng quan" : "Catalog"}</span>
              </Button>

              <Button
                variant={isFoundationsHubActive ? "default" : "ghost"}
                size="sm"
                render={<Link href="/foundations" />}
                nativeButton={false}
                aria-current={isFoundationsHubActive ? "page" : undefined}
              >
                <Cpu data-icon="inline-start" />
                <span>{isVi ? "Nền tảng" : "Foundations"}</span>
              </Button>

              <Button
                variant={isSavedActive ? "default" : "ghost"}
                size="sm"
                render={<Link href="/saved" />}
                nativeButton={false}
                aria-current={isSavedActive ? "page" : undefined}
              >
                <Bookmark data-icon="inline-start" />
                <span>{isVi ? "Đã lưu" : "Saved"}</span>
                {savedLabs.length > 0 && (
                  <span className="ml-0.5 rounded-full border border-current/25 px-1.5 text-[10px]">
                    {savedLabs.length}
                  </span>
                )}
              </Button>
            </nav>
          </div>

          {/* Right: Search Input Trigger (⌘K) + Language Selector + Theme Button */}
          <div className="flex shrink-0 items-center gap-2">
            {/* Search Trigger matching reference top-right search box */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="inline-flex h-8.5 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card px-2.5 font-mono text-[12px] text-muted-foreground transition-colors hover:border-[var(--ink)] hover:text-foreground sm:w-56 lg:w-68"
              aria-label={
                isVi ? "Tìm bài học & khái niệm" : "Search lessons & concepts"
              }
            >
              <span className="flex min-w-0 items-center gap-2 truncate">
                <Search className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden truncate sm:inline">
                  {isVi
                    ? "Tìm bài học & khái niệm.."
                    : "Search lessons & concepts.."}
                </span>
              </span>
              <Kbd className="hidden sm:inline-flex">⌘K</Kbd>
            </button>

            {/* Language Selector Dropdown (🌐 EN v) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPendingLocale}
                    aria-label={isVi ? "Chọn ngôn ngữ" : "Select language"}
                  />
                }
              >
                <Globe data-icon="inline-start" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown data-icon="inline-end" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-36 border-[1.5px] border-[var(--ink)] bg-card font-mono shadow-[var(--shadow-ink-sm)]"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-mono text-[10.5px] uppercase">
                    {isVi ? "Ngôn ngữ" : "Language"}
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleSwitchLocale("en")}
                    className="cursor-pointer justify-between font-mono text-xs"
                  >
                    <span>English (EN)</span>
                    {locale === "en" && <Check className="size-3.5" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleSwitchLocale("vi")}
                    className="cursor-pointer justify-between font-mono text-xs"
                  >
                    <span>Tiếng Việt (VI)</span>
                    {locale === "vi" && <Check className="size-3.5" />}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Theme Mode Button (🌙 / ☀️) */}
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() =>
                      setTheme(resolvedTheme === "dark" ? "light" : "dark")
                    }
                    aria-label={
                      resolvedTheme === "dark"
                        ? isVi
                          ? "Chuyển sang giao diện Sáng"
                          : "Switch to light theme"
                        : isVi
                          ? "Chuyển sang giao diện Tối"
                          : "Switch to dark theme"
                    }
                  />
                }
              >
                {resolvedTheme === "dark" ? <Sun /> : <Moon />}
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <span>
                  {resolvedTheme === "dark"
                    ? isVi
                      ? "Chế độ Sáng"
                      : "Light mode"
                    : isVi
                      ? "Chế độ Tối"
                      : "Dark mode"}
                </span>
                <Kbd>D</Kbd>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>
    </>
  )
}
