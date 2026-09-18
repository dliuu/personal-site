import { describe, expect, it } from "vitest";
import { pickInitialTier } from "./quality";

describe("pickInitialTier", () => {
  it("is high on a desktop with plenty of cores and memory", () => {
    expect(pickInitialTier({ touch: false, cores: 8, memory: 16 })).toBe(
      "high",
    );
  });
  it("is low on touch-primary devices", () => {
    expect(pickInitialTier({ touch: true, cores: 8, memory: 8 })).toBe("low");
  });
  it("is low with 4 or fewer cores", () => {
    expect(pickInitialTier({ touch: false, cores: 4, memory: 16 })).toBe("low");
  });
  it("is low with 4 GB or less memory", () => {
    expect(pickInitialTier({ touch: false, cores: 8, memory: 4 })).toBe("low");
  });
  it("ignores missing signals", () => {
    expect(pickInitialTier({ touch: false })).toBe("high");
    expect(pickInitialTier({ touch: false, cores: undefined, memory: 2 })).toBe(
      "low",
    );
  });
});
