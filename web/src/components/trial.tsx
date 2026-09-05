"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/**
 * Section 3: The Trial. GSAP pinned scroll with SVG shape morphing through
 * four states: claim, exhibits, deliberation, verdict. Disabled below lg and
 * under reduced motion, which get a static four-step diagram instead.
 */

const STATES = [
  {
    index: "01 CLAIM",
    label: "CLAIM RECEIVED",
    headline: "The request arrives",
    body: "A request arrives. The agent records what was actually said.",
  },
  {
    index: "02 EXHIBITS",
    label: "EXHIBITS ATTACHED",
    headline: "Evidence is separated",
    body: "The receipt, link, amount, and timing become separate exhibits.",
  },
  {
    index: "03 DELIBERATION",
    label: "OBJECTIONS OPEN",
    headline: "The group weighs in",
    body: "The group can vouch, object, or admit that nobody knows.",
  },
  {
    index: "04 VERDICT",
    label: "RULING READY",
    headline: "The ruling lands",
    body: "The ruling names the strongest evidence and the strongest doubt.",
  },
] as const;

/** Four compatible SVG paths with identical point counts for clean morphing. */
const MORPH_PATHS = [
  // Claim: a single open rectangle, the message as it arrived
  "M 180 260 L 1260 260 L 1260 640 L 180 640 Z",
  // Exhibits: split into separated panels
  "M 180 260 L 700 260 L 700 440 L 180 440 Z M 740 460 L 1260 460 L 1260 640 L 740 640 Z",
  // Deliberation: an offset stack, views crossing
  "M 200 280 L 1240 280 L 1240 600 L 200 600 Z M 260 320 L 1180 320 L 1180 560 L 260 560 Z",
  // Verdict: a focused stamp-like seal
  "M 540 260 L 900 260 L 900 640 L 540 640 Z M 620 340 L 820 340 L 820 560 L 620 560 Z",
];

export default function Trial() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);
  const pathRef = useRef<SVGPathElement | null>(null);
  const [progressState, setProgressState] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(query.matches && !reduced.matches);
    update();
    query.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      query.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let cleanup = () => {};
    let cancelled = false;
    void (async () => {
      const gsap = (await import("gsap")).default;
      const ScrollTrigger = (await import("gsap/ScrollTrigger")).default;
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const section = sectionRef.current;
      const path = pathRef.current;
      if (!section || !path) return;

      const morph = { value: 0 };
      const tween = gsap.to(morph, {
        value: 3,
        ease: "none",
        onUpdate: () => {
          const position = morph.value;
          setProgressState(position);
          const lower = Math.floor(position);
          const upper = Math.min(lower + 1, 3);
          const t = position - lower;
          // Attribute morph: interpolate between the two neighbouring paths.
          path.setAttribute(
            "d",
            interpolatePath(MORPH_PATHS[lower], MORPH_PATHS[upper], ease(t)),
          );
        },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=2600",
          scrub: 0.8,
          pin: true,
          anticipatePin: 1,
        },
      });
      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [enabled]);

  const activeState =
    enabled ? Math.min(3, Math.floor(progressState + 0.0001)) : -1;

  return (
    <section
      id="trial"
      data-section="trial"
      data-density="dense"
      data-pinned-trial=""
      ref={sectionRef}
      className="relative z-10 overflow-clip bg-[var(--bg-secondary)]"
    >
      <div className="grain-overlay" aria-hidden="true" />
      {enabled ? <PinnedStage activeState={activeState} pathRef={pathRef} /> : <StaticStack />}
    </section>
  );
}

function PinnedStage({
  activeState,
  pathRef,
}: {
  activeState: number;
  pathRef: React.RefObject<SVGPathElement | null>;
}) {
  return (
    <div className="relative min-h-[300vh] lg:block">
      <div className="relative flex min-h-[100dvh] items-center overflow-hidden px-5 py-20 md:px-10 lg:px-16">
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        >
          <g stroke="var(--text-primary)" opacity="0.16" strokeWidth="1.5" fill="none">
            <path d="M 0 225 L 1440 225" />
            <path d="M 0 450 L 1440 450" />
            <path d="M 0 675 L 1440 675" />
            <path d="M 360 0 L 360 900" />
            <path d="M 720 0 L 720 900" />
            <path d="M 1080 0 L 1080 900" />
          </g>
          <path
            ref={pathRef}
            d={MORPH_PATHS[0]}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            opacity="0.92"
          />
        </svg>

        <div className="relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 md:gap-16 lg:grid-cols-[0.42fr_0.58fr] lg:items-center lg:gap-20">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
              THE CASE MOVES
            </p>
            <h2 className="mt-5 max-w-[8ch] font-display text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]">
              FROM CLAIM TO RULING
            </h2>
            <div className="mt-8 flex flex-col gap-3 border-l border-[var(--border-default)] pl-4">
              {STATES.map((state, i) => (
                <span
                  key={state.index}
                  className={`flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors duration-300 ${
                    activeState === i ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {state.index}
                </span>
              ))}
            </div>
          </div>

          <motion.div
            className="relative z-20 rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-elevated)]/90 p-4 shadow-[var(--shadow-lg)] backdrop-blur-md md:p-6"
            initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
            whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0.1 }}
            viewport={{ once: false, amount: 0.1 }}
          >
            <div className="rounded-[calc(var(--radius-2xl)-6px)] border border-[var(--border-subtle)] p-5 md:p-7">
              {STATES.map((state, i) => (
                <StatePanel key={state.label} state={state} active={activeState === i} />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatePanel({
  state,
  active,
}: {
  state: (typeof STATES)[number];
  active: boolean;
}) {
  return (
    <div className={active ? "block" : "hidden"} aria-hidden={!active}>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
        {state.label}
      </p>
      <h3 className="mt-4 max-w-[12ch] font-display text-4xl font-semibold leading-[0.92] tracking-[-0.04em] text-[var(--text-primary)] md:text-6xl">
        {state.headline}
      </h3>
      <p className="mt-5 max-w-[42ch] font-body text-sm leading-[1.55] text-[var(--text-secondary)] md:text-base">
        {state.body}
      </p>
    </div>
  );
}

/** Mobile and reduced-motion fallback: four stacked cards, no pinning. */
function StaticStack() {
  return (
    <div className="relative z-10 mx-auto max-w-[1440px] px-5 py-24 md:px-10 lg:px-16">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
        THE CASE MOVES
      </p>
      <h2 className="mt-5 max-w-[8ch] font-display text-[clamp(3rem,7vw,6.5rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]">
        FROM CLAIM TO RULING
      </h2>
      <div className="mt-12 grid gap-3 md:grid-cols-2">
        {STATES.map((state, i) => (
          <motion.div
            key={state.index}
            className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 md:p-7"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay: i * 0.12 }}
            viewport={{ once: false, amount: 0.1 }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              {state.label}
            </p>
            <h3 className="mt-4 max-w-[12ch] font-display text-3xl font-semibold leading-[0.92] tracking-[-0.04em] text-[var(--text-primary)]">
              {state.headline}
            </h3>
            <p className="mt-5 max-w-[42ch] font-body text-sm leading-[1.55] text-[var(--text-secondary)] md:text-base">
              {state.body}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Linear interpolation between two SVG path strings with matching structure. */
function interpolatePath(from: string, to: string, t: number): string {
  if (t <= 0) return from;
  if (t >= 1) return to;
  const fromNums = from.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const toNums = to.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  // Path structures differ in subpath count; blend numerically only when they match.
  if (fromNums.length !== toNums.length) return t < 0.5 ? from : to;
  const template = from.replace(/-?\d+(?:\.\d+)?/g, "{}");
  let i = 0;
  return template.replace(/\{\}/g, () => {
    const value = fromNums[i] + (toNums[i] - fromNums[i]) * t;
    i += 1;
    return String(Math.round(value));
  });
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}
