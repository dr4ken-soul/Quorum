# Quorum

Quorum is a Photon-powered iMessage agent that puts payment requests through a small group-chat court before money moves.

Forward a request, screenshot, or link. Quorum extracts the claim, collects evidence, invites objections, and returns a bounded outcome:

- `PAY`: the available evidence is consistent enough to proceed at the user's discretion
- `PAUSE`: important evidence is missing or contradictory
- `WALK AWAY`: strong warning signs remain

Quorum is decision support, not a guarantee. It never moves money.

## What is in this repository

- `app/` — the agent: a TypeScript/Node implementation of the group-chat court (case lifecycle, claim extraction, evidence adapters, verdict policy, receipts, retention and deletion) with 31 passing tests
- `web/` — the public site: a Next.js 15 kinetic editorial landing page built to `FRONTEND_SPEC.md` (all routes build and prerender statically)
- `APP_BLUEPRINT.md`, `FRONTEND_SPEC.md`, `BUILD_GUIDE.md`, `ROUTES.md`, `MARKETING.md`, `NAMING.md`, `CLAUDE.md`, `DESIGN_DECISIONS.md` — the specification documents the build follows
- `docs/001_initial.sql` — initial data model proposal

## The agent (`app/`)

Runs directly on Node 24 using native TypeScript type stripping (no build step). Sources live in `app/src`, tests in `app/test`.

```bash
cd app
npm install              # dev dependencies only (typescript for type checking)
npm test                 # 31 tests: court, verdict, extraction, commands, store, webhook, logger
npm run typecheck        # tsc --noEmit
npm run demo             # console replay, scenario "clear": clean request → PAUSE, then PAY after vouches
npm run scenario -- suspicious  # console replay: mismatched story → WALK AWAY after objections
```

Key design points:

- Case lifecycle: `open → deliberating → ruled → closed`, with reopen on new testimony or "put this on trial" after a ruling (reopening clears exhibits so evidence is never double-counted)
- Evidence adapters: message claim, link inspection, image inspection (hashes only), context consistency, participant testimony; each exhibit records whether it is `applicable` — evidence types with nothing to inspect are logged honestly but never count against a verdict
- Verdicts come with a signed case receipt and can be replayed with `show work`
- Retention: message bodies expire after 30 days; any participant can request deletion, which removes content first and leaves a ledger proof that deletion ran
- Logging redacts message bodies, attachments, and secret-like fields before anything is written

### Photon integration

Photon (Spectrum) is the messaging bridge: <https://photon.codes>. Quorum is fully wired for it, and the free live path needs **no hosting at all** — Photon does not host your code; it connects your locally-running agent to iMessage.

- **Go live for $0 (recommended)** — run the SDK loop from your laptop with the Free plan (iMessage: unlimited daily messages, ≤10 users). In `app/.env` set your `PROJECT_ID` / `PROJECT_SECRET` from <https://app.photon.codes>, then:
  ```bash
  cd app
  npm run server        # "Quorum connected to Photon (Spectrum) - listening for iMessage."
  ```
  This uses `PhotonTransport` (`app/src/transport/photon.ts`): a long-lived `spectrum-ts` stream (`for await (const [space, message] of app.messages)`) that receives inbound iMessages, runs them through the court, and replies via `space.send(...)`. Redeliveries are deduped on `message.id`, handler errors never kill the stream, and Ctrl+C shuts down cleanly. No public URL, no tunnel, no webhook.
- **Webhook mode (optional, not needed)** — `WebhookTransport` (`app/src/transport/webhook.ts`) is the alternative when you want an HTTP-hosted deployment: `POST /spectrum-webhook` with `X-Spectrum-Signature: v0=<hmac>` verification, replay window, and at-least-once dedupe. It requires a public HTTPS URL (Railway/Render/tunnel) and the one-time `SPECTRUM_SIGNING_SECRET` Photon shows when you register the endpoint. Leave `SPECTRUM_SIGNING_SECRET` blank for the SDK-loop path; a made-up value would make the server reject every real delivery.
- **Supabase (optional)** — the court state can live in Supabase's free Postgres instead of local SQLite: set `DATABASE_URL` to the connection pooler string (Supabase → Project Settings → Database, port 6543), e.g. `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres`. `PgStore` (`app/src/domain/pg-store.ts`) is selected automatically for `postgres://`/`postgresql://` URLs and creates all tables on first use — nothing to run by hand. SQLite stays the default for local runs and tests.

Until credentials exist, the agent runs in local console mode (`LocalConsoleTransport`), and the demos replay the full court arc offline.

## The site (`web/`)

Next.js 15 + Tailwind CSS 4 + motion + GSAP, per `FRONTEND_SPEC.md` and `ROUTES.md`.

```bash
cd web
npm install
npm run dev     # local development
npm run build   # production build; all routes prerender statically
```

Routes: `/` (landing), `/demo` (labelled fictional sample-case replay), `/docs` (agent manual), `/privacy` (retention and deletion policy).

Motion notes: standard reveals use `motion/react` with `whileInView`; the pinned "trial" section uses GSAP ScrollTrigger on `lg+` screens only, and every animated section has a reduced-motion and small-screen fallback.

## Demo

The planned demo (see `MARKETING.md`) is realised as console replays in `app/src/dev/demo.ts`: a ticket seller sends an urgent transfer request with a confirmation screenshot; Quorum identifies mismatched event details, records a group objection, asks for independent verification, and returns `PAUSE` with a case receipt. The `/demo` route shows the same shape of case as a clearly labelled fictional replay.

## Important limitations

- A lack of evidence is not proof of fraud
- A group vote is not identity verification
- The agent cannot inspect private facts it has not been given
- Users must verify high-stakes requests through an independent channel
- The final payment decision remains human

## Name status

Quorum is a working name. See `NAMING.md` before public launch.
