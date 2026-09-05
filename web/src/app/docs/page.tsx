import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs | Quorum",
  description: "Commands, evidence labels, and limitations for the Quorum agent.",
};

/** /docs: commands, evidence labels, and limitations. */
export default function DocsPage() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-primary)] px-5 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16">
      <div className="mx-auto max-w-[860px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
          FIELD MANUAL
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-[var(--text-primary)]">
          HOW TO ADDRESS THE COURT
        </h1>

        <section className="mt-12">
          <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            Commands
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {COMMANDS.map((command) => (
              <div
                key={command.keyword}
                className="grid gap-1 border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 md:grid-cols-[220px_1fr] md:gap-6"
              >
                <code className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  {command.keyword}
                </code>
                <p className="font-body text-sm leading-[1.55] text-[var(--text-secondary)]">
                  {command.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-[var(--border-subtle)] pt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            Evidence labels
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {EVIDENCE.map((item) => (
              <div
                key={item.label}
                className="grid gap-1 border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5 md:grid-cols-[220px_1fr] md:gap-6"
              >
                <span className="font-mono text-xs uppercase tracking-[0.12em] text-[var(--text-primary)]">
                  {item.label}
                </span>
                <p className="font-body text-sm leading-[1.55] text-[var(--text-secondary)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 border-t border-[var(--border-subtle)] pt-8">
          <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
            Limitations
          </h2>
          <ul className="mt-4 flex list-none flex-col gap-3">
            {LIMITS.map((limit) => (
              <li
                key={limit}
                className="border-l-2 border-[var(--accent)] pl-4 font-body text-base leading-[1.55] text-[var(--text-secondary)]"
              >
                {limit}
              </li>
            ))}
          </ul>
        </section>

        <a
          href="/"
          className="mt-12 inline-flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] px-5 py-3 font-mono text-xs font-medium uppercase tracking-[0.12em] text-[var(--text-primary)] transition-all duration-150 hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
        >
          BACK TO THE CASE FILE
        </a>
      </div>
    </main>
  );
}

const COMMANDS = [
  { keyword: "PUT THIS ON TRIAL", detail: "Open a group case for the latest payment request." },
  { keyword: "VOUCH [statement]", detail: "Testify that the request is legitimate, with your reason." },
  { keyword: "OBJECT [statement]", detail: "Testify against the request, with your reason." },
  { keyword: "NOT SURE", detail: "Record that you cannot verify the claim. Uncertainty counts as evidence." },
  { keyword: "SHOW WORK", detail: "List every exhibit, every vote, and the verdict receipt." },
  { keyword: "REOPEN CASE", detail: "Continue deliberation after a ruling when new evidence appears." },
  { keyword: "CLOSE CASE", detail: "Close the case and start the retention countdown." },
] as const;

const EVIDENCE = [
  { label: "SUPPORTING", detail: "The evidence is consistent with the request as stated." },
  { label: "CONFLICTING", detail: "The evidence contradicts the request as stated." },
  { label: "INCONCLUSIVE", detail: "The evidence was collected but does not settle the question." },
  { label: "UNAVAILABLE", detail: "The evidence could not be collected. It is named, never hidden." },
] as const;

const LIMITS = [
  "The agent never moves money and never asks for payment credentials.",
  "A verdict is a review, not financial advice, and not a guarantee.",
  "Urgent identity claims should be verified on a second channel.",
  "Missing evidence stays visible in the ruling instead of becoming confidence.",
  "The person sending the money remains responsible for the final decision.",
] as const;
