import { create } from "zustand";

type RoomState = {
  hoveredProject: string | null;
  openProject: string | null;
  lampOn: boolean;
  introDone: boolean;
  setHovered: (slug: string | null) => void;
  setOpen: (slug: string | null) => void;
  setLampOn: (b: boolean) => void;
  setIntroDone: (b: boolean) => void;
  reset: () => void;
};

const initial = {
  hoveredProject: null,
  openProject: null,
  lampOn: false,
  introDone: false,
};

export const useRoomStore = create<RoomState>((set) => ({
  ...initial,
  setHovered: (hoveredProject) => set({ hoveredProject }),
  setOpen: (openProject) => set({ openProject, hoveredProject: null }),
  setLampOn: (lampOn) => set({ lampOn }),
  setIntroDone: (introDone) => set({ introDone }),
  reset: () => set(initial),
}));
