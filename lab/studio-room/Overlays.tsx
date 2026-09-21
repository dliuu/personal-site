"use client";

import { useEffect } from "react";
import type { MouseEvent } from "react";
import { Overlay } from "@/components/Overlay";
import { useLabStore } from "@/store/useLabStore";
import { links, posts, profile, projects } from "./content";
import { useRoomStore } from "./useRoomStore";

const h = { margin: "0 0 6px", fontSize: 22 } as const;
const p = { margin: 0, color: "var(--muted)", lineHeight: 1.5 } as const;
const list = { listStyle: "none", padding: 0, margin: "12px 0 0" } as const;

const noJump = (e: MouseEvent<HTMLAnchorElement>) => {
  if (e.currentTarget.getAttribute("href") === "#") e.preventDefault();
};

function Intro({ visible }: { visible: boolean }) {
  return (
    <Overlay visible={visible} side="left">
      <h1 style={{ ...h, fontSize: 28 }}>{profile.name}</h1>
      <p style={p}>{profile.line}</p>
      <p style={{ ...p, marginTop: 16, fontSize: 13 }}>
        Scroll to look around ↓
      </p>
    </Overlay>
  );
}

function Work({ visible }: { visible: boolean }) {
  const hovered = useRoomStore((s) => s.hoveredProject);
  const setHovered = useRoomStore((s) => s.setHovered);
  const setOpen = useRoomStore((s) => s.setOpen);
  return (
    <Overlay visible={visible} side="right">
      <h2 style={h}>Work</h2>
      <p style={p}>Things on the desk and shelf. Hover or click one.</p>
      <ul style={list}>
        {projects.map((pr) => (
          <li
            key={pr.slug}
            style={{ padding: "8px 0", borderTop: "1px solid #333" }}
          >
            <button
              type="button"
              onMouseEnter={() => setHovered(pr.slug)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(pr.slug)}
              onBlur={() => setHovered(null)}
              onClick={() => setOpen(pr.slug)}
              style={{
                background: "none",
                border: 0,
                padding: 0,
                font: "inherit",
                cursor: "pointer",
                color: hovered === pr.slug ? "var(--accent)" : "var(--fg)",
                fontWeight: 600,
              }}
            >
              {pr.title}
            </button>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

function Writing({ visible }: { visible: boolean }) {
  return (
    <Overlay visible={visible} side="left">
      <h2 style={h}>Writing</h2>
      <ul style={list}>
        {posts.map((po) => (
          <li
            key={po.slug}
            style={{ padding: "8px 0", borderTop: "1px solid #333" }}
          >
            <a href="#" onClick={noJump} style={{ fontWeight: 600 }}>
              {po.title}
            </a>
            <div style={{ ...p, fontSize: 13 }}>
              {po.date} · {po.summary}
            </div>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

function Contact({ visible }: { visible: boolean }) {
  return (
    <Overlay visible={visible} side="right">
      <h2 style={h}>Contact</h2>
      <ul style={list}>
        {links.map((l) => (
          <li key={l.label} style={{ padding: "6px 0" }}>
            <a href={l.href} onClick={noJump}>
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </Overlay>
  );
}

function ProjectPanel() {
  const open = useRoomStore((s) => s.openProject);
  const setOpen = useRoomStore((s) => s.setOpen);
  const project = projects.find((pr) => pr.slug === open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <Overlay visible={Boolean(project)} side="left">
      {project ? (
        <>
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close"
            style={{
              background: "none",
              border: 0,
              padding: 0,
              font: "inherit",
              cursor: "pointer",
              float: "right",
              color: "var(--muted)",
            }}
          >
            ✕
          </button>
          <h2 style={h}>{project.title}</h2>
          <p style={p}>{project.blurb}</p>
          <p style={{ marginTop: 12 }}>
            <a href={project.url} onClick={noJump}>
              Open project →
            </a>
          </p>
        </>
      ) : null}
    </Overlay>
  );
}

export function Overlays() {
  const active = useLabStore((s) => s.activeSection);
  const open = useRoomStore((s) => s.openProject);
  const show = (i: number) => active === i && !open;
  return (
    <>
      <Intro visible={show(0)} />
      <Work visible={show(1)} />
      <Writing visible={show(2)} />
      <Contact visible={show(3)} />
      <ProjectPanel />
    </>
  );
}
