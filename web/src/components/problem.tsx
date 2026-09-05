"use client";

import { motion, useReducedMotion } from "motion/react";

/** Section 2: The Problem, full-width statement. */
export default function Problem() {
  const reduce = useReducedMotion();
  return (
    <section
      id="problem"
      data-section="problem"
      data-density="sparse"
      className="relative z-10 border-y border-[var(--border-subtle)] py-28 md:py-40"
    >
      <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center px-5 text-center md:px-10 lg:px-16">
        <p className="mb-7 font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
          THE CHARGE
        </p>
        <motion.h2
          className="max-w-[15ch] font-display text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--text-primary)]"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, filter: "blur(10px)", y: 22 },
                whileInView: { opacity: 1, filter: "blur(0px)", y: 0 },
                transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] as const, delay: 0 },
                viewport: { once: false, amount: 0.1 },
              })}
        >
          A CONVINCING REQUEST CAN STILL BE A TRAP
        </motion.h2>
        <motion.p
          className="mt-8 max-w-[58ch] font-mono text-[10px] uppercase leading-[1.7] tracking-[0.12em] text-[var(--text-muted)] md:text-xs"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, y: 14 },
                whileInView: { opacity: 1, y: 0 },
                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: 0.15 },
                viewport: { once: false, amount: 0.1 },
              })}
        >
          URGENCY IS A CLAIM. A SCREENSHOT IS A CLAIM. A FAMILIAR NAME IS A CLAIM.
        </motion.p>
      </div>
    </section>
  );
}
