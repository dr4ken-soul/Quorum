import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy | Quorum",
  description: "Retention, deletion, and data use for the Quorum agent.",
};

/** /privacy: retention, deletion, and data-use explanation. */
export default function PrivacyPage() {
  return (
    <main className="min-h-[100dvh] bg-[var(--bg-primary)] px-5 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16">
      <div className="mx-auto max-w-[760px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs">
          DATA POLICY
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.9] tracking-[-0.05em] text-[var(--text-primary)]">
          WHAT THE COURT KEEPS
        </h1>

        <div className="mt-12 flex flex-col gap-10">
          <Section title="What is stored">
            <p>
              When a case is opened, Quorum stores the messages you forward to
              it, the exhibits it collects, participant votes, and the verdict.
              Message text is kept so the group can ask to see the work behind a
              ruling. Attachments are stored as hashes only in this build; the
              image itself is never kept.
            </p>
          </Section>

          <Section title="How long it is kept">
            <p>
              Message bodies expire thirty days after they are received. Case
              records without message text remain until deletion is requested.
              Closing a case starts the retention countdown; it does not delete
              anything on its own.
            </p>
          </Section>

          <Section title="Deletion">
            <p>
              Any participant can request deletion of a case. Deletion removes
              message text, exhibits, testimony, and verdicts first. The case ID
              remains in a ledger entry as proof the deletion ran. After
              deletion, the case cannot be reopened or replayed.
            </p>
          </Section>

          <Section title="What is never collected">
            <p>
              Quorum does not read your wider chat history. It only sees what is
              forwarded into a case. It does not store contacts, location, or
              payment credentials. It never moves money and never asks for a
              card, bank login, or one-time passcode.
            </p>
          </Section>

          <Section title="Who sees a case">
            <p>
              Case content stays within the conversation that opened it. The
              public web surface shows fictional sample data only. No real case
              content appears anywhere on this site.
            </p>
          </Section>

          <Section title="Where it runs">
            <p>
              The agent runs on the Photon platform inside your iMessage
              conversation. This build ships with a local demo console and a
              webhook boundary; the Photon transport is the integration seam and
              is documented in the repository.
            </p>
          </Section>
        </div>

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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-[var(--border-subtle)] pt-6">
      <h2 className="font-mono text-xs uppercase tracking-[0.16em] text-[var(--accent)]">
        {title}
      </h2>
      <p className="mt-3 max-w-[62ch] font-body text-base leading-[1.6] text-[var(--text-secondary)]">
        {children}
      </p>
    </section>
  );
}
