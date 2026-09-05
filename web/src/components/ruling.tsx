"use client";

import { motion, useReducedMotion } from "motion/react";

/** Section 9: Final Ruling, verdict poster composition. */
export default function Ruling() {
  const reduce = useReducedMotion();
  return (
    <section
      id="ruling"
      data-section="ruling"
      data-density="hero"
      className="relative z-10 overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--text-primary)] px-5 py-28 md:px-10 md:py-40 lg:px-16"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 600 600"
        className="pointer-events-none absolute right-[-8%] top-[-18%] z-0 h-[130%] w-[65%] opacity-[0.16] lg:w-[48%]"
      >
        <g fill="none" stroke="var(--accent)" strokeWidth="1.5">
          <circle cx="300" cy="300" r="250" />
          <circle cx="300" cy="300" r="170" />
          <path d="M 50 300 L 550 300" />
          <path d="M 300 50 L 300 550" />
        </g>
      </svg>
      <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-start">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
          THE RULING
        </p>
        <motion.h2
          className="mt-6 max-w-[10ch] font-display text-[clamp(3.5rem,9vw,9rem)] font-semibold leading-[0.84] tracking-[-0.06em] text-[var(--bg-primary)]"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, filter: "blur(12px)", y: 24 },
                whileInView: { opacity: 1, filter: "blur(0px)", y: 0 },
                transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as const, delay: 0 },
                viewport: { once: false, amount: 0.1 },
              })}
        >
          PAUSE BEFORE YOU PAY
        </motion.h2>
        <motion.p
          className="mt-7 max-w-[43ch] font-body text-base leading-[1.55] text-[var(--bg-secondary)] md:text-lg"
          {...(reduce
            ? {}
            : {
                initial: { opacity: 0, y: 16 },
                whileInView: { opacity: 1, y: 0 },
                transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay: 0.15 },
                viewport: { once: false, amount: 0.1 },
              })}
        >
          Send the request to the chat. Let the evidence speak before urgency does.
        </motion.p>
        <a
          href="/demo"
          className="group mt-10 inline-flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--accent)] px-6 py-3.5 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--bg-elevated)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[0_8px_24px_rgba(217,78,59,0.3)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          CHECK A PAYMENT
        </a>
      </div>
    </section>
  );
}
