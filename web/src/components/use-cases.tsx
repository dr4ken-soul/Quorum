"use client";

/** Section 7: Where It Helps, horizontal scroll showcase. */
const CARDS = [
  {
    index: "01 / MARKETPLACE",
    body: "The seller changes the payment account at the last minute.",
  },
  {
    index: "02 / TICKETS",
    body: "The screenshot looks official. The event details do not match.",
  },
  {
    index: "03 / RENTAL",
    body: "The deposit is urgent. The address and owner story conflict.",
  },
  {
    index: "04 / FREELANCE",
    body: "The client wants work before a deposit. The thread needs a record.",
  },
] as const;

export default function UseCases() {
  return (
    <section
      id="use-cases"
      data-section="use-cases"
      data-density="sparse"
      className="relative z-10 overflow-hidden bg-[var(--bg-secondary)] py-24 md:py-32"
    >
      <div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 md:flex-row md:items-end md:justify-between md:px-10 lg:px-16">
        <h2 className="max-w-[10ch] font-display text-[clamp(3rem,6vw,6rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]">
          BEFORE THE TRANSFER
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
          DRAG TO INSPECT / SWIPE ON MOBILE
        </p>
      </div>
      <div className="hide-scrollbar mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-5 md:mt-16 md:px-10 lg:px-16">
        {CARDS.map((card) => (
          <article
            key={card.index}
            className="min-w-[78vw] snap-start border border-[var(--border-default)] bg-[var(--bg-elevated)] p-6 md:min-w-[420px] md:p-8"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]">
              {card.index}
            </p>
            <p className="mt-16 max-w-[9ch] font-display text-4xl font-medium leading-[0.9] tracking-[-0.04em] text-[var(--text-primary)] md:mt-24 md:text-5xl">
              {card.body}
            </p>
            <p className="mt-12 border-t border-[var(--border-subtle)] pt-4 font-body text-sm leading-[1.5] text-[var(--text-secondary)] md:mt-16">
              Start with the message. Keep the final call human.
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
