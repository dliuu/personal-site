import { create } from "zustand";

type SectionsState = {
  active: number;
  progress: number;
  continuous: number;
  depth: number;
  set: (v: {
    active: number;
    progress: number;
    continuous: number;
    depth: number;
  }) => void;
};

export const useSectionsStore = create<SectionsState>((set) => ({
  active: 0,
  progress: 0,
  continuous: 0,
  depth: 0,
  set: (v) => set(v),
}));
