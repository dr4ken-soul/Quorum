"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "open", label: "OPEN" },
  { id: "problem", label: "PROBLEM" },
  { id: "trial", label: "TRIAL" },
  { id: "proof", label: "PROOF" },
  { id: "court", label: "COURT" },
  { id: "rules", label: "RULES" },
  { id: "use-cases", label: "USE CASES" },
  { id: "limits", label: "LIMITS" },
  { id: "ruling", label: "RULING" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/**
 * Scroll-progress navigation: fixed wordmark, desktop progress rail with
 * section markers, and a mobile progress bar (FRONTEND_SPEC 3).
 */
export default function Navigation() {
  const [active, setActive] = useState<SectionId>("open");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const sections = SECTIONS.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => el !== null,
    );
    const onScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
      const probe = window.scrollY + window.innerHeight * 0.4;
      let current: SectionId = SECTIONS[0].id;
      for (const el of sections) {
        const match = SECTIONS.find((s) => s.id === el.id);
        if (match && el.offsetTop <= probe) current = match.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const activeLabel = SECTIONS.find((s) => s.id === active)?.label ?? "OPEN";

  return (
    <>
      {/* Desktop wordmark */}
      <div className="fixed top-5 left-5 z-50 md:top-7 md:left-10">
        <a
          href="#open"
          className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          Quorum
        </a>
      </div>

      {/* Desktop progress rail */}
      <nav
        aria-label="Section navigation"
        className="fixed inset-y-0 right-5 z-50 hidden w-20 items-center justify-center lg:flex pointer-events-none"
      >
        <div className="pointer-events-auto flex flex-col items-end gap-4">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={active === section.id ? "true" : undefined}
              className="group flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)] transition-colors duration-150 hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] aria-[current=true]:text-[var(--text-primary)]"
            >
              <span className="h-1.5 w-1.5 rounded-full border border-[var(--border-default)] bg-[var(--bg-primary)] transition-all duration-150 group-[aria-current=true]:h-2 group-[aria-current=true]:w-2 group-[aria-current=true]:border-[var(--accent)] group-[aria-current=true]:bg-[var(--accent)]" />
              {section.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Mobile progress bar */}
      <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-elevated)]/90 px-3 py-2 backdrop-blur-md lg:hidden">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]">
          <div
            className="h-full origin-left rounded-full bg-[var(--accent)] transition-transform duration-300"
            style={{ transform: `scaleX(${progress})` }}
          />
        </div>
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]">
          {activeLabel}
        </span>
      </div>
    </>
  );
}
