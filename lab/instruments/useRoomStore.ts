import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Hover = { label: string; note?: string } | null;

type RoomState = {
  soundOn: boolean;
  curtainsOpen: boolean;
  /** Seconds (performance.now based) until which the dog stays awake; 0 = asleep. */
  petAwakeUntil: number;
  hover: Hover;
  pinned: string | null;
  /** The baked room has faded in; the procedural shell can hide. */
  baked: boolean;
  toggleSound: () => void;
  toggleCurtains: () => void;
  wakePet: () => void;
  setHover: (h: Hover) => void;
  pin: (note: string | null) => void;
  setBaked: (b: boolean) => void;
};

export const useRoomStore = create<RoomState>()(
  persist(
    (set) => ({
      soundOn: false,
      curtainsOpen: true,
      petAwakeUntil: 0,
      hover: null,
      pinned: null,
      baked: false,
      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
      toggleCurtains: () => set((s) => ({ curtainsOpen: !s.curtainsOpen })),
      wakePet: () => set({ petAwakeUntil: performance.now() / 1000 + 8 }),
      setHover: (hover) => set({ hover }),
      pin: (pinned) => set({ pinned }),
      setBaked: (baked) => set({ baked }),
    }),
    {
      name: "instruments-room-8",
      partialize: (s) => ({
        soundOn: s.soundOn,
        curtainsOpen: s.curtainsOpen,
      }),
    },
  ),
);
