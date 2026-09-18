import { create } from "zustand";
import type { Tier } from "@/lib/quality";

type LabState = {
  rawProgress: number;
  activeSection: number;
  tier: Tier;
  reducedMotion: boolean;
  setRawProgress: (n: number) => void;
  setActiveSection: (n: number) => void;
  setTier: (t: Tier) => void;
  setReducedMotion: (b: boolean) => void;
};

export const useLabStore = create<LabState>((set) => ({
  rawProgress: 0,
  activeSection: 0,
  tier: "high",
  reducedMotion: false,
  setRawProgress: (rawProgress) => set({ rawProgress }),
  setActiveSection: (activeSection) => set({ activeSection }),
  setTier: (tier) => set({ tier }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
