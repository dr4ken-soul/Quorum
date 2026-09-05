/** Footer. */
export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--border-subtle)] bg-[var(--bg-primary)] px-5 py-10 md:px-10 md:py-12 lg:px-16">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-primary)]">
            Quorum
          </p>
          <p className="mt-3 max-w-[38ch] font-body text-xs leading-[1.5] text-[var(--text-muted)]">
            A Photon-powered iMessage agent for the moment before money moves.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
          <a
            href="/demo"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            Demo
          </a>
          <a
            href="/docs"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            Docs
          </a>
          <a
            href="/privacy"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            Privacy
          </a>
          <a
            href="https://github.com/dr4ken-soul/Quorum"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)] transition-colors duration-150 hover:text-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
          >
            GitHub
          </a>
        </nav>
      </div>
      <div className="mt-8 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)] md:flex-row md:justify-between">
        <span>Decision support, not a guarantee</span>
        <span>Built on Photon</span>
      </div>
    </footer>
  );
}
