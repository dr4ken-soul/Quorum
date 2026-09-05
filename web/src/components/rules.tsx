"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/** Section 6: The Agent's Rules, tabbed feature explorer. */
const TABS = [
  {
    id: "OBSERVED",
    title: "Say what is shown",
    copy: "Say exactly what the message, image, or link shows. Nothing more.",
  },
  {
    id: "INFERRED",
    title: "Mark the pattern",
    copy: "Mark a pattern as a pattern, not as a fact.",
  },
  {
    id: "UNKNOWN",
    title: "Keep doubt visible",
    copy: "Missing context stays visible instead of becoming confidence.",
  },
  {
    id: "HUMAN CALL",
    title: "The person decides",
    copy: "The agent recommends. The person decides.",
  },
] as const;

export default function Rules() {
  const [selected, setSelected] = useState<(typeof TABS)[number]["id"]>("OBSERVED");
  const reduce = useReducedMotion();
  const active = TABS.find((tab) => tab.id === selected) ?? TABS[0];

  return (
    <section
      id="rules"
      data-section="rules"
      data-density="dense"
      className="relative z-10 bg-[var(--bg-primary)] py-24 md:py-32"
    >
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:px-10 lg:grid-cols-[0.36fr_0.64fr] lg:gap-20 lg:px-16">
        <div>
          <h2 className="max-w-[9ch] font-display text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]">
            A RULING NEEDS RULES
          </h2>
          <div className="mt-8 flex flex-wrap gap-2 lg:mt-12 lg:flex-col lg:items-start" role="tablist" aria-label="Agent rules">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={selected === tab.id}
                aria-controls={`panel-${tab.id}`}
                onClick={() => setSelected(tab.id)}
                className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.13em] text-[var(--text-secondary)] transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] aria-[selected=true]:border-[var(--accent)] aria-[selected=true]:bg-[var(--accent-glow)] aria-[selected=true]:text-[var(--text-primary)]"
              >
                {tab.id}
              </button>
            ))}
          </div>
        </div>
        <div
          role="tabpanel"
          id={`panel-${active.id}`}
          aria-labelledby={`tab-${active.id}`}
          className="relative min-h-[360px] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 md:p-10"
        >
          <motion.div
            key={active.id}
            {...(reduce
              ? {}
              : {
                  initial: { opacity: 0, filter: "blur(8px)", y: 16 },
                  animate: { opacity: 1, filter: "blur(0px)", y: 0 },
                  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const, delay: 0 },
                })}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]">
              {active.id}
            </p>
            <h3 className="mt-5 max-w-[12ch] font-display text-4xl font-medium leading-[0.92] tracking-[-0.04em] text-[var(--text-primary)] md:text-6xl">
              {active.title}
            </h3>
            <p className="mt-5 max-w-[42ch] font-body text-base leading-[1.55] text-[var(--text-secondary)] md:text-lg">
              {active.copy}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
