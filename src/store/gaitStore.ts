import { create } from 'zustand'
import type { AppScreen, GaitReport, TaggedFrame, WalkPass } from '../types/gait.types'

interface GaitStore {
  // Navigation
  currentScreen: AppScreen
  setScreen: (screen: AppScreen) => void

  // Recording state
  isRecording: boolean
  recordingStartTime: number | null
  setRecording: (val: boolean) => void

  // Frame data
  frames: TaggedFrame[]
  addFrame: (frame: TaggedFrame) => void

  // Pass tracking
  currentPass: WalkPass
  setCurrentPass: (pass: WalkPass) => void
  passProgress: Record<WalkPass, number>
  updatePassProgress: (pass: WalkPass, strideCount: number) => void

  // Report
  report: GaitReport | null
  setReport: (report: GaitReport) => void

  // Derived
  allPassesComplete: () => boolean

  // Reset
  reset: () => void
}

const initialPassProgress: Record<WalkPass, number> = {
  front: 0,
  rear: 0,
  left_side: 0,
  right_side: 0,
  unknown: 0,
}

export const useGaitStore = create<GaitStore>((set, get) => ({
  currentScreen: 'welcome',
  setScreen: (screen) => set({ currentScreen: screen }),

  isRecording: false,
  recordingStartTime: null,
  setRecording: (val) =>
    set({ isRecording: val, recordingStartTime: val ? Date.now() : null }),

  frames: [],
  addFrame: (frame) => set((state) => ({ frames: [...state.frames, frame] })),

  currentPass: 'unknown',
  setCurrentPass: (pass) => set({ currentPass: pass }),

  passProgress: { ...initialPassProgress },
  updatePassProgress: (pass, strideCount) =>
    set((state) => ({
      passProgress: { ...state.passProgress, [pass]: strideCount },
    })),

  report: null,
  setReport: (report) => set({ report }),

  allPassesComplete: () => {
    const { passProgress } = get()
    return (
      passProgress.front >= 3 &&
      passProgress.rear >= 3 &&
      passProgress.left_side >= 3 &&
      passProgress.right_side >= 3
    )
  },

  reset: () =>
    set({
      currentScreen: 'welcome',
      isRecording: false,
      recordingStartTime: null,
      frames: [],
      currentPass: 'unknown',
      passProgress: { ...initialPassProgress },
      report: null,
    }),
}))
