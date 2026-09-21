import { create } from "zustand";

type SectionsState = {
  active: number;
  progress: number;
  continuous: number;
  depth: number;
  tall: boolean;
  set: (v: {
    active: number;
    progress: number;
    continuous: number;
    depth: number;
    tall: boolean;
  }) => void;
};

export const useSectionsStore = create<SectionsState>((set) => ({
  active: 0,
  progress: 0,
  continuous: 0,
  depth: 0,
  tall: false,
  set: (v) => set(v),
}));
