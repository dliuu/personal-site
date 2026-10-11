"use client";

import dynamic from "next/dynamic";

const Instruments = dynamic(() => import("@/instruments"), { ssr: false });

export default function Site() {
  return <Instruments />;
}
