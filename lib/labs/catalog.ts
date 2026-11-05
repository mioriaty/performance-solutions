import type {
  LabDefinition,
  LabPatternMapping,
  LabSlug,
  PillarDefinition,
} from "./types"
import { LABS_PILLARS_1_TO_3 } from "./pillars-1-3"
import { LABS_PILLARS_4_TO_6 } from "./pillars-4-6"
import { SCENARIOS_PILLARS_1_TO_3 } from "./scenarios-pillars-1-3"
import { SCENARIOS_PILLARS_4_TO_6 } from "./scenarios-pillars-4-6"

const ALL_SCENARIOS: Record<
  LabSlug,
  { vi: LabPatternMapping; en: LabPatternMapping }
> = {
  ...SCENARIOS_PILLARS_1_TO_3,
  ...SCENARIOS_PILLARS_4_TO_6,
}

export function getLabPatternMapping(
  slug: LabSlug,
  locale: "vi" | "en"
): LabPatternMapping {
  const entry = ALL_SCENARIOS[slug]
  return entry[locale] ?? entry.vi
}

export const PILLARS: PillarDefinition[] = [
  {
    id: 1,
    code: "P1",
    iconName: "Layers",
    title: {
      vi: "Rendering & React Internals",
      en: "Rendering & React Internals",
    },
    description: {
      vi: "Kiểm soát Re-render Storms, Concurrent Fiber (`useTransition`, `useDeferredValue`) và Ảo hóa DOM 10,000+ phần tử.",
      en: "Mastering Re-render Storms, Concurrent Fiber scheduling (`useTransition`, `useDeferredValue`), and 10,000+ DOM Virtualization.",
    },
  },
  {
    id: 2,
    code: "P2",
    iconName: "Cpu",
    title: {
      vi: "Main Thread & Runtime (INP & FPS)",
      en: "Main Thread & Runtime (INP & FPS)",
    },
    description: {
      vi: "Giải phóng Main Thread khỏi Long Tasks (>50ms) bằng Time-Slicing (`scheduler.yield`), Web Workers và chống Layout Thrashing.",
      en: "Keeping the Main Thread unblocked via Time-Slicing (`scheduler.yield`), Web Workers, and eliminating Forced Synchronous Reflows.",
    },
  },
  {
    id: 3,
    code: "P3",
    iconName: "Database",
    title: {
      vi: "Memory & Resource Leaks",
      en: "Memory & Resource Leaks",
    },
    description: {
      vi: "Phát hiện và ngăn chặn rò rỉ Detached DOM Nodes, Zombie Closures, Listeners và Unbounded Cache bằng WeakMap & LRU.",
      en: "Preventing Detached DOM trees, Zombie Listener Closures, and Unbounded Memory Caches with AbortController, WeakMap, and LRU.",
    },
  },
  {
    id: 4,
    code: "P4",
    iconName: "Globe",
    title: {
      vi: "Loading, Network & Core Web Vitals",
      en: "Loading, Network & Core Web Vitals",
    },
    description: {
      vi: "Xóa bỏ Request Waterfalls, triệt tiêu nhảy bố cục (CLS = 0.000), Request Deduplication và 0ms Optimistic UI.",
      en: "Flattening Network Waterfalls, achieving 0.000 CLS, deduplicating in-flight requests, and building 0ms Optimistic Mutations.",
    },
  },
  {
    id: 5,
    code: "P5",
    iconName: "Activity",
    title: {
      vi: "Data-Intensive & Large-Scale UI",
      en: "Data-Intensive & Large-Scale UI",
    },
    description: {
      vi: "Xử lý luồng WebSocket 200 msg/giây với rAF Batching, bảng 50,000 dòng Data Grid và chống Race Condition khi tìm kiếm.",
      en: "Handling 200+ msg/sec real-time streams with rAF batching, 50,000-row client Data Grids, and race-condition-proof search.",
    },
  },
  {
    id: 6,
    code: "P6",
    iconName: "Package",
    title: {
      vi: "Bundle, Assets & Execution Architecture",
      en: "Bundle, Assets & Execution Architecture",
    },
    description: {
      vi: "Tối ưu Code Splitting + Prefetch on Intent, bẫy Barrel Files (`index.ts`) chống Tree-shaking và cô lập 3rd-Party Scripts.",
      en: "Optimizing Code Splitting with Hover Intent Preloading, avoiding Barrel File tree-shaking traps, and isolating 3rd-party SDKs.",
    },
  },
]

export const ALL_LABS: LabDefinition[] = [
  ...LABS_PILLARS_1_TO_3,
  ...LABS_PILLARS_4_TO_6,
]

export function getLabBySlug(slug: string): LabDefinition | undefined {
  return ALL_LABS.find((lab) => lab.slug === slug)
}

export function getPillarById(id: number): PillarDefinition | undefined {
  return PILLARS.find((p) => p.id === id)
}

export function getLabsByPillar(pillarId: number): LabDefinition[] {
  return ALL_LABS.filter((lab) => lab.pillarId === pillarId)
}

export function getAdjacentLabs(slug: LabSlug): {
  prev?: LabDefinition
  next?: LabDefinition
} {
  const idx = ALL_LABS.findIndex((l) => l.slug === slug)
  if (idx === -1) return {}
  return {
    prev: idx > 0 ? ALL_LABS[idx - 1] : undefined,
    next: idx < ALL_LABS.length - 1 ? ALL_LABS[idx + 1] : undefined,
  }
}
