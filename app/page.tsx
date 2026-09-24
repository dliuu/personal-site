"use client";

import dynamic from "next/dynamic";

// `ssr: false` must live in a client module, and the scene is WebGL only.
const Scene = dynamic(() => import("@/scene"), { ssr: false });

export default function Home() {
  return <Scene />;
}
