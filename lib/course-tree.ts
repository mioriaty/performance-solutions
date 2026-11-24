import { ALL_LABS, PILLARS } from "@/lib/labs/catalog"
import { FOUNDATION_TOPICS } from "@/lib/foundations/catalog"
import type { Locale } from "@/i18n/request"

export type ChapterBadgeVariant =
  "amber" | "mint" | "periwinkle" | "peach" | "sky" | "lavender" | "coral"

export interface CourseLessonItem {
  id: string
  code: string
  href: string
  title: string
  subtitle: string
  primaryMetric: string
  tags: string[]
  chapterId: string
  chapterNumber: string
  chapterTitle: string
  indexInChapter: number
  totalInChapter: number
  isFoundation?: boolean
}

export interface CourseChapter {
  id: string
  number: string
  title: string
  folderColorVar: string
  badgeVariant: ChapterBadgeVariant
  lessons: CourseLessonItem[]
}

const PILLAR_CHAPTER_TITLES: Record<number, { en: string; vi: string }> = {
  1: { en: "Rendering & Fiber", vi: "Rendering & Fiber" },
  2: { en: "Main Thread & INP", vi: "Main Thread & INP" },
  3: { en: "Memory & Leaks", vi: "Memory & Rò rỉ" },
  4: { en: "Network & CWV", vi: "Network & CWV" },
  5: { en: "Data Scale & Streams", vi: "Dữ liệu lớn & Stream" },
  6: { en: "Bundle & Architecture", vi: "Bundle & Kiến trúc" },
}

const CHAPTER_STYLES: Record<
  number,
  { colorVar: string; badgeVariant: ChapterBadgeVariant }
> = {
  1: { colorVar: "var(--chapter-1)", badgeVariant: "amber" },
  2: { colorVar: "var(--chapter-2)", badgeVariant: "mint" },
  3: { colorVar: "var(--chapter-3)", badgeVariant: "periwinkle" },
  4: { colorVar: "var(--chapter-4)", badgeVariant: "peach" },
  5: { colorVar: "var(--chapter-5)", badgeVariant: "sky" },
  6: { colorVar: "var(--chapter-6)", badgeVariant: "lavender" },
  7: { colorVar: "var(--chapter-7)", badgeVariant: "coral" },
}

export function getCourseChapters(locale: Locale): CourseChapter[] {
  const foundationsTitle = locale === "vi" ? "Nền tảng Runtime" : "Foundations"
  const foundationsLessons: CourseLessonItem[] = FOUNDATION_TOPICS.map(
    (topic, idx) => ({
      id: `f:${topic.slug}`,
      code: topic.code,
      href: topic.href,
      title: topic.shortTitle[locale],
      subtitle: topic.summary[locale],
      primaryMetric: topic.badge,
      tags: topic.metrics,
      chapterId: "ch-01",
      chapterNumber: "01",
      chapterTitle: foundationsTitle,
      indexInChapter: idx + 1,
      totalInChapter: FOUNDATION_TOPICS.length,
      isFoundation: true,
    })
  )

  const chapters: CourseChapter[] = [
    {
      id: "ch-01",
      number: "01",
      title: foundationsTitle,
      folderColorVar: CHAPTER_STYLES[1].colorVar,
      badgeVariant: CHAPTER_STYLES[1].badgeVariant,
      lessons: foundationsLessons,
    },
  ]

  for (const pillar of PILLARS) {
    const chNum = pillar.id + 1
    const padded = String(chNum).padStart(2, "0")
    const chId = `ch-${padded}`
    const chTitle =
      PILLAR_CHAPTER_TITLES[pillar.id]?.[locale] ?? pillar.title[locale]
    const style = CHAPTER_STYLES[chNum] ?? CHAPTER_STYLES[2]
    const pillarLabs = ALL_LABS.filter((l) => l.pillarId === pillar.id)

    chapters.push({
      id: chId,
      number: padded,
      title: chTitle,
      folderColorVar: style.colorVar,
      badgeVariant: style.badgeVariant,
      lessons: pillarLabs.map((lab, idx) => ({
        id: lab.slug,
        code: lab.code,
        href: `/labs/${lab.slug}`,
        title: lab.content[locale].title,
        subtitle: lab.content[locale].symptomSummary,
        primaryMetric: lab.primaryMetric,
        tags: lab.libraries,
        chapterId: chId,
        chapterNumber: padded,
        chapterTitle: chTitle,
        indexInChapter: idx + 1,
        totalInChapter: pillarLabs.length,
      })),
    })
  }

  return chapters
}

export function getAllCourseLessons(locale: Locale): CourseLessonItem[] {
  return getCourseChapters(locale).flatMap((ch) => ch.lessons)
}

export function getTotalCourseLessonsCount(): number {
  return FOUNDATION_TOPICS.length + ALL_LABS.length
}
