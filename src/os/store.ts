import { create } from 'zustand'
import { canShowRoom, isSmallScreen } from '../lib/env'
import type { UserId } from './users'

export type Stage = 'room' | 'boot' | 'welcome' | 'desktop' | 'off'

export interface WindowState {
  id: string
  appId: string
  title: string
  props?: Record<string, string>
  x: number
  y: number
  width: number
  height: number
  z: number
  minimized: boolean
  maximized: boolean
}

export interface OpenAppOptions {
  /** Distinguishes several windows of one app, e.g. one per project. */
  key?: string
  title?: string
  props?: Record<string, string>
  width?: number
  height?: number
}

interface OsState {
  stage: Stage
  user: UserId | null
  windows: WindowState[]
  topZ: number
  startOpen: boolean
  wallpaperOverride: string | null
  /** An app to open right after login, e.g. the Cookbook when someone clicks the food in the room. */
  pendingApp: { appId: string; options?: OpenAppOptions } | null
  setStage: (stage: Stage) => void
  logIn: (user: UserId) => void
  logOff: () => void
  setStartOpen: (open: boolean) => void
  openApp: (appId: string, defaultTitle: string, options?: OpenAppOptions) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  toggleMaximize: (id: string) => void
  moveWindow: (id: string, x: number, y: number) => void
  resizeWindow: (id: string, rect: { x: number; y: number; width: number; height: number }) => void
  setWallpaper: (url: string | null) => void
  setPendingApp: (pending: { appId: string; options?: OpenAppOptions } | null) => void
}

let cascade = 0

export const useOs = create<OsState>((set, get) => ({
  stage: canShowRoom() ? 'room' : 'boot',
  user: null,
  windows: [],
  topZ: 10,
  startOpen: false,
  wallpaperOverride: null,
  pendingApp: null,

  setStage: (stage) => set({ stage, startOpen: false }),

  logIn: (user) => set({ user, stage: 'desktop', windows: [], startOpen: false, wallpaperOverride: null }),

  logOff: () => set({ user: null, stage: 'welcome', windows: [], startOpen: false, wallpaperOverride: null }),

  setStartOpen: (startOpen) => set({ startOpen }),

  openApp: (appId, defaultTitle, options = {}) => {
    const id = options.key ? `${appId}:${options.key}` : appId
    const existing = get().windows.find((w) => w.id === id)
    const z = get().topZ + 1
    if (existing) {
      set((s) => ({
        topZ: z,
        startOpen: false,
        windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: false, z } : w)),
      }))
      return
    }
    const vw = window.innerWidth
    const vh = window.innerHeight - 40
    const width = Math.min(options.width ?? 640, vw - 24)
    const height = Math.min(options.height ?? 460, vh - 24)
    const offset = (cascade++ % 6) * 28
    const x = Math.max(8, Math.round((vw - width) / 2 - 80 + offset))
    const y = Math.max(8, Math.round((vh - height) / 2 - 60 + offset))
    set((s) => ({
      topZ: z,
      startOpen: false,
      windows: [
        ...s.windows,
        {
          id,
          appId,
          title: options.title ?? defaultTitle,
          props: options.props,
          x,
          y,
          width,
          height,
          z,
          minimized: false,
          maximized: isSmallScreen(),
        },
      ],
    }))
  },

  closeWindow: (id) => set((s) => ({ windows: s.windows.filter((w) => w.id !== id) })),

  focusWindow: (id) => {
    const top = get().windows.reduce((a, w) => (w.minimized ? a : Math.max(a, w.z)), 0)
    const target = get().windows.find((w) => w.id === id)
    if (target && target.z === top && !target.minimized) return
    const z = get().topZ + 1
    set((s) => ({ topZ: z, windows: s.windows.map((w) => (w.id === id ? { ...w, z, minimized: false } : w)) }))
  },

  minimizeWindow: (id) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, minimized: true } : w)) })),

  toggleMaximize: (id) =>
    set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, maximized: !w.maximized } : w)) })),

  moveWindow: (id, x, y) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)) })),

  resizeWindow: (id, rect) => set((s) => ({ windows: s.windows.map((w) => (w.id === id ? { ...w, ...rect } : w)) })),

  setWallpaper: (wallpaperOverride) => set({ wallpaperOverride }),

  setPendingApp: (pendingApp) => set({ pendingApp }),
}))

/** The window that currently has focus: the highest one that isn't minimized. */
export function activeWindowId(windows: WindowState[]): string | null {
  let best: WindowState | null = null
  for (const w of windows) if (!w.minimized && (!best || w.z > best.z)) best = w
  return best?.id ?? null
}
