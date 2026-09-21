"use client";

import { useCallback, useRef } from "react";
import { useSectionProgress } from "@/hooks/useSectionProgress";
import { useSectionsStore } from "@/store/useSectionsStore";
import { beatAt } from "@/lib/beats";
import { chapters, sections, type Chapter } from "./chapters";
import { links, profile, roles, type Role } from "./content";
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

function RoleBody({ role }: { role: Role }) {
  return (
    <>
      <h2 className="instruments-title">
        {role.url ? (
          <a href={role.url} target="_blank" rel="noreferrer">
            {role.company}
          </a>
        ) : (
          role.company
        )}
      </h2>
      <p className="instruments-role">
        {role.location ? `${role.title} · ${role.location}` : role.title}
      </p>
      <p className="instruments-lede">{role.summary}</p>
      {role.bullets.length > 0 ? (
        <ul className="instruments-bullets">
          {role.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      ) : null}
      {role.skills.length > 0 ? (
        <p className="instruments-skills">{role.skills.join(" · ")}</p>
      ) : null}
    </>
  );
}

function Body({ id, role }: { id: Chapter["id"]; role?: Role }) {
  if (id === "intro") {
    return (
      <>
        <h1 className="instruments-title">{profile.name}</h1>
        <p className="instruments-lede">{profile.line}</p>
        <p className="instruments-hint">Scroll to turn the page</p>
      </>
    );
  }
  if (id === "contact") {
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
  return role ? <RoleBody role={role} /> : null;
}

function PlateCaptions({
  chapter,
  sectionIndex,
}: {
  chapter: Chapter;
  sectionIndex: number;
}) {
  const beats = chapter.plate?.beats ?? [];
  const beat = useSectionsStore((s) =>
    s.active === sectionIndex && s.kind === "plate"
      ? beatAt(s.progress, beats.length).index
      : -1,
  );
  return (
    <div className="instruments-captions" aria-live="polite">
      {beats.map((b, i) => (
        <div
          key={i}
          className={`instruments-caption${i === beat ? " is-active" : ""}`}
        >
          <span className="instruments-caption-num">
            {["i", "ii", "iii", "iv"][i]}
          </span>
          <span className="instruments-caption-sub">{b.sub}</span>
          <p>{b.caption}</p>
        </div>
      ))}
    </div>
  );
}

export function Codex() {
  const els = useRef<(HTMLElement | null)[]>([]);
  const getEls = useCallback(
    () => els.current.filter((e): e is HTMLElement => e !== null),
    [],
  );
  useSectionProgress(getEls);
  const active = useSectionsStore((s) => s.active);
  const pal = chapters[active]?.palette ?? chapters[0].palette;
  const activeChapter = sections[active]?.chapter ?? 0;

  return (
    <div
      className={`instruments ${fell.variable} ${script.variable} ${ui.variable}`}
      style={
        {
          "--paper": pal.paper,
          "--ink": pal.ink,
          "--gold": pal.accent,
        } as React.CSSProperties
      }
    >
      <ConstructionLines />
      <nav className="instruments-nav" aria-label="Chapters">
        {chapters.map((c, i) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className={i === activeChapter ? "is-active" : undefined}
          >
            <span className="instruments-numeral">{c.numeral}</span> {c.title}
          </a>
        ))}
      </nav>
      <main>
        {sections.map((s, i) => {
          if (s.kind === "plate") {
            const c = chapters[s.chapter];
            return (
              <section
                key={s.id}
                id={s.id}
                data-kind="plate"
                className="instruments-plate"
                ref={(el) => {
                  els.current[i] = el;
                }}
              >
                <PlateCaptions chapter={c} sectionIndex={i} />
              </section>
            );
          }
          const c = chapters[s.chapter];
          const role = roles.find((r) => r.id === c.id);
          return (
            <section
              key={s.id}
              id={c.id}
              className="instruments-section"
              ref={(el) => {
                els.current[i] = el;
              }}
            >
              <div className="instruments-col">
                <div className="instruments-chapter">
                  Chapter {c.numeral}
                  {role ? ` · ${role.dates}` : ""}
                </div>
                <Body id={c.id} role={role} />
              </div>
              <aside className="instruments-note" aria-hidden>
                {c.note}
              </aside>
            </section>
          );
        })}
      </main>
    </div>
  );
}
