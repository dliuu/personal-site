"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSectionProgress } from "@/hooks/useSectionProgress";
import { useSectionsStore } from "@/store/useSectionsStore";
import { useRoomStore } from "./useRoomStore";
import { beatAt } from "@/lib/beats";
import { greetOpacity, overlayOpacity } from "@/lib/introTimeline";
import { chapters, sections, type Chapter } from "./chapters";
import {
  links,
  profile,
  projects,
  roles,
  type Project,
  type Role,
} from "./content";
import { scrub } from "@/lib/folio";
import { useProjectStore } from "./useProjectStore";
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

const NUMERALS = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"];

/** A hairline emblem per card: a cabin in its year, candles with the run's line, a mill wheel, a framed screen. */
function Emblem({ kind }: { kind: Project["emblem"] }) {
  return (
    <svg className="instruments-folio-emblem" viewBox="0 0 44 44" aria-hidden>
      {kind === "cabin" ? (
        <>
          <circle cx="22" cy="24" r="17" strokeDasharray="2 2" />
          <path d="M12 23 L22 13 L32 23 V33 H12 Z" />
          <rect x="19" y="26" width="6" height="7" />
          <line x1="27" y1="14" x2="27" y2="19" />
        </>
      ) : kind === "candles" ? (
        <>
          {[10, 18, 26, 34].map((x, i) => (
            <g key={x}>
              <line x1={x} y1={8 + i * 2} x2={x} y2={36 - i * 2} />
              <rect x={x - 2.5} y={14 + i * 3} width="5" height={10 - i} />
            </g>
          ))}
          <polyline points="6,30 14,26 22,27 30,20 38,16" />
        </>
      ) : kind === "mill" ? (
        <>
          <circle cx="22" cy="22" r="14" />
          <circle cx="22" cy="22" r="4" />
          <line x1="22" y1="8" x2="22" y2="36" />
          <line x1="8" y1="22" x2="36" y2="22" />
          <line x1="12" y1="12" x2="32" y2="32" />
          <line x1="32" y1="12" x2="12" y2="32" />
        </>
      ) : (
        <>
          <rect x="6" y="9" width="32" height="22" rx="1" />
          <line x1="6" y1="15" x2="38" y2="15" />
          <line x1="22" y1="31" x2="22" y2="37" />
          <line x1="14" y1="37" x2="30" y2="37" />
        </>
      )}
    </svg>
  );
}

/** The folio: one card per project; opening one is a click, not a scroll. The open project reads on the right; the column keeps the list and gains a back button. */
function ProjectsBody() {
  const open = useProjectStore((s) => s.open);
  const setOpen = useProjectStore((s) => s.setOpen);
  const project = projects.find((p) => p.id === open) ?? null;
  return (
    <>
      {project ? (
        <button
          type="button"
          className="instruments-back"
          onClick={() => setOpen(null)}
        >
          <span aria-hidden>←</span> Back to projects
        </button>
      ) : null}
      <h2
        className={`instruments-title${project ? " instruments-title-open" : ""}`}
      >
        {project ? project.title : "Projects"}
      </h2>
      <p className="instruments-lede">
        {project
          ? project.line
          : "A plate for every build. Open one to read it."}
      </p>
      <p className="instruments-hint">
        {project
          ? "Scroll to read the plate · Esc to go back"
          : "Click a plate to open it"}
      </p>
      <ul className="instruments-folio">
        {projects.map((p, i) => (
          <li key={p.id}>
            <button
              type="button"
              className={`instruments-folio-card${p.id === open ? " is-open" : ""}`}
              aria-pressed={p.id === open}
              onClick={() => setOpen(p.id === open ? null : p.id)}
            >
              <span className="instruments-caption-num">{NUMERALS[i]}</span>
              <span className="instruments-folio-title">{p.title}</span>
              <span className="instruments-folio-line">{p.line}</span>
              <Emblem kind={p.emblem} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * The open project's reading: its docked captions and step buttons beside
 * the plate on the right. The page is locked while it is open; the wheel,
 * arrows and touch scrub its beats, Escape goes back.
 */
function ProjectOverlay() {
  const open = useProjectStore((s) => s.open);
  const setOpen = useProjectStore((s) => s.setOpen);
  const setProgress = useProjectStore((s) => s.setProgress);
  const project = projects.find((p) => p.id === open) ?? null;
  const beat = useProjectStore((s) =>
    project ? beatAt(s.progress, project.beats.length).index : -1,
  );
  const step = (dir: 1 | -1) => {
    if (!project) return;
    const n = project.beats.length;
    const next = Math.min(n - 1, Math.max(0, beat + dir));
    // Land 60 % into the beat, past the travel, so its card is up.
    setProgress((next + 0.6) / n);
  };
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const move = (dy: number) =>
      setProgress(scrub(useProjectStore.getState().progress, dy));
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      move(e.deltaY);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowDown" || e.key === "ArrowRight") move(400);
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") move(-400);
    };
    let lastY: number | null = null;
    const touchStart = (e: TouchEvent) => {
      lastY = e.touches[0]?.clientY ?? null;
    };
    const touchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY;
      if (y === undefined || lastY === null) return;
      e.preventDefault();
      move((lastY - y) * 2);
      lastY = y;
    };
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", key);
    window.addEventListener("touchstart", touchStart, { passive: true });
    window.addEventListener("touchmove", touchMove, { passive: false });
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", key);
      window.removeEventListener("touchstart", touchStart);
      window.removeEventListener("touchmove", touchMove);
    };
  }, [open, setOpen, setProgress]);
  return (
    <div
      className={`instruments-project${project ? " is-open" : ""}`}
      aria-hidden={!project}
    >
      {project ? (
        <>
          <div className="instruments-project-captions" aria-live="polite">
            {project.beats.map((b, i) => (
              <div
                key={i}
                className={`instruments-caption${i === beat ? " is-active" : ""}${b.at ? " is-anchored" : ""}`}
                aria-hidden={i !== beat}
              >
                <span className="instruments-caption-num">{NUMERALS[i]}</span>
                <span className="instruments-caption-sub">{b.sub}</span>
                <p>{b.caption}</p>
                {i < project.beats.length - 1 ? (
                  <span className="instruments-continue">
                    Scroll to continue <span aria-hidden>↓</span>
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <div
            className="instruments-project-steps"
            role="group"
            aria-label="Beats"
          >
            <button type="button" onClick={() => step(-1)} disabled={beat <= 0}>
              ← Previous
            </button>
            <span>
              {beat + 1} / {project.beats.length}
            </span>
            <button
              type="button"
              onClick={() => step(1)}
              disabled={beat >= project.beats.length - 1}
            >
              Next →
            </button>
            <button type="button" onClick={() => setOpen(null)}>
              Back
            </button>
          </div>
        </>
      ) : null}
    </div>
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
  if (id === "projects") return <ProjectsBody />;
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
  const soundOn = useRoomStore((s) => s.soundOn);
  const curtainsOpen = useRoomStore((s) => s.curtainsOpen);
  const toggleSound = useRoomStore((s) => s.toggleSound);
  const toggleCurtains = useRoomStore((s) => s.toggleCurtains);
  return (
    <div className="instruments-room-controls" role="group" aria-label="Room">
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

/** What he says once he has turned round to face you. */
function IntroGreeting({ sectionIndex }: { sectionIndex: number }) {
  const opacity = useSectionsStore((s) =>
    s.active === sectionIndex
      ? Math.round(greetOpacity(s.progress) * 20) / 20
      : 0,
  );
  return (
    <p
      className="instruments-greeting"
      style={{ opacity }}
      aria-hidden={opacity === 0}
    >
      Hi, I&rsquo;m Danny. Welcome to my portfolio.
    </p>
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
  const openProject = useProjectStore((s) => s.open);

  return (
    <div
      className={`instruments ${fell.variable} ${script.variable} ${ui.variable}${openProject ? " is-project-open" : ""}`}
      style={
        {
          "--paper": pal.paper,
          "--ink": pal.ink,
          "--gold": pal.accent,
        } as React.CSSProperties
      }
    >
      <ConstructionLines />
      <ProjectOverlay />
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
                <IntroGreeting sectionIndex={i} />
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
