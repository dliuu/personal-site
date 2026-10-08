import { create } from "zustand";
import type { Tier } from "@/lib/quality";

type DeviceState = {
  tier: Tier;
  reducedMotion: boolean;
  setTier: (t: Tier) => void;
  setReducedMotion: (b: boolean) => void;
};

export const useDeviceStore = create<DeviceState>((set) => ({
  tier: "high",
  reducedMotion: false,
  setTier: (tier) => set({ tier }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
