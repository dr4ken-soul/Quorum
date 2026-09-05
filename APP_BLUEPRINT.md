# Quorum - App Blueprint

## Document status

- Working name: Quorum
- Name status: provisional pending final single-word naming approval
- Product type: Photon-powered iMessage agent
- Presentation style: Group Chat Court
- Build status: specification complete, implementation not started
- Primary language: British English

## Product summary

Quorum helps a person decide whether to pay when a request arrives through a message, screenshot, marketplace listing, ticket transfer, rental conversation, or freelance thread.

The user forwards the request to the Photon agent. The agent extracts the claim, checks the available evidence, identifies contradictions, and convenes a structured court inside the existing group conversation. People can respond with a short testimony, a source, or a vote. The agent returns one of three bounded outcomes:

- PAY: evidence is consistent enough for the user to proceed at their own discretion
- PAUSE: important evidence is missing or contradictory
- WALK AWAY: the request contains strong fraud or manipulation signals

Quorum is a decision aid. It never guarantees safety, moves money, impersonates a person, or auto-approves a payment.

## One-line pitch

Forward a payment request to Quorum and let the group chat put it on trial before your money moves.

## Product principles

1. The smallest useful interaction starts with one forwarded message.
2. Every conclusion must point to evidence or state that evidence is missing.
3. Uncertainty is a valid result and must be visible.
4. The group chat is the interface, not a dashboard people must learn first.
5. The human makes the final decision.
6. Personal attachments and phone identities are minimised and retained only as long as needed.
7. The agent must be useful even when only one person participates.

## Target users

### Primary user

People who receive payment requests through messaging and need a fast second opinion before sending money.

### High-value situations

- Marketplace purchases from unfamiliar sellers
- Ticket and event transfers
- Deposits for rooms, cars, equipment, or services
- Freelance deposits and milestone payments
- Urgent requests from a compromised or spoofed contact
- Requests containing shortened URLs, QR codes, or screenshots of invoices

### Secondary audience

- Families and friends who act as informal trusted reviewers
- Community moderators and group administrators
- Small operators who need a lightweight payment-request review trail
- Hackathon judges evaluating useful agent behaviour inside iMessage

## Why this wins attention

Most assistants answer the sender. Quorum changes the social role of the thread. It creates a visible, funny, evidence-led process that people understand immediately:

`CLAIM -> EXHIBITS -> OBJECTIONS -> DELIBERATION -> VERDICT`

The interaction is inherently demoable. A single suspicious screenshot can produce extraction, cross-checking, group participation, and a bounded verdict in one conversation.

## Competitive framing

| Alternative | Strength | Gap Quorum addresses |
|---|---|---|
| Asking a friend manually | Human context | No structured evidence trail or consistent process |
| Generic AI chat | Fast answers | Usually lacks group participation and proof-linked reasoning |
| Reverse image or URL tools | Narrow checks | Does not combine evidence with social context |
| Scam-report databases | Useful history | Cannot judge the specific conversation or missing evidence |
| Bank fraud controls | Transaction protection | Often act after the user has initiated payment |

Quorum is not positioned as a replacement for bank security. It is a pre-payment deliberation layer that works before the irreversible action.

## Market validation plan

The first validation question is not whether people like the court framing. It is whether they will forward a payment request before paying.

Run five short tests with people who have recently bought through a marketplace, transferred a ticket, paid a deposit, or received an urgent request from a known contact:

1. Show a realistic payment request and ask what they would check first.
2. Show the one-message intake and measure whether the next action is obvious.
3. Show a sample exhibit list and ask which evidence changes their decision.
4. Show the three bounded verdicts and test whether `PAUSE` is understood.
5. Ask whether they would invite one trusted group for a live review.

Success signals:

- At least four of five users understand the first action without explanation
- At least three users identify missing evidence as useful information
- At least three users prefer a case receipt over an unstructured AI answer
- No user believes the product guarantees that a payment is safe

## Monetisation direction

Monetisation is post-MVP. The first public version should optimise for trust and repeated use, not payment collection.

Possible directions:

- Free personal reviews with a paid retention and case-history tier
- Family or community plan with shared trusted groups
- Small-business plan with exportable case receipts and retention controls
- White-label agent tools for marketplaces that want a pre-payment review layer

Do not add subscriptions, payment credentials, or billing to the hackathon build.

## Distribution plan

- Make the sample case replay linkable and understandable without an account
- Let a user share a redacted case receipt after a review
- Use the courtroom opening line as a short social video hook
- Seed the demo with marketplace, ticket, rental, and freelance scenarios
- Invite trusted reviewers through the existing group thread rather than a new network
- Publish the Photon-specific integration notes as part of the build story

## MVP scope

### Feature 1: Forward-to-case intake

User story: As a person considering a payment, I want to forward the request to the agent so I can begin a review without filling out a form.

Acceptance criteria:

- Accepts text, image attachments, links, and mixed messages
- Creates a case identifier
- Extracts payee, amount, requested action, deadline, URL, and stated reason when present
- Asks one focused follow-up question when a missing field materially affects the review
- Confirms that no payment has been initiated by the agent

Complexity: medium

### Feature 2: Evidence packet

User story: As a reviewer, I want each conclusion to have a visible exhibit so I can judge the reasoning myself.

Acceptance criteria:

- Stores a compact exhibit record for each check
- Labels evidence as supporting, conflicting, unavailable, or inconclusive
- Includes source, timestamp, extracted fact, and confidence band
- Preserves the original user claim separately from the agent interpretation
- Redacts unnecessary personal information in the group-facing summary

Complexity: high

### Feature 3: Group Chat Court

User story: As a group member, I want to submit a testimony or vote with one short reply so the agent can use trusted context.

Acceptance criteria:

- Agent posts a case opening with a neutral charge and known facts
- Participants can reply with `VOUCH`, `OBJECT`, `UNKNOWN`, or free-form testimony
- Every vote records the participant identity available to Photon and a timestamp
- The agent distinguishes first-hand testimony from a vote without evidence
- The agent closes deliberation after a configurable time or an explicit close command

Complexity: high

### Feature 4: Bounded verdict

User story: As the person who may pay, I want a concise ruling that states what is known, what is missing, and what to do next.

Acceptance criteria:

- Verdict is exactly one of `PAY`, `PAUSE`, or `WALK AWAY`
- Verdict includes confidence as low, medium, or high
- Verdict links to the top three exhibits in the thread
- Verdict states the strongest unresolved risk
- Agent refuses to label an uncertain case as safe
- User can request `SHOW WORK`, `REOPEN CASE`, or `CLOSE CASE`

Complexity: medium

### Feature 5: Case receipt

User story: As a user, I want a compact receipt I can save or forward so I remember why I paused or proceeded.

Acceptance criteria:

- Receipt contains case ID, date, verdict, confidence, evidence summary, and participant count
- Receipt contains no hidden model reasoning or unnecessary private data
- Receipt can be rendered as a text block in iMessage
- The user can request deletion of the case data
- Receipt clearly says it is decision support, not a guarantee

Complexity: medium

## Explicitly outside MVP

- Automatic payment execution
- Bank account or card access
- Identity verification or KYC
- A universal scam probability score
- Public user reputation scores
- Background monitoring of every conversation
- Voice calls or audio analysis
- A separate social network
- A mandatory mobile or web dashboard
- Legal advice or binding dispute resolution
- Use of a bank, marketplace, or messaging brand mark without permission

## Product workflow

### Flow A: Single-person review

1. User forwards a payment request to the agent.
2. Agent creates a case and extracts the claim.
3. Agent checks the supplied URL, image, sender wording, amount, and timing.
4. Agent asks one missing-information question if required.
5. Agent returns a bounded verdict and case receipt.

### Flow B: Group review

1. User adds or mentions the agent in a trusted group chat.
2. User forwards the request and writes `PUT THIS ON TRIAL`.
3. Agent posts the case opening and evidence list.
4. Participants respond with a testimony, `VOUCH`, `OBJECT`, or `UNKNOWN`.
5. Agent separates evidence from opinion.
6. Agent posts the verdict and the strongest reason.
7. User replies `SHOW WORK`, `REOPEN CASE`, or `CLOSE CASE`.

### Flow C: Urgent impersonation request

1. User forwards a message that appears to come from a known contact.
2. Agent compares language, payment destination, urgency, and known context.
3. Agent asks the user to verify through an independent channel.
4. Agent returns `PAUSE` guidance rather than treating the familiar name as proof.

## Agent behaviour contract

The system prompt and tool policy must enforce the following:

- Never claim certainty from one signal
- Never invent a source, identity, transaction, or participant vote
- Never reveal private attachment contents beyond what is necessary for the case
- Never contact a third party outside the active conversation without explicit consent
- Never make a payment or instruct a user to bypass bank protections
- Always separate `observed`, `inferred`, and `reported by participant`
- Always state the strongest missing piece of evidence
- Prefer `PAUSE` over a false positive
- Use humour in framing and transitions, never in the final safety warning

## Technical architecture

| Layer | Choice | Reason |
|---|---|---|
| Agent runtime | Photon | Required platform and direct iMessage distribution surface |
| Message transport | Photon iMessage agent integration | Keeps the core workflow in the existing chat |
| Agent service | TypeScript on Node.js | Shared types across tools, API, and web demo |
| Web presentation | Next.js App Router, TypeScript | Landing page and optional case replay surface |
| Styling | Tailwind CSS | Exact utility classes can be specified and audited |
| Motion | motion/react for entrances, GSAP for the pinned scroll sequence | Matches the approved frontend gates |
| Evidence tools | Small typed adapters for URL, image, text, and context checks | Keeps the product composable rather than tied to one provider |
| OCR and extraction | Model vision capability exposed through Photon | Avoids a second user-facing upload flow |
| Database | Postgres in production, SQLite for a local demo | Cases, exhibits, votes, retention, and receipts need durable state |
| Attachment storage | Object storage with short retention | Keeps binary attachments outside relational rows |
| Hosting | Vercel for web, managed Node worker for agent service | Simple public demo path |
| Observability | Structured server logs with case IDs, no message bodies | Debuggability without logging sensitive content |

The exact Photon SDK, webhook, tool, and deployment names must be confirmed against the current Photon documentation during implementation. This blueprint intentionally defines product boundaries without inventing undocumented APIs.

## Proposed repository structure

```text
iMessage/
|-- app/                         # Photon agent and server runtime
|   |-- src/
|   |   |-- agent/               # prompts, commands, orchestration
|   |   |-- adapters/            # typed evidence checks
|   |   |-- cases/               # state machine and policy
|   |   |-- privacy/             # retention and redaction
|   |   `-- transport/           # Photon event translation
|   |-- test/
|   `-- package.json
|-- web/                         # Next.js public surface
|   |-- app/
|   |-- components/
|   |-- lib/
|   |-- styles/
|   `-- package.json
|-- docs/
|   `-- 001_initial.sql
|-- .env.example
|-- APP_BLUEPRINT.md
|-- BUILD_GUIDE.md
|-- CLAUDE.md
|-- FRONTEND_SPEC.md
|-- MARKETING.md
|-- NAMING.md
|-- README.md
`-- ROUTES.md
```

## Proposed service boundaries

| Boundary | Responsibility | Must not do |
|---|---|---|
| Intake | Translate Photon messages into case input | Decide the verdict |
| Evidence adapters | Produce typed exhibits | Hide unavailable results |
| Case policy | Enforce commands, retention, and state changes | Invent evidence |
| Deliberation | Collect testimony and votes | Treat a majority as proof |
| Verdict | Apply bounded outcome rules | Guarantee safety |
| Presentation | Render case state for web or iMessage | Log private message bodies |

## Proposed internal API surface

These names describe responsibilities and must be mapped to the actual Photon integration during implementation.

| Operation | Input | Output |
|---|---|---|
| `POST /cases` | forwarded message reference | case ID and opening response |
| `POST /cases/:id/evidence` | case ID and adapter input | exhibit record |
| `POST /cases/:id/testimonies` | participant ref, vote, statement | testimony record |
| `POST /cases/:id/commands` | case ID and command | updated case response |
| `GET /cases/:id/receipt` | case ID and authorised identity | redacted receipt |
| `DELETE /cases/:id` | case ID and authorised identity | deletion confirmation |

## Composable adapter contract

Each evidence adapter should expose the same conceptual shape:

```text
check(input) -> exhibit

exhibit:
  type
  status: supporting | conflicting | unavailable | inconclusive
  observed_fact
  source_label
  source_reference
  checked_at
  confidence: low | medium | high
  user_visible_summary
```

Initial adapters:

- `message-claim`: extracts what the sender is asking for
- `url-inspection`: checks destination, redirects, domain mismatch, and visible page claims
- `image-inspection`: extracts invoice, QR, account, amount, and altered-layout signals
- `context-consistency`: compares the request with earlier messages supplied to the case
- `participant-testimony`: records what a participant says and whether it is first-hand

## Data model

Core entities:

- `cases`: one payment review
- `case_messages`: messages and attachments explicitly included in a case
- `exhibits`: typed evidence results
- `participants`: conversation identities scoped to a case
- `testimonies`: participant statements and structured votes
- `verdicts`: bounded outcome and receipt data
- `retention_requests`: deletion and expiry events

Data minimisation:

- Store message body only when the case requires it and retention is active
- Store attachment hashes and derived facts separately from original binaries
- Never use phone numbers as public identifiers
- Never expose one participant's private message context to another participant without consent

## Screen and route map

### Public web surface

- `/`: kinetic editorial landing page and interactive case story
- `/demo`: guided replay using a fixed, clearly labelled sample case
- `/privacy`: retention, deletion, and data-use explanation
- `/docs`: agent commands, evidence labels, and limitations

### Optional authenticated surface

- `/app`: case index for the connected Photon identity
- `/app/cases/[caseId]`: case receipt and exhibit view
- `/app/settings`: retention and notification preferences

The web surface must never be required for the main iMessage workflow.

## Environment variables

See `.env.example`. Secrets belong only in the server or agent runtime. No service key may be exposed through a `NEXT_PUBLIC_` variable.

## Success metrics

Primary metric:

- Percentage of demo cases that reach a bounded verdict with at least two linked exhibits

Secondary metrics:

- Time from forwarded request to first useful response
- Percentage of cases with an explicit uncertainty statement
- Number of participant replies per group case
- Percentage of users who request `SHOW WORK`
- Percentage of cases closed without the user opening the web surface

## Demo scenario

Use one realistic case: a ticket seller sends a screenshot of a confirmation and requests an urgent bank transfer. The demo should show:

1. Forwarded request
2. Extracted amount and account
3. Contradictory event detail
4. Group member objection
5. Agent asks for independent verification
6. `PAUSE` verdict with a compact receipt

The demo should make the safety value clear without presenting a guaranteed scam classification.

## Launch checklist

- Photon agent responds to a real iMessage message
- Image and link intake work without mock responses
- At least one evidence adapter returns a real exhibit
- Group commands work in a real group thread
- Verdict labels remain bounded and readable
- Private data retention is documented and testable
- Web demo is marked as a sample or connected to real case state
- README contains setup, limitations, and Photon-specific notes
- Demo video is short, legible, and shows the full interaction
- No unapproved logos or brand symbols are shipped

## Four-week plan

### Week 1: Agent spine

- Confirm Photon integration surface
- Create intake, case state, and reply loop
- Implement one real URL or image evidence adapter
- Write the safety and uncertainty policy

### Week 2: Court workflow

- Add case opening, commands, testimony, and votes
- Add evidence rendering and verdict states
- Add retention and deletion behaviour
- Test single-user and group-chat paths

### Week 3: Presentation surface

- Implement the approved landing page
- Build the pinned SVG case sequence
- Add the sample case replay
- Record real response timings and fix dead ends

### Week 4: Hardening and submission

- Remove mock claims from the real path
- Test malformed screenshots, missing links, and conflicting testimony
- Review privacy copy and logs
- Publish README, demo, and submission materials

## Open decisions before implementation

- Final single-word product name
- Exact Photon SDK and deployment surface
- First evidence adapter for the public demo
- Production retention duration
- Whether `/app` ships in the first public build
