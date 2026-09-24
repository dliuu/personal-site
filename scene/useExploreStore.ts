import { create } from "zustand";

type ExploreState = {
  open: string | null;
  setOpen: (id: string | null) => void;
};

export const useExploreStore = create<ExploreState>((set) => ({
  open: null,
  setOpen: (open) => set({ open }),
}));
