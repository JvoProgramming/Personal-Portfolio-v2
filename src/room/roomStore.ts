import { create } from 'zustand'

export type RoomModal = { type: 'photo'; id: string } | { type: 'gameboy' } | null

interface RoomState {
  lampOn: boolean
  hover: string | null
  modal: RoomModal
  poweringOn: boolean
  /** Bumped each time someone asks Mochi to fetch or drop her bone. */
  mochiCalls: number
  toggleLamp: () => void
  setHover: (label: string | null) => void
  setModal: (modal: RoomModal) => void
  powerOn: () => void
  callMochi: () => void
}

export const useRoom = create<RoomState>((set) => ({
  lampOn: true,
  hover: null,
  modal: null,
  poweringOn: false,
  mochiCalls: 0,
  toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
  setHover: (hover) => set({ hover }),
  setModal: (modal) => set({ modal, hover: null }),
  powerOn: () => set({ poweringOn: true, hover: null }),
  callMochi: () => set((s) => ({ mochiCalls: s.mochiCalls + 1 })),
}))
