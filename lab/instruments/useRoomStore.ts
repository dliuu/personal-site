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
  toggleLamp: () => void;
  toggleSound: () => void;
  toggleCurtains: () => void;
  wakeCat: () => void;
  setHover: (h: Hover) => void;
  pin: (note: string | null) => void;
  puff: () => void;
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
      toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      toggleCurtains: () => set((s) => ({ curtainsOpen: !s.curtainsOpen })),
      wakeCat: () => set({ catAwakeUntil: performance.now() / 1000 + 8 }),
      setHover: (hover) => set({ hover }),
      pin: (pinned) => set({ pinned }),
      puff: () => set({ steamPuff: performance.now() / 1000 }),
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
