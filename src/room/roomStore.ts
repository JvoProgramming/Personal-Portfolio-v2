import { create } from 'zustand'

export type RoomModal = { type: 'photo'; id: string } | { type: 'gameboy' } | null

interface RoomState {
  lampOn: boolean
  blindsClosed: boolean
  hover: string | null
  modal: RoomModal
  poweringOn: boolean
  /** Sitting in the desk chair: first-person view, drag to look around. */
  seated: boolean
  /** The mouse is captured for first-person look (seated, desktop). */
  locked: boolean
  toggleLamp: () => void
  toggleBlinds: () => void
  setHover: (label: string | null) => void
  setModal: (modal: RoomModal) => void
  powerOn: () => void
  sit: () => void
  stand: () => void
}

export const useRoom = create<RoomState>((set) => ({
  lampOn: true,
  blindsClosed: false,
  hover: null,
  modal: null,
  poweringOn: false,
  seated: false,
  locked: false,
  toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
  toggleBlinds: () => set((s) => ({ blindsClosed: !s.blindsClosed })),
  setHover: (hover) => set({ hover }),
  setModal: (modal) => set({ modal, hover: null }),
  powerOn: () => set({ poweringOn: true, hover: null }),
  sit: () => set({ seated: true, hover: null }),
  stand: () => set({ seated: false, hover: null }),
}))
