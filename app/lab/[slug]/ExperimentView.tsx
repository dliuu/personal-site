"use client";

import Link from "next/link";
import { loaders } from "@/lab/loaders";

export function ExperimentView({ slug }: { slug: string }) {
  const Experiment = loaders[slug];
  if (!Experiment) return null;
  return (
    <>
      <Link
        href="/lab"
        style={{
          position: "fixed",
          bottom: 12,
          left: 12,
          zIndex: 20,
          padding: "6px 10px",
          background: "var(--panel)",
          borderRadius: 6,
          textDecoration: "none",
          fontSize: 14,
        }}
      >
        ← Lab
      </Link>
      <Experiment />
    </>
  );
}
