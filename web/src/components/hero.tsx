"use client";

import { motion, useReducedMotion } from "motion/react";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Section 1: Hero, framed chat portal. Portal first on mobile. */
export default function Hero() {
  const reduce = useReducedMotion();
  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.7, ease: EASE, delay },
        };

  return (
    <section
      id="open"
      data-section="open"
      data-density="hero"
      className="relative min-h-[100dvh] overflow-hidden px-5 pb-16 pt-28 md:px-10 md:pb-20 md:pt-32 lg:px-16"
    >
      <div className="grain-overlay" aria-hidden="true" />
      <HeroAmbient />
      <div className="relative z-10 mx-auto grid min-h-[calc(100dvh-8rem)] w-full max-w-[1440px] grid-cols-1 items-center gap-12 md:gap-16 lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,1.12fr)] lg:gap-10">
        <div className="order-first lg:order-none">
          <motion.div
            className="relative z-20 mx-auto w-full max-w-[520px] lg:justify-self-end"
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0, y: 28, scale: 0.96 },
                  animate: { opacity: 1, y: 0, scale: 1 },
                  transition: { duration: 0.9, ease: EASE, delay: 0.45 },
                })}
          >
            <Portal />
          </motion.div>
        </div>
        <HeroCopy fade={fade} reduce={reduce} />
      </div>
    </section>
  );
}

function HeroAmbient() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 600 600"
      className="pointer-events-none absolute right-[-10%] top-[9%] z-0 h-[72%] w-[82%] opacity-[0.42] md:right-[-4%] md:h-[78%] md:w-[68%] lg:right-[2%] lg:top-[12%] lg:h-[80%] lg:w-[58%]"
    >
      <g fill="none" stroke="var(--accent)" strokeWidth="1.5" opacity="0.5">
        <circle cx="300" cy="300" r="240" />
        <circle cx="300" cy="300" r="160" />
        <path d="M 60 300 L 540 300" />
        <path d="M 300 60 L 300 540" />
      </g>
      <g stroke="var(--text-primary)" opacity="0.16" strokeWidth="1.5" fill="none">
        <path d="M 90 90 L 510 90 L 510 510 L 90 510 Z" />
      </g>
    </svg>
  );
}

function Portal() {
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]">
      <div className="m-1 rounded-[calc(var(--radius-2xl)-4px)] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 md:m-1.5 md:p-5">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
            COURTROOM / CASE 0047
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.13em] text-[var(--accent)]">
            IN REVIEW
          </span>
        </div>
        <div className="flex min-h-[390px] flex-col gap-3 py-5 md:min-h-[430px] md:py-6">
          <div className="max-w-[82%] self-start rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)] bg-[var(--bg-secondary)] px-3.5 py-3 font-body text-sm leading-[1.4] text-[var(--text-primary)]">
            Can you send the deposit now? The ticket expires in ten minutes.
          </div>
          <div className="max-w-[88%] self-end rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)] bg-[var(--text-primary)] px-3.5 py-3 font-body text-sm leading-[1.4] text-[var(--bg-primary)]">
            Objection. We have a claim, not proof. Opening the case.
          </div>
          <div className="flex items-center gap-3 border-y border-[var(--border-subtle)] py-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--accent)] font-mono text-[10px] text-[var(--accent)]">
              A
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
              EXHIBIT A / receipt screenshot
            </span>
          </div>
        </div>
        <div className="mt-auto border-t border-[var(--border-subtle)] pt-4">
          <div className="flex items-end justify-between gap-4">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
              VERDICT
            </span>
            <span className="font-display text-4xl font-semibold leading-none tracking-[-0.04em] text-[var(--accent)] md:text-5xl">
              PAUSE
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeroCopy({
  fade,
  reduce,
}: {
  fade: (delay: number) => Record<string, unknown>;
  reduce: boolean | null;
}) {
  void fade;
  void reduce;
  return (
    <div className="relative z-10 flex flex-col justify-center lg:pr-12">
      <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--accent)] md:text-xs">
        PRE-PAYMENT CASE FILE / OPEN A REVIEW
      </p>
      <h1 className="max-w-[8ch] font-display text-[clamp(3.75rem,10vw,8.5rem)] font-semibold leading-[0.86] tracking-[-0.055em] text-[var(--text-primary)]">
        LET THE CHAT PUT IT ON TRIAL
      </h1>
      <p className="mt-7 max-w-[44ch] font-body text-base leading-[1.55] text-[var(--text-secondary)] md:mt-8 md:text-lg">
        Forward a payment request. The agent collects the receipts, lets the
        group object, and tells you what is still unproven before your money
        moves.
      </p>
      <div className="mt-9 flex flex-wrap items-center gap-3 md:mt-10">
        <a
          href="/demo"
          className="group inline-flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-3 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--bg-elevated)] transition-all duration-150 hover:bg-[var(--accent-hover)] hover:shadow-[0_8px_24px_rgba(217,78,59,0.22)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] md:px-6 md:py-3.5"
        >
          CHECK A PAYMENT
        </a>
        <a
          href="#trial"
          className="inline-flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-transparent px-5 py-3 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-primary)] transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] md:px-6 md:py-3.5"
        >
          SEE THE VERDICT
        </a>
      </div>
    </div>
  );
}

