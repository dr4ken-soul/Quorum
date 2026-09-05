"use client";

import { motion, useReducedMotion } from "motion/react";

/** Section 4: What Counts as Proof, asymmetric bento grid. */
const CELLS = [
  {
    span: "md:col-span-7 md:row-span-2",
    label: "MESSAGE",
    value: "WHAT WAS ACTUALLY ASKED",
    note: "The original message stays separate from the agent summary.",
  },
  {
    span: "md:col-span-5",
    label: "LINK",
    value: "WHERE DOES IT LEAD",
    note: "A shortened destination is not the same as a verified seller.",
  },
  {
    span: "md:col-span-5",
    label: "IMAGE",
    value: "WHAT DOES THE SCREENSHOT PROVE",
    note: "A screenshot can support a claim and still be incomplete.",
  },
  {
    span: "md:col-span-4",
    label: "CONTEXT",
    value: "DOES THE STORY LINE UP",
    note: "Earlier conversation can expose a changed account or story.",
  },
  {
    span: "md:col-span-4",
    label: "TESTIMONY",
    value: "WHO KNOWS THIS FIRST-HAND",
    note: "A vote without a reason is context, not proof.",
  },
  {
    span: "md:col-span-4",
    label: "GAPS",
    value: "WHAT IS STILL MISSING",
    note: "Missing evidence can be the most important exhibit.",
  },
] as const;

export default function Proof() {
  const reduce = useReducedMotion();
  return (
    <section
      id="proof"
      data-section="proof"
      data-density="dense"
      className="relative z-10 bg-[var(--bg-primary)] py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 lg:px-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
          EXHIBITS
        </p>
        <h2 className="mt-4 max-w-[11ch] font-display text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-[var(--text-primary)]">
          SHOW YOUR WORK
        </h2>
      </div>
      <div className="mx-auto mt-14 grid max-w-[1440px] grid-cols-1 gap-3 px-5 md:mt-20 md:grid-cols-12 md:gap-4 md:px-10 lg:px-16">
        {CELLS.map((cell, i) => (
          <motion.div
            key={cell.label}
            className={`relative min-h-[190px] overflow-hidden border border-[var(--border-default)] bg-[var(--bg-surface)] p-5 transition-colors duration-300 hover:border-[var(--accent)] md:p-7 ${cell.span}`}
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0, y: 22 },
                  whileInView: { opacity: 1, y: 0 },
                  transition: {
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1] as const,
                    delay: Math.min(i * 0.12, 0.48),
                  },
                  viewport: { once: false, amount: 0.1 },
                })}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
              {cell.label}
            </p>
            <p className="mt-8 max-w-[18ch] font-display text-2xl font-medium leading-[0.95] tracking-[-0.03em] text-[var(--text-primary)] md:text-3xl">
              {cell.value}
            </p>
            <p className="absolute bottom-5 left-5 max-w-[30ch] font-body text-xs leading-[1.5] text-[var(--text-secondary)] md:bottom-7 md:left-7">
              {cell.note}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
