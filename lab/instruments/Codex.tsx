"use client";

import { useCallback, useRef } from "react";
import { useSectionProgress } from "@/hooks/useSectionProgress";
import { useSectionsStore } from "@/store/useSectionsStore";
import { chapters } from "./chapters";
import { links, posts, profile, projects } from "./content";
import { fell, script, ui } from "./fonts";

const noJump = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (e.currentTarget.getAttribute("href") === "#") e.preventDefault();
};

function ConstructionLines() {
  return (
    <svg
      className="instruments-lines"
      viewBox="0 0 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <rect x="150" y="150" width="700" height="700" />
      <circle cx="500" cy="500" r="350" />
      <line x1="150" y1="150" x2="850" y2="850" />
      <line x1="850" y1="150" x2="150" y2="850" />
      <line x1="500" y1="0" x2="500" y2="1000" />
      <line x1="0" y1="500" x2="1000" y2="500" />
      <circle cx="500" cy="500" r="120" />
    </svg>
  );
}

function Body({ id }: { id: string }) {
  switch (id) {
    case "intro":
      return (
        <>
          <h1 className="instruments-title">{profile.name}</h1>
          <p className="instruments-lede">{profile.line}</p>
          <p className="instruments-hint">Scroll to turn the page</p>
        </>
      );
    case "work":
      return (
        <>
          <h2 className="instruments-title">Work</h2>
          <ol className="instruments-list">
            {projects.map((p, i) => (
              <li key={p.slug}>
                <span className="instruments-num">
                  {["i", "ii", "iii", "iv"][i]}.
                </span>
                <a href={p.url} onClick={noJump}>
                  {p.title}
                </a>
                <p>{p.blurb}</p>
              </li>
            ))}
          </ol>
        </>
      );
    case "writing":
      return (
        <>
          <h2 className="instruments-title">Writing</h2>
          <ul className="instruments-list">
            {posts.map((p) => (
              <li key={p.slug}>
                <span className="instruments-num">{p.date}</span>
                <a href="#" onClick={noJump}>
                  {p.title}
                </a>
                <p>{p.summary}</p>
              </li>
            ))}
          </ul>
        </>
      );
    default:
      return (
        <>
          <h2 className="instruments-title">Contact</h2>
          <ul className="instruments-list instruments-links">
            {links.map((l) => (
              <li key={l.label}>
                <a href={l.href} onClick={noJump}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </>
      );
  }
}

export function Codex() {
  const els = useRef<(HTMLElement | null)[]>([]);
  const getEls = useCallback(
    () => els.current.filter((e): e is HTMLElement => e !== null),
    [],
  );
  useSectionProgress(getEls);
  const active = useSectionsStore((s) => s.active);

  return (
    <div
      className={`instruments ${fell.variable} ${script.variable} ${ui.variable}`}
    >
      <ConstructionLines />
      <nav className="instruments-nav" aria-label="Chapters">
        {chapters.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className={i === active ? "is-active" : undefined}
          >
            <span className="instruments-numeral">{c.numeral}</span> {c.title}
          </a>
        ))}
      </nav>
      <main>
        {chapters.map((c, i) => (
          <section
            key={c.id}
            id={c.id}
            className="instruments-section"
            ref={(el) => {
              els.current[i] = el;
            }}
          >
            <div className="instruments-col">
              <div className="instruments-chapter">Chapter {c.numeral}</div>
              <Body id={c.id} />
            </div>
            <aside className="instruments-note" aria-hidden>
              {c.note}
            </aside>
          </section>
        ))}
      </main>
    </div>
  );
}
