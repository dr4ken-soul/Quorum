"use client";

import { motion, useReducedMotion } from "motion/react";

/** Section 5: Court in Session, stacked transcript reveal. */
const MESSAGES = [
  {
    meta: "AGENT / OPENING STATEMENT",
    body: "The request says urgent transfer. The account changed today. The court is now mildly interested.",
    chip: "CASE OPENED",
  },
  {
    meta: "MAYA / TESTIMONY",
    body: "I have bought from this seller before. This account is not the one I used.",
    chip: "VOUCH",
  },
  {
    meta: "JON / OBJECTION",
    body: "The receipt uses a different event name from the ticket listing.",
    chip: "OBJECT",
  },
  {
    meta: "AGENT / RESPONSE",
    body: "Objection noted. The screenshot is evidence of a screenshot.",
    chip: "EXHIBIT HELD",
  },
  {
    meta: "GROUP / VOTE",
    body: "VOUCH 1 / OBJECT 2 / UNKNOWN 1",
    chip: "TALLY",
  },
] as const;

export default function Court() {
  const reduce = useReducedMotion();
  return (
    <section
      id="court"
      data-section="court"
      data-density="sparse"
      className="relative z-10 overflow-hidden bg-[var(--bg-secondary)] py-28 md:py-40"
    >
      <div className="grain-overlay" aria-hidden="true" />
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 lg:px-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
          GROUP CHAT COURT
        </p>
        <h2 className="mt-4 max-w-[10ch] font-display text-[clamp(3rem,7vw,7rem)] font-semibold leading-[0.87] tracking-[-0.06em] text-[var(--text-primary)]">
          EVERYONE MAY OBJECT
        </h2>
      </div>
      <div className="mx-auto mt-14 grid max-w-[760px] gap-3 px-5 md:mt-20 md:px-10">
        {MESSAGES.map((message, i) => (
          <motion.div
            key={message.meta}
            className="relative border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-sm)] md:p-6"
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0, y: 28, rotate: -1.5 },
                  whileInView: { opacity: 1, y: 0, rotate: 0 },
                  transition: {
                    duration: 0.65,
                    ease: [0.16, 1, 0.3, 1] as const,
                    delay: Math.min(i * 0.14, 0.48),
                  },
                  viewport: { once: false, amount: 0.1 },
                })}
          >
            <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
              <span>{message.meta}</span>
              <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--accent)]">
                {message.chip}
              </span>
            </div>
            <p className="mt-4 max-w-[52ch] font-body text-base leading-[1.5] text-[var(--text-primary)] md:text-lg">
              {message.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
