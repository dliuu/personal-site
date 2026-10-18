/**
 * The frontispiece: the first screen. Static HTML in the codex's faces, an
 * opaque sheet over the canvas until it is scrolled away; nothing else is
 * fetched until it has painted (app/Site.tsx).
 */
export function Frontispiece() {
  return (
    <section id="frontispiece" className="frontispiece" aria-label="Welcome">
      <div className="frontispiece-col">
        <p className="frontispiece-head">Danny Liu</p>
        <h1 className="instruments-title frontispiece-title">
          Hi! I&rsquo;m Danny,
        </h1>
        <p className="instruments-lede frontispiece-lede">
          an AI/ML focused engineer based in New&nbsp;York. This is my
          portfolio.
        </p>
        <a className="frontispiece-hint" href="#intro-plate">
          <span>Scroll to experience</span>
          <svg
            className="frontispiece-arrow"
            viewBox="0 0 24 36"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M12 2v30M3 23l9 9 9-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </a>
      </div>
    </section>
  );
}
