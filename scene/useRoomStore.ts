import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Hover = { label: string; note?: string } | null;

type RoomState = {
  lampOn: boolean;
  soundOn: boolean;
  curtainsOpen: boolean;
  /** Seconds (performance.now based) until which the cat stays awake; 0 = asleep. */
  catAwakeUntil: number;
  hover: Hover;
  pinned: string | null;
  steamPuff: number;
  /** The baked room has faded in; the procedural shell can hide. */
  baked: boolean;
  toggleLamp: () => void;
  toggleSound: () => void;
  toggleCurtains: () => void;
  wakeCat: () => void;
  setHover: (h: Hover) => void;
  pin: (note: string | null) => void;
  puff: () => void;
  setBaked: (b: boolean) => void;
};

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      lampOn: true,
      soundOn: false,
      curtainsOpen: true,
      catAwakeUntil: 0,
      hover: null,
      pinned: null,
      steamPuff: 0,
      baked: false,
      toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      toggleCurtains: () => set((s) => ({ curtainsOpen: !s.curtainsOpen })),
      wakeCat: () => set({ catAwakeUntil: performance.now() / 1000 + 8 }),
      setHover: (hover) => set({ hover }),
      pin: (pinned) => set({ pinned }),
      puff: () => set({ steamPuff: performance.now() / 1000 }),
      setBaked: (baked) => set({ baked }),
    }),
    {
      name: "instruments-room-2",
      partialize: (s) => ({
        lampOn: s.lampOn,
        soundOn: s.soundOn,
        curtainsOpen: s.curtainsOpen,
      }),
    },
  ),
);
