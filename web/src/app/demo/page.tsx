import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demo | Quorum",
  description:
    "A fixed sample-case replay with fictional, clearly labelled data. No real messages are used.",
};

/**
 * /demo: fixed sample-case replay. Fictional and clearly labelled.
 */
export default function DemoPage() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-primary)] px-5 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16">
      <div className="grain-overlay" aria-hidden="true" />
      <div className="mx-auto max-w-[860px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
          SAMPLE CASE REPLAY
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-[var(--text-primary)]">
          CASE 0047 / THE WEEKEND FLAT
        </h1>
        <div className="mt-6 border border-[var(--border-default)] bg-[var(--warning)]/10 p-4">
          <p className="font-mono text-[10px] uppercase leading-[1.7] tracking-[0.12em] text-[var(--text-primary)]">
            FICTIONAL SAMPLE DATA. EVERY NAME, MESSAGE, AND VERDICT BELOW WAS
            WRITTEN FOR THIS REPLAY. NO REAL CONVERSATION IS SHOWN.
          </p>
        </div>

        <ol className="mt-12 flex flex-col gap-3">
          {REPLAY.map((step, i) => (
            <li
              key={step.meta}
              className="border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 md:p-6"
            >
              <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <span>
                  {step.meta}
                </span>
                <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--accent)]">
                  STEP {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="mt-4 max-w-[58ch] font-body text-base leading-[1.5] text-[var(--text-primary)] md:text-lg">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 border-t border-[var(--border-subtle)] pt-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]">
            FINAL VERDICT
          </p>
          <p className="mt-2 font-display text-5xl font-semibold leading-none tracking-[-0.04em] text-[var(--accent)] md:text-6xl">
            PAUSE
          </p>
          <p className="mt-4 max-w-[58ch] font-body text-base leading-[1.55] text-[var(--text-secondary)]">
            The account changed on the day of the request and one member knew the
            seller by a different name. The strongest evidence supports waiting.
            The strongest doubt is the unverified account. This is a review, not
            financial advice.
          </p>
          <a
            href="/"
            className="mt-8 inline-flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] px-5 py-3 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-primary)] transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            BACK TO THE CASE FILE
          </a>
        </div>
      </div>
    </main>
  );
}

const REPLAY = [
  {
    meta: "MAYA / REQUEST",
    body: "Flats are booked. Can you send the deposit now? The hold expires in ten minutes.",
  },
  {
    meta: "QUORUM / INTAKE",
    body: "Case 0047 opened. I need one thing before review: the account name on the transfer.",
  },
  {
    meta: "MAYA / REPLY",
    body: "It is under HL Estates, not the usual one. They changed banks this week.",
  },
  {
    meta: "QUORUM / EVIDENCE",
    body: "Exhibit A: the message text, quoted. Exhibit B: the new account name differs from the one Maya used in March. Exhibit C: nobody in this chat has paid this account before.",
  },
  {
    meta: "JON / OBJECTION",
    body: "Object. I paid HL Estates in March and the account was different then too. They have never used the same account twice.",
  },
  {
    meta: "PRIYA / UNKNOWN",
    body: "Not sure. I have only met Maya through this chat.",
  },
  {
    meta: "QUORUM / RULING",
    body: "Pause. Two pieces of evidence conflict: the story of a bank change is possible, but the pattern of changing accounts is also a known scam pattern. Ask Maya for the booking confirmation on a channel you already trust, then pay only if it matches.",
  },
] as const;
