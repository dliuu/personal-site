"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export const loaders: Record<string, ComponentType> = {
  "hello-cube": dynamic(() => import("./hello-cube"), { ssr: false }),
  "scroll-path": dynamic(() => import("./scroll-path"), { ssr: false }),
  "lighting-bench": dynamic(() => import("./lighting-bench"), { ssr: false }),
  chapters: dynamic(() => import("./chapters"), { ssr: false }),
  instruments: dynamic(() => import("./instruments"), { ssr: false }),
};
