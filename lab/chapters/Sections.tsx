"use client";

import { useCallback, useRef } from "react";
import { chapters } from "./chapters";
import { links, posts, profile, projects } from "./content";
import { body, display } from "./fonts";
import { useChaptersStore } from "./useChaptersStore";
import { useSectionProgress } from "./useSectionProgress";

const noJump = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (e.currentTarget.getAttribute("href") === "#") e.preventDefault();
};

function Body({ id }: { id: string }) {
  switch (id) {
    case "intro":
      return (
        <>
          <h1 className="chapters-title">{profile.name}</h1>
          <p className="chapters-lede">{profile.line}</p>
          <p className="chapters-hint">Scroll ↓</p>
        </>
      );
    case "work":
      return (
        <>
          <h2 className="chapters-title">Work</h2>
          <ol className="chapters-list">
            {projects.map((p, i) => (
              <li key={p.slug}>
                <span className="chapters-num">
                  {String(i + 1).padStart(2, "0")}
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
          <h2 className="chapters-title">Writing</h2>
          <ul className="chapters-list">
            {posts.map((p) => (
              <li key={p.slug}>
                <span className="chapters-num">{p.date}</span>
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
          <h2 className="chapters-title">Contact</h2>
          <ul className="chapters-list chapters-links">
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

export function Sections() {
  const els = useRef<(HTMLElement | null)[]>([]);
  const getEls = useCallback(
    () => els.current.filter((e): e is HTMLElement => e !== null),
    [],
  );
  useSectionProgress(getEls);
  const active = useChaptersStore((s) => s.active);

  return (
    <div className={`chapters ${display.variable} ${body.variable}`}>
      <nav className="chapters-nav" aria-label="Chapters">
        {chapters.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className={i === active ? "is-active" : undefined}
          >
            {c.title}
          </a>
        ))}
      </nav>
      <main>
        {chapters.map((c, i) => (
          <section
            key={c.id}
            id={c.id}
            className="chapters-section"
            ref={(el) => {
              els.current[i] = el;
            }}
          >
            <div className="chapters-col">
              <Body id={c.id} />
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
