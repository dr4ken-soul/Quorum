# Quorum - Agent Context

## What this project is

Quorum is a Photon-powered iMessage agent that reviews payment requests before a person sends money. It extracts the claim, checks available evidence, invites structured group testimony, and returns `PAY`, `PAUSE`, or `WALK AWAY`.

The product is presented as Group Chat Court. The humour is in the courtroom framing. The safety conclusion remains direct and cautious.

## Current status

- Design gates: all confirmed
- Aesthetic: kinetic editorial
- Navigation: scroll-progress navigation
- Motion: SVG shape morphing on scroll with GSAP pinned scroll
- Fonts: Fraunces, DM Sans, IBM Plex Mono
- Palette: cool paper, ink, and vermilion
- Product name: Quorum is provisional
- Application code: not yet implemented

## Source documents

- `APP_BLUEPRINT.md` owns product scope, agent behaviour, architecture, data model, and MVP acceptance criteria
- `FRONTEND_SPEC.md` owns exact web layout, copy, classes, animation values, z-index values, and assets
- `BUILD_GUIDE.md` owns implementation sequence and quality audit
- `ROUTES.md` owns the planned URL surface
- `docs/001_initial.sql` owns the initial relational schema proposal
- `NAMING.md` owns the unresolved name decision

## Non-negotiable safety rules

- Never guarantee that a payment is safe
- Never fabricate evidence, participant votes, or sources
- Never auto-pay or access a bank account
- Never contact an external person without explicit consent
- Never expose private message context to the group by default
- Always identify missing evidence
- Prefer `PAUSE` over unsupported confidence
- Keep secrets out of the browser and logs

## Frontend rules

- Use Tailwind classes and the variables in `FRONTEND_SPEC.md`
- Use `motion/react` for entrances
- Use GSAP only for the approved pinned SVG sequence
- Make scroll entrances repeatable
- Support reduced motion
- Use inline SVG only for approved interface icons
- Do not add logos, mascots, shields, gavels, scales, or brand symbols
- Use `min-h-[100dvh]`, not `h-screen`
- Keep semantic z-index values
- Use skeletons rather than spinners

## Writing rules

- British English
- No em dashes
- Short, factual copy
- No filler claims
- Humour can frame the case but cannot obscure risk

## Development order

Confirm Photon APIs, build the real message path, implement intake and one evidence adapter, add group deliberation, add the bounded verdict, then build the public presentation.
