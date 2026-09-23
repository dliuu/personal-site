"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSectionProgress } from "@/hooks/useSectionProgress";
import { useSectionsStore } from "@/store/useSectionsStore";
import { useRoomStore } from "./useRoomStore";
import { beatAt } from "@/lib/beats";
import { overlayOpacity } from "@/lib/introTimeline";
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
          className={`instruments-caption${i === beat ? " is-active" : ""}${b.at ? " is-anchored" : ""}`}
          aria-hidden={i !== beat}
        >
          <span className="instruments-caption-num">
            {["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"][i]}
          </span>
          <span className="instruments-caption-sub">{b.sub}</span>
          <p>{b.caption}</p>
        </div>
      ))}
    </div>
  );
}

function RoomControls() {
  const duskMode = useRoomStore((s) => s.duskMode);
  const soundOn = useRoomStore((s) => s.soundOn);
  const curtainsOpen = useRoomStore((s) => s.curtainsOpen);
  const toggleDusk = useRoomStore((s) => s.toggleDusk);
  const toggleSound = useRoomStore((s) => s.toggleSound);
  const toggleCurtains = useRoomStore((s) => s.toggleCurtains);
  return (
    <div className="instruments-room-controls" role="group" aria-label="Room">
      <button type="button" aria-pressed={duskMode} onClick={toggleDusk}>
        Dusk
      </button>
      <button type="button" aria-pressed={soundOn} onClick={toggleSound}>
        {soundOn ? "♪ Sound" : "Sound"}
      </button>
      <button
        type="button"
        aria-pressed={curtainsOpen}
        onClick={toggleCurtains}
      >
        Curtains
      </button>
    </div>
  );
}

/** Names whatever the pointer is over in the room, following the pointer. */
function RoomTooltip() {
  const hover = useRoomStore((s) => s.hover);
  const pinned = useRoomStore((s) => s.pinned);
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (el.current)
        el.current.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  const show = hover ?? (pinned ? { label: "a note", note: pinned } : null);
  return (
    <>
      <div
        ref={el}
        className={`instruments-tooltip${show ? " is-shown" : ""}`}
        aria-hidden
      >
        {show ? (
          <>
            <span className="instruments-tooltip-label">{show.label}</span>
            {show.note ? (
              <span className="instruments-tooltip-note">{show.note}</span>
            ) : null}
          </>
        ) : null}
      </div>
      <div className="instruments-sr" aria-live="polite">
        {show ? `${show.label}${show.note ? `: ${show.note}` : ""}` : ""}
      </div>
    </>
  );
}

function IntroOverlay({ sectionIndex }: { sectionIndex: number }) {
  // Quantised so the overlay re-renders a handful of times across its fade.
  const opacity = useSectionsStore((s) =>
    s.active === sectionIndex
      ? Math.round(overlayOpacity(s.progress) * 20) / 20
      : s.active < sectionIndex
        ? 1
        : 0,
  );
  return (
    <div className="instruments-intro" style={{ opacity }} aria-hidden>
      <h1 className="instruments-title">{profile.name}</h1>
      <p className="instruments-lede">{profile.line}</p>
      <p className="instruments-hint">Scroll</p>
      <RoomControls />
      <RoomTooltip />
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
  const activeChapter = sections[active]?.chapter ?? 0;
  const pal = chapters[activeChapter].palette;

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
          if (s.kind === "plate" && chapters[s.chapter].scene) {
            const c = chapters[s.chapter];
            return (
              <section
                key={s.id}
                id={s.id}
                data-kind="plate"
                data-scene={c.scene}
                className="instruments-plate instruments-scene"
                style={{ minHeight: "400vh" }}
                aria-label={`${profile.name}. ${profile.line}`}
                ref={(el) => {
                  els.current[i] = el;
                }}
              >
                <IntroOverlay sectionIndex={i} />
              </section>
            );
          }
          if (s.kind === "plate") {
            const c = chapters[s.chapter];
            return (
              <section
                key={s.id}
                id={s.id}
                data-kind="plate"
                data-beats={c.plate?.beats.length ?? 0}
                className="instruments-plate"
                style={{ minHeight: `${(c.plate?.beats.length ?? 0) * 90}vh` }}
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
