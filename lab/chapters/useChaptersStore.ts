import { create } from "zustand";

type ChaptersState = {
  active: number;
  progress: number;
  continuous: number;
  set: (v: { active: number; progress: number; continuous: number }) => void;
};

export const useChaptersStore = create<ChaptersState>((set) => ({
  active: 0,
  progress: 0,
  continuous: 0,
  set: (v) => set(v),
}));
