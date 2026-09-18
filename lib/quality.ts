export type Tier = "high" | "low";

export type DeviceSignals = {
  touch: boolean;
  cores?: number;
  memory?: number;
};

export function pickInitialTier(signals: DeviceSignals): Tier {
  if (signals.touch) return "low";
  if (signals.cores !== undefined && signals.cores <= 4) return "low";
  if (signals.memory !== undefined && signals.memory <= 4) return "low";
  return "high";
}
