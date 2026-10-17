"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { browserGateEnv, firstScreenSettled } from "@/lib/gate";

/** How long the frontispiece may hold the rest of the site back. */
const GATE_TIMEOUT_MS = 2500;

// Nothing in the HTML references this chunk: its fetch starts when it renders.
const Instruments = dynamic(() => import("@/instruments"), { ssr: false });

/**
 * The frontispiece gate. The first screen is static HTML; the 3D codex (its
 * JavaScript, then its models and textures) is not asked for until that
 * screen has settled, and then mounts behind it, out of sight.
 */
export default function Site() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let on = true;
    firstScreenSettled(browserGateEnv(), GATE_TIMEOUT_MS).then(() => {
      if (on) setOpen(true);
    });
    return () => {
      on = false;
    };
  }, []);
  return open ? <Instruments /> : null;
}
