"use client";

import { motion, useReducedMotion } from "motion/react";

/** Section 8: Trust and Limits, non-photographic safety panel. */
const ROWS = [
  { label: "SHOW SOURCES", detail: "every conclusion links to an exhibit" },
  { label: "NAME DOUBT", detail: "missing evidence remains in the ruling" },
  { label: "VERIFY OUTSIDE", detail: "urgent identity claims need another channel" },
  { label: "NO AUTO-PAY", detail: "the agent never moves money" },
] as const;

export default function Limits() {
  const reduce = useReducedMotion();
  return (
    <section
      id="limits"
      data-section="limits"
      data-density="sparse"
      className="relative z-10 py-28 md:py-40"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:px-10 lg:grid-cols-[0.44fr_0.56fr] lg:items-center lg:gap-20 lg:px-16">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
            THE LIMIT
          </p>
          <h2 className="mt-5 max-w-[9ch] font-display text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]">
            A SECOND OPINION IS NOT A GUARANTEE
          </h2>
          <p className="mt-6 max-w-[45ch] font-body text-base leading-[1.6] text-[var(--text-secondary)]">
            Quorum can organise evidence, expose contradictions, and ask for
            independent verification. It cannot know every private fact. The
            person sending the money remains responsible for the final decision.
          </p>
        </div>
        <motion.div
          className="border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 md:p-8"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, x: 24 },
                whileInView: { opacity: 1, x: 0 },
                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: 0.2 },
                viewport: { once: false, amount: 0.1 },
              })}
        >
          {ROWS.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[auto_1fr] gap-4 border-b border-[var(--border-subtle)] py-4 last:border-b-0"
            >
              <span className="mt-1 h-2 w-2 rounded-full bg-[var(--success)]" aria-hidden="true" />
              <p className="font-body text-base leading-[1.5] text-[var(--text-primary)]">
                <span className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--text-primary)]">
                  {row.label}
                </span>
                <span className="mt-1 block font-body text-sm leading-[1.5] text-[var(--text-secondary)]">
                  {row.detail}
                </span>
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
