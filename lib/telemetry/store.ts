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
}

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
}))
