# Quorum - Build Guide

This guide sequences implementation after the product and frontend specifications. It does not replace `APP_BLUEPRINT.md` or `FRONTEND_SPEC.md`.

## Build rules

- Build the real Photon iMessage path before polishing the web surface
- Do not fabricate evidence checks or participant votes
- Keep payment execution outside the product
- Keep secrets in the agent runtime only
- Use British English and no em dashes
- Do not add a logo or brand symbol without approval
- Use the sample case only on `/demo`, clearly labelled as a replay

## Phase 0: Confirm integration

1. Confirm the current Photon agent creation, iMessage routing, tool, memory, and deployment APIs.
2. Record the exact SDK and service versions in the README.
3. Send one real inbound message and capture the minimal event shape.
4. Confirm how Photon identifies a participant and how deletion requests are handled.
5. Decide whether the first evidence adapter is URL inspection or image inspection.

Do not implement undocumented endpoints based on assumptions.

## Phase 1: Case intake

1. Create the case state machine.
2. Accept text, images, URLs, and mixed messages.
3. Extract claim fields and preserve observed text separately from interpretation.
4. Reply with a case opening and one missing-information question when needed.
5. Add malformed input, empty input, and oversized attachment handling.

Exit condition: a real iMessage message creates a case and returns a useful response.

## Phase 2: Evidence packet

1. Implement one typed evidence adapter.
2. Store exhibit status, source, timestamp, fact, and confidence.
3. Add source failure and unavailable states.
4. Render the top three exhibits in the conversation.
5. Ensure the agent never presents an inferred fact as observed.

Exit condition: a case contains at least two linked exhibits or explicitly reports why fewer were available.

## Phase 3: Group Chat Court

1. Implement case opening and closing commands.
2. Parse `VOUCH`, `OBJECT`, and `UNKNOWN`.
3. Record testimonies without treating votes as proof.
4. Add a deliberation timeout.
5. Make the agent's humour disappear from safety-critical wording.

Exit condition: two participants can respond in a real group conversation and the transcript remains understandable.

## Phase 4: Verdict and receipt

1. Restrict outcomes to `PAY`, `PAUSE`, and `WALK AWAY`.
2. Add confidence bands and unresolved risk.
3. Add `SHOW WORK`, `REOPEN CASE`, and `CLOSE CASE`.
4. Generate the compact case receipt.
5. Add deletion and expiry behaviour.

Exit condition: every verdict has evidence, uncertainty, next action, and the decision-support disclaimer.

## Phase 5: Web presentation

1. Implement the approved palette and fonts from `FRONTEND_SPEC.md`.
2. Build the text-only navigation and responsive progress rail.
3. Build the hero chat portal with fictional content.
4. Build the GSAP pinned SVG trial sequence.
5. Add the proof grid, court transcript, rules tabs, use-case track, limits, ruling, and footer.
6. Add `/demo` as a clearly labelled replay.

Exit condition: the public page remains understandable with JavaScript motion disabled.

## Phase 6: Quality audit

- Test real Photon messages, not only local fixtures
- Test screenshots with unreadable text
- Test links that fail or redirect
- Test conflicting testimony
- Test no participants in a group case
- Test deletion during an active case
- Test an agent restart during deliberation
- Test mobile Safari and reduced motion
- Confirm no message body or secret appears in logs
- Confirm no unapproved brand mark is present

## Submission package

- Public repository
- `README.md`
- `APP_BLUEPRINT.md`
- `FRONTEND_SPEC.md`
- `CLAUDE.md`
- `MARKETING.md`
- `docs/001_initial.sql`
- `ROUTES.md`
- Working Photon iMessage demo
- Short demo video
- Honest developer feedback and limitations
