"use client";

import type { ReactNode } from "react";

export function Overlay({
  visible,
  side = "left",
  children,
}: {
  visible: boolean;
  side?: "left" | "right";
  children: ReactNode;
}) {
  return (
    <div
      inert={!visible}
      aria-hidden={!visible}
      style={{
        position: "fixed",
        top: "50%",
        [side]: 24,
        transform: "translateY(-50%)",
        width: "min(360px, calc(100vw - 48px))",
        padding: 20,
        background: "var(--panel)",
        backdropFilter: "blur(10px)",
        borderRadius: 12,
        zIndex: 10,
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {children}
    </div>
  );
}
