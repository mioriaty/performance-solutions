export type LabSlug =
  | "rerender-storms"
  | "concurrent-react"
  | "dom-virtualization"
  | "long-tasks-yielding"
  | "web-workers-offload"
  | "layout-thrashing"
  | "detached-dom-leaks"
  | "closures-listeners-leaks"
  | "unbounded-cache-lru"
  | "network-waterfalls"
  | "cls-layout-shifts"
  | "dedup-optimistic-ui"
  | "high-frequency-streams"
  | "heavy-data-grid"
  | "input-responsiveness"
  | "code-splitting-prefetch"
  | "barrel-files-treeshaking"
  | "third-party-isolation"

export type MetricCategory =
  | "Re-renders"
  | "INP"
  | "FPS"
  | "TBT"
  | "Memory"
  | "LCP / TTFB"
  | "CLS"
  | "Network"
  | "Bundle"

export interface LabLocalizedContent {
  title: string
  subtitle: string
  symptomSummary: string
  rootCauseSummary: string
  symptoms: string[]
  underTheHood: string[]
  solution: string[]
  tradeoffs: string[]
  devtoolsSteps: string[]
  takeaway: string
}

export interface LabDefinition {
  slug: LabSlug
  code: string
  pillarId: number
  primaryMetric: MetricCategory
  severity: "critical" | "high" | "medium"
  libraries: string[]
  content: {
    vi: LabLocalizedContent
    en: LabLocalizedContent
  }
  badCode: string
  goodCode: string
}

export interface PillarDefinition {
  id: number
  code: string
  iconName: string
  title: {
    vi: string
    en: string
  }
  description: {
    vi: string
    en: string
  }
}
