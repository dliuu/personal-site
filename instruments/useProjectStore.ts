import { create } from "zustand";

/**
 * The open project: a plate that opens by click rather than scroll. While
 * one is open the page is locked and the wheel scrubs `progress` through its
 * beats.
 */
type ProjectState = {
  open: string | null;
  progress: number;
  setOpen: (id: string | null) => void;
  setProgress: (p: number) => void;
};

export const useProjectStore = create<ProjectState>((set) => ({
  open: null,
  progress: 0,
  setOpen: (open) => set({ open, progress: 0 }),
  setProgress: (progress) => set({ progress }),
}));
