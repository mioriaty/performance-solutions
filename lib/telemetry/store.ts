import { create } from "zustand"

export type LabMode = "bad" | "good"

export interface CustomMetric {
  label: string
  value: number
  unit: string
  lowerIsBetter: boolean
}

export interface MetricSnapshot {
  timestamp: number
  fps: number
  minFps: number
  longTasksCount: number
  tbtMs: number
  inpMs: number
  domNodes: number
  heapMb: number
  renderCount: number
  customMetric?: CustomMetric
}

const GARDEN_STORAGE_KEY = "perfgarden-user-state-v1"

interface PersistedGardenData {
  viewedLabs?: string[]
  savedLabs?: string[]
  labNotes?: Record<string, string>
  learnedItems?: Record<string, number[]>
  openChapters?: string[]
  lastLessonHref?: string
}

function readPersistedGardenData(): PersistedGardenData {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(GARDEN_STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as PersistedGardenData
  } catch {
    return {}
  }
}

function writePersistedGardenData(data: PersistedGardenData) {
  if (typeof window === "undefined") return
  try {
    const prev = readPersistedGardenData()
    window.localStorage.setItem(
      GARDEN_STORAGE_KEY,
      JSON.stringify({ ...prev, ...data })
    )
  } catch {
    // Ignore storage quota errors
  }
}

interface TelemetryState {
  mode: LabMode
  fps: number
  minFps: number
  fpsHistory: number[]
  longTasksCount: number
  tbtMs: number
  lastLongTaskMs: number
  inpMs: number
  domNodes: number
  heapMb: number
  trackedLeakBytes: number
  renderCount: number
  renderFlashEnabled: boolean
  customMetric?: CustomMetric
  snapshots: Record<string, { bad?: MetricSnapshot; good?: MetricSnapshot }>

  /* Workbook shell & progress state */
  gardenHydrated: boolean
  viewedLabs: string[]
  savedLabs: string[]
  labNotes: Record<string, string>
  learnedItems: Record<string, number[]>
  openChapters: string[]
  lastLessonHref: string
  sidebarCollapsed: boolean
  mobileSidebarOpen: boolean
  searchOpen: boolean

  setMode: (mode: LabMode) => void
  toggleRenderFlash: () => void
  updateFpsSample: (fps: number, domNodes: number, baseHeapMb: number) => void
  recordLongTask: (durationMs: number) => void
  recordInteraction: (durationMs: number) => void
  incrementRender: (delta?: number) => void
  addTrackedLeakBytes: (deltaBytes: number) => void
  resetTrackedLeakBytes: () => void
  setCustomMetric: (
    label: string,
    value: number,
    unit: string,
    lowerIsBetter?: boolean
  ) => void
  clearCustomMetric: () => void
  resetCounters: () => void
  captureSnapshot: (
    labSlug: string,
    mode?: LabMode,
    override?: Partial<MetricSnapshot>
  ) => void
  clearSnapshots: (labSlug: string) => void

  /* Workbook actions */
  hydrateGardenState: () => void
  markLabViewed: (lessonId: string, href?: string) => void
  toggleSavedLab: (labSlug: string) => void
  setLabNote: (labSlug: string, note: string) => void
  toggleLearnedItem: (lessonId: string, idx: number) => void
  setOpenChapters: (chapters: string[]) => void
  toggleSidebarCollapsed: () => void
  setMobileSidebarOpen: (open: boolean) => void
  setSearchOpen: (open: boolean) => void
}

const DEFAULT_OPEN_CHAPTERS = ["ch-01", "ch-02"]

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  mode: "bad",
  fps: 60,
  minFps: 60,
  fpsHistory: Array(24).fill(60),
  longTasksCount: 0,
  tbtMs: 0,
  lastLongTaskMs: 0,
  inpMs: 8,
  domNodes: 0,
  heapMb: 24,
  trackedLeakBytes: 0,
  renderCount: 0,
  renderFlashEnabled: true,
  customMetric: undefined,
  snapshots: {},

  gardenHydrated: false,
  viewedLabs: [],
  savedLabs: [],
  labNotes: {},
  learnedItems: {},
  openChapters: DEFAULT_OPEN_CHAPTERS,
  lastLessonHref: "/foundations/event-loop",
  sidebarCollapsed: false,
  mobileSidebarOpen: false,
  searchOpen: false,

  setMode: (mode) =>
    set({
      mode,
      longTasksCount: 0,
      tbtMs: 0,
      lastLongTaskMs: 0,
      inpMs: 8,
      minFps: 60,
      renderCount: 0,
    }),

  toggleRenderFlash: () =>
    set((state) => ({ renderFlashEnabled: !state.renderFlashEnabled })),

  updateFpsSample: (fps, domNodes, baseHeapMb) =>
    set((state) => {
      const clampedFps = Math.max(1, Math.min(60, Math.round(fps)))
      const nextHistory = [...state.fpsHistory.slice(1), clampedFps]
      const minFps = Math.min(...nextHistory)
      const leakMb = state.trackedLeakBytes / (1024 * 1024)
      const heapMb = Number((baseHeapMb + leakMb).toFixed(1))
      return {
        fps: clampedFps,
        minFps,
        fpsHistory: nextHistory,
        domNodes,
        heapMb,
      }
    }),

  recordLongTask: (durationMs) =>
    set((state) => {
      const blocking = Math.max(0, Math.round(durationMs - 50))
      const syntheticFpsDrop = Math.max(
        4,
        Math.round(60 * (16.6 / Math.max(16.6, durationMs)))
      )
      return {
        longTasksCount: state.longTasksCount + 1,
        tbtMs: state.tbtMs + blocking,
        lastLongTaskMs: Math.round(durationMs),
        minFps: Math.min(state.minFps, syntheticFpsDrop),
        fpsHistory: [...state.fpsHistory.slice(1), syntheticFpsDrop],
      }
    }),

  recordInteraction: (durationMs) =>
    set((state) => ({
      inpMs: Math.max(state.inpMs, Math.round(durationMs)),
    })),

  incrementRender: (delta = 1) =>
    set((state) => ({
      renderCount: state.renderCount + delta,
    })),

  addTrackedLeakBytes: (deltaBytes) =>
    set((state) => {
      const nextBytes = Math.max(0, state.trackedLeakBytes + deltaBytes)
      return {
        trackedLeakBytes: nextBytes,
        heapMb: Number((24 + nextBytes / (1024 * 1024)).toFixed(1)),
      }
    }),

  resetTrackedLeakBytes: () =>
    set({
      trackedLeakBytes: 0,
      heapMb: 24,
    }),

  setCustomMetric: (label, value, unit, lowerIsBetter = true) =>
    set({
      customMetric: {
        label,
        value: Number(value.toFixed(2)),
        unit,
        lowerIsBetter,
      },
    }),

  clearCustomMetric: () => set({ customMetric: undefined }),

  resetCounters: () =>
    set({
      fps: 60,
      minFps: 60,
      fpsHistory: Array(24).fill(60),
      longTasksCount: 0,
      tbtMs: 0,
      lastLongTaskMs: 0,
      inpMs: 8,
      renderCount: 0,
    }),

  captureSnapshot: (labSlug, targetMode, override) => {
    const state = get()
    const mode = targetMode ?? state.mode
    const snapshot: MetricSnapshot = {
      timestamp: Date.now(),
      fps: override?.fps ?? state.minFps,
      minFps: override?.minFps ?? state.minFps,
      longTasksCount: override?.longTasksCount ?? state.longTasksCount,
      tbtMs: override?.tbtMs ?? state.tbtMs,
      inpMs: override?.inpMs ?? state.inpMs,
      domNodes: override?.domNodes ?? state.domNodes,
      heapMb: override?.heapMb ?? state.heapMb,
      renderCount: override?.renderCount ?? state.renderCount,
      customMetric: override?.customMetric ?? state.customMetric,
    }
    set((prev) => ({
      snapshots: {
        ...prev.snapshots,
        [labSlug]: {
          ...prev.snapshots[labSlug],
          [mode]: snapshot,
        },
      },
    }))
  },

  clearSnapshots: (labSlug) =>
    set((prev) => {
      const next = { ...prev.snapshots }
      delete next[labSlug]
      return { snapshots: next }
    }),

  hydrateGardenState: () => {
    if (get().gardenHydrated) return
    const data = readPersistedGardenData()
    set({
      gardenHydrated: true,
      viewedLabs: data.viewedLabs ?? [],
      savedLabs: data.savedLabs ?? [],
      labNotes: data.labNotes ?? {},
      learnedItems: data.learnedItems ?? {},
      openChapters: data.openChapters ?? DEFAULT_OPEN_CHAPTERS,
      lastLessonHref: data.lastLessonHref ?? "/foundations/event-loop",
    })
  },

  markLabViewed: (lessonId, href) => {
    const state = get()
    const persisted = readPersistedGardenData()
    const baseViewed = state.gardenHydrated
      ? state.viewedLabs
      : (persisted.viewedLabs ?? [])
    const nextViewed = baseViewed.includes(lessonId)
      ? baseViewed
      : [...baseViewed, lessonId]
    const nextLastHref =
      href ??
      (state.gardenHydrated
        ? state.lastLessonHref
        : (persisted.lastLessonHref ?? "/foundations/event-loop"))

    writePersistedGardenData({
      viewedLabs: nextViewed,
      lastLessonHref: nextLastHref,
    })
    set({
      gardenHydrated: true,
      viewedLabs: nextViewed,
      savedLabs: state.gardenHydrated
        ? state.savedLabs
        : (persisted.savedLabs ?? []),
      labNotes: state.gardenHydrated
        ? state.labNotes
        : (persisted.labNotes ?? {}),
      learnedItems: state.gardenHydrated
        ? state.learnedItems
        : (persisted.learnedItems ?? {}),
      openChapters: state.gardenHydrated
        ? state.openChapters
        : (persisted.openChapters ?? DEFAULT_OPEN_CHAPTERS),
      lastLessonHref: nextLastHref,
    })
  },

  toggleSavedLab: (labSlug) => {
    const state = get()
    const persisted = readPersistedGardenData()
    const currentSaved = state.gardenHydrated
      ? state.savedLabs
      : (persisted.savedLabs ?? [])
    const exists = currentSaved.includes(labSlug)
    const nextSaved = exists
      ? currentSaved.filter((s) => s !== labSlug)
      : [...currentSaved, labSlug]
    writePersistedGardenData({ savedLabs: nextSaved })
    set({
      gardenHydrated: true,
      savedLabs: nextSaved,
    })
  },

  setLabNote: (labSlug, note) => {
    const state = get()
    const persisted = readPersistedGardenData()
    const currentNotes = state.gardenHydrated
      ? state.labNotes
      : (persisted.labNotes ?? {})
    const nextNotes = {
      ...currentNotes,
      [labSlug]: note,
    }
    writePersistedGardenData({ labNotes: nextNotes })
    set({
      gardenHydrated: true,
      labNotes: nextNotes,
    })
  },

  toggleLearnedItem: (lessonId, idx) => {
    const state = get()
    const persisted = readPersistedGardenData()
    const currentMap = state.gardenHydrated
      ? state.learnedItems
      : (persisted.learnedItems ?? {})
    const currentArr = currentMap[lessonId] ?? []
    const nextArr = currentArr.includes(idx)
      ? currentArr.filter((x) => x !== idx)
      : [...currentArr, idx]
    const nextMap = { ...currentMap, [lessonId]: nextArr }
    writePersistedGardenData({ learnedItems: nextMap })
    set({
      gardenHydrated: true,
      learnedItems: nextMap,
    })
  },

  setOpenChapters: (chapters) => {
    writePersistedGardenData({ openChapters: chapters })
    set({ openChapters: chapters })
  },

  toggleSidebarCollapsed: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setMobileSidebarOpen: (open) => set({ mobileSidebarOpen: open }),

  setSearchOpen: (open) => set({ searchOpen: open }),
}))
