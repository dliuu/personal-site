import { create } from "zustand";

type SectionsState = {
  active: number;
  progress: number;
  continuous: number;
  depth: number;
  tall: boolean;
  kind: "chapter" | "plate";
  set: (v: {
    active: number;
    progress: number;
    continuous: number;
    depth: number;
    tall: boolean;
    kind: "chapter" | "plate";
  }) => void;
};

export const useSectionsStore = create<SectionsState>((set) => ({
  active: 0,
  progress: 0,
  continuous: 0,
  depth: 0,
  tall: false,
  kind: "chapter",
  set: (v) => set(v),
}));
