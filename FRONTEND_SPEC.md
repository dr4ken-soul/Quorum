# FRONTEND_SPEC.md - Quorum

Kinetic editorial presentation for a Photon-powered iMessage payment-review agent. The working name is Quorum and remains provisional until the final single-word name is approved. This document defines the public web surface only. It does not implement the agent, payment access, or a banking flow.

## 0. Confirmed design decisions

- Aesthetic: Kinetic editorial
- Navigation: Scroll-progress navigation
- Background motion: SVG animation and morphing
- SVG subtype: 7b, shape morphing on scroll
- Viewport behaviour: Option D, GSAP Pinned Scroll
- Display font: Fraunces
- Body font: DM Sans
- Metadata font: IBM Plex Mono
- Colour system: cool paper, ink, and vermilion
- Hero: asymmetric editorial with a framed chat portal
- Quality benchmark: Framed Portal Hero, adapted for the product

### 0.1 Project read

- Project type: Photon-powered iMessage agent with a public web presentation and sample-case replay
- Target audience: people who receive payment requests through marketplace, ticket, rental, freelance, and personal group chats
- Brand personality: sharp, playful, sceptical, protective
- Primary platform: iMessage first, responsive web second
- Emotional goal: create a laugh, then create immediate trust in the evidence-led workflow

### 0.2 Project Identity Fingerprint

**Project fingerprint: asymmetric editorial / expressive display / bold studio solid / technical grid and dot / editorial stagger / playful spring**

### 0.3 Design dials

- `DESIGN_VARIANCE`: 7/10
- `MOTION_INTENSITY`: 5/10
- `VISUAL_DENSITY`: 5/10

### 0.4 Copy rules

- British English throughout
- No em dashes
- Short sentences
- Humour belongs in the case framing and participant replies
- Safety warnings stay direct and serious
- Never claim that the agent can guarantee a safe payment
- Avoid: seamless, powerful, cutting-edge, unlock, elevate, next-gen, empower
- Primary CTA intent: begin a payment review
- Secondary CTA intent: reveal how the case is decided

## 1. Global design system

### 1.1 Font import

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
```

```css
:root {
  --font-display: 'Fraunces', serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;
}
```

### 1.2 Exact colour variables

```css
:root {
  --font-display: 'Fraunces', serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'IBM Plex Mono', monospace;

  --bg-primary:     #f2f4f1;
  --bg-secondary:   #e7ebe8;
  --bg-surface:     #fafbf8;
  --bg-elevated:    #fbfcfa;

  --accent:         #d94e3b;
  --accent-hover:   #b83b2d;
  --accent-glow:    rgba(217, 78, 59, 0.14);

  --text-primary:   #191b1f;
  --text-secondary: #586068;
  --text-muted:     #7c858a;

  --border-subtle:  rgba(25, 27, 31, 0.10);
  --border-default: rgba(25, 27, 31, 0.20);

  --success:        #2e8b6d;
  --warning:        #c28a2c;
  --error:          #bd3f3f;

  --radius-sm:      2px;
  --radius-md:      6px;
  --radius-lg:      12px;
  --radius-xl:      18px;
  --radius-2xl:     28px;

  --shadow-sm:      0 1px 2px rgba(25, 27, 31, 0.06);
  --shadow-md:      0 6px 18px rgba(25, 27, 31, 0.09);
  --shadow-lg:      0 16px 42px rgba(25, 27, 31, 0.12);

  --duration-fast:  150ms;
  --duration-normal: 300ms;
  --duration-slow:  600ms;
}
```

No component may contain a hardcoded colour. Use the variables through Tailwind arbitrary values.

### 1.3 Global layout classes

```text
body: bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased overflow-x-hidden
main: relative isolate min-h-[100dvh] overflow-x-clip
section: relative z-10
content container: mx-auto w-full max-w-[1440px] px-5 md:px-10 lg:px-16
decorative SVG: pointer-events-none select-none
```

The root must use `min-h-[100dvh]`. Do not use `h-screen` or `min-h-screen`.

### 1.4 Z-index map

```text
z-0: decorative SVG field and grid layers
z-[3]: grain overlay
z-10: section content and ordinary text
z-20: chat portal, evidence cards, lifted panels
z-40: mobile menu panel if added later
z-45: mobile menu scrim if added later
z-50: wordmark and scroll-progress navigation
z-[100]: dropdowns
z-[200]: sticky app controls
z-[300]: modal backdrop
z-[400]: modal content
z-[500]: toast
z-[600]: tooltip
```

Do not use arbitrary values such as `z-[9999]`.

### 1.5 Grain overlay

The grain layer is optional and must remain quiet.

```text
absolute inset-0 z-[3] pointer-events-none opacity-[0.035]
```

Use a CSS background image in the global stylesheet. It must not capture pointer events or sit above interactive content.

## 2. Motion system

### 2.1 Standard repeatable entrance

Every non-pinned section entrance uses a repeatable reveal. Use `motion/react` and `viewport={{ once: false, amount: 0.1 }}` or the CSS `IntersectionObserver` utility defined in the implementation guide.

```text
initial: { opacity: 0, filter: 'blur(10px)', y: 20 }
animate: { opacity: 1, filter: 'blur(0px)', y: 0 }
transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0 }
viewport: { once: false, amount: 0.1 }
```

Grouped child delay: `index * 0.12s`, maximum group delay `0.48s`.

### 2.2 Hover motion

```text
micro interaction duration: 150ms
page interaction duration: 300ms
custom ease: cubic-bezier(0.16, 1, 0.3, 1)
button icon: translate-x-1 translate-y-[-1px] scale-105
card lift: translate-y-[-4px]
```

All hover changes use CSS classes. Do not use inline mouse-enter or mouse-leave handlers.

### 2.3 GSAP pinned sequence

The `trial` section uses one pinned sequence on desktop:

```text
trigger: section[data-pinned-trial]
start: 'top top'
end: '+=2600'
scrub: 0.8
pin: true
anticipatePin: 1
ease: 'none'
```

The SVG state map is:

```text
progress 0.00 - 0.24: claim shape
progress 0.25 - 0.49: evidence shape
progress 0.50 - 0.74: deliberation shape
progress 0.75 - 1.00: verdict shape
```

Each state label uses `opacity: 0 -> 1`, `y: 18px -> 0`, `duration: 0.45s`, `ease: 'power2.out'` when its state becomes active. The SVG morph itself is mapped directly to scroll progress with no free-running loop.

Desktop pinned content must be disabled below `lg`. Mobile uses a normal vertical sequence with the same four states and repeatable reveal transitions.

### 2.4 Reduced motion

When `prefers-reduced-motion: reduce` is active:

- Remove GSAP pinning and scrubbing
- Render the four SVG states as a static four-step diagram
- Replace blur and translation entrances with `opacity: 1`
- Disable hover lift and magnetic movement
- Keep all content and controls available

## 3. Navigation

**Pattern:** Scroll-progress navigation

### 3.1 Desktop wordmark

```text
fixed top-5 left-5 z-50 md:top-7 md:left-10
font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-primary)]
```

Use the final approved single-word name as plain text. Do not add an icon, crest, scales, gavel, shield, or generated mark.

### 3.2 Desktop progress rail

```text
fixed inset-y-0 right-5 z-50 hidden w-20 items-center justify-center lg:flex
pointer-events-none
```

Rail:

```text
pointer-events-auto flex flex-col items-end gap-4
```

Each marker:

```text
group flex items-center gap-2
font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]
transition-colors duration-150
```

Marker dot:

```text
h-1.5 w-1.5 rounded-full border border-[var(--border-default)]
bg-[var(--bg-primary)] transition-all duration-150
group-[aria-current=true]:h-2 group-[aria-current=true]:w-2
group-[aria-current=true]:border-[var(--accent)] group-[aria-current=true]:bg-[var(--accent)]
```

Labels: `OPEN`, `PROBLEM`, `TRIAL`, `PROOF`, `COURT`, `RULES`, `USE CASES`, `LIMITS`, `RULING`.

The active label uses `text-[var(--text-primary)]`. The rail click target scrolls to the corresponding section with `scroll-behaviour: smooth` and keyboard focus remains visible.

### 3.3 Mobile progress bar

```text
fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3
rounded-[var(--radius-lg)] border border-[var(--border-default)]
bg-[var(--bg-elevated)]/90 px-3 py-2 backdrop-blur-md
lg:hidden
```

Progress track:

```text
h-1 flex-1 overflow-hidden rounded-full bg-[var(--border-subtle)]
```

Progress fill:

```text
h-full origin-left rounded-full bg-[var(--accent)] transition-transform duration-300
```

Current label:

```text
shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]
```

## 4. Section 1: Hero

**Recipe benchmark:** `framed-portal-hero`

**Purpose:** Make the product interaction and the humour legible within five seconds.

```text
section id="open" data-section="open" data-density="hero"
relative min-h-[100dvh] overflow-hidden px-5 pb-16 pt-28
md:px-10 md:pb-20 md:pt-32 lg:px-16
```

Hero ambient SVG:

```text
pointer-events-none absolute right-[-10%] top-[9%] z-0
h-[72%] w-[82%] opacity-[0.42]
md:right-[-4%] md:h-[78%] md:w-[68%]
lg:right-[2%] lg:top-[12%] lg:h-[80%] lg:w-[58%]
```

Grid:

```text
relative z-10 mx-auto grid min-h-[calc(100dvh-8rem)] w-full max-w-[1440px]
grid-cols-1 items-center gap-12
md:gap-16 lg:grid-cols-[minmax(0,0.88fr)_minmax(360px,1.12fr)] lg:gap-10
```

Left content:

```text
relative z-10 flex flex-col justify-center lg:pr-12
```

Eyebrow:

```text
mb-6 font-mono text-[10px] uppercase tracking-[0.24em]
text-[var(--accent)] md:text-xs
```

Copy: `PRE-PAYMENT CASE FILE / OPEN A REVIEW`

Eyebrow animation:

```text
initial: { opacity: 0, y: 10 }
animate: { opacity: 1, y: 0 }
duration: 0.6s
ease: [0.16, 1, 0.3, 1]
delay: 0.15s
```

Headline:

```text
max-w-[8ch] font-display text-[clamp(3.75rem,10vw,8.5rem)]
font-semibold leading-[0.86] tracking-[-0.055em]
text-[var(--text-primary)]
```

Copy: `LET THE CHAT PUT IT ON TRIAL`

Headline animation:

```text
initial: { opacity: 0, filter: 'blur(12px)', y: 26 }
animate: { opacity: 1, filter: 'blur(0px)', y: 0 }
duration: 0.9s
ease: [0.16, 1, 0.3, 1]
delay: 0.28s
```

Description:

```text
mt-7 max-w-[44ch] font-body text-base leading-[1.55]
text-[var(--text-secondary)] md:mt-8 md:text-lg
```

Copy: `Forward a payment request. The agent collects the receipts, lets the group object, and tells you what is still unproven before your money moves.`

Description animation:

```text
initial: { opacity: 0, y: 18 }
animate: { opacity: 1, y: 0 }
duration: 0.7s
ease: [0.16, 1, 0.3, 1]
delay: 0.55s
```

CTA cluster:

```text
mt-9 flex flex-wrap items-center gap-3 md:mt-10
```

Primary button:

```text
group inline-flex items-center gap-3 rounded-[var(--radius-md)]
bg-[var(--accent)] px-5 py-3 font-mono text-xs font-medium uppercase
tracking-[0.12em] text-[var(--bg-elevated)]
transition-all duration-150 hover:bg-[var(--accent-hover)]
hover:shadow-[0_8px_24px_rgba(217,78,59,0.22)]
focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]
md:px-6 md:py-3.5
```

Label: `CHECK A PAYMENT`

Secondary button:

```text
inline-flex items-center gap-3 rounded-[var(--radius-md)]
border border-[var(--border-default)] bg-transparent px-5 py-3
font-mono text-xs font-medium uppercase tracking-[0.12em]
text-[var(--text-primary)] transition-all duration-150
hover:border-[var(--accent)] hover:text-[var(--accent)]
focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]
md:px-6 md:py-3.5
```

Label: `SEE THE VERDICT`

Portal wrapper:

```text
relative z-20 mx-auto w-full max-w-[520px] lg:justify-self-end
```

Portal frame:

```text
relative overflow-hidden rounded-[var(--radius-2xl)]
border border-[var(--border-default)] bg-[var(--bg-surface)]
shadow-[var(--shadow-lg)]
```

Portal inner frame:

```text
m-1 rounded-[calc(var(--radius-2xl)-4px)] border border-[var(--border-subtle)]
bg-[var(--bg-elevated)] p-4 md:m-1.5 md:p-5
```

Portal header:

```text
flex items-center justify-between border-b border-[var(--border-subtle)]
pb-4
```

Header label:

```text
font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--text-muted)]
```

Copy: `COURTROOM / CASE 0047`

Status:

```text
inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)]
px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.13em]
text-[var(--accent)]
```

Copy: `IN REVIEW`

Chat transcript:

```text
flex min-h-[390px] flex-col gap-3 py-5 md:min-h-[430px] md:py-6
```

Incoming bubble:

```text
max-w-[82%] self-start rounded-[var(--radius-lg)] rounded-tl-[var(--radius-sm)]
bg-[var(--bg-secondary)] px-3.5 py-3 font-body text-sm leading-[1.4]
text-[var(--text-primary)]
```

Copy: `Can you send the deposit now? The ticket expires in ten minutes.`

Agent bubble:

```text
max-w-[88%] self-end rounded-[var(--radius-lg)] rounded-tr-[var(--radius-sm)]
bg-[var(--text-primary)] px-3.5 py-3 font-body text-sm leading-[1.4]
text-[var(--bg-primary)]
```

Copy: `Objection. We have a claim, not proof. Opening the case.`

Evidence row:

```text
flex items-center gap-3 border-y border-[var(--border-subtle)] py-3
```

Evidence marker:

```text
flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)]
border border-[var(--accent)] font-mono text-[10px] text-[var(--accent)]
```

Copy: `EXHIBIT A / receipt screenshot`

Verdict preview:

```text
mt-auto border-t border-[var(--border-subtle)] pt-4
```

Verdict line:

```text
flex items-end justify-between gap-4
```

Verdict label:

```text
font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--text-muted)]
```

Value: `PAUSE`

Value classes:

```text
font-display text-4xl font-semibold leading-none tracking-[-0.04em]
text-[var(--accent)] md:text-5xl
```

Portal animation:

```text
initial: { opacity: 0, y: 28, scale: 0.96 }
animate: { opacity: 1, y: 0, scale: 1 }
duration: 0.9s
ease: [0.16, 1, 0.3, 1]
delay: 0.45s
```

Mobile order: portal first, then eyebrow, headline, description, and CTA. Use a wrapper with `flex flex-col` and `order-first lg:order-none` for the portal.

## 5. Section 2: The Problem

**Recipe:** `full-width-statement`

Purpose: establish why a normal payment request is not enough.

```text
section id="problem" data-section="problem" data-density="sparse"
relative z-10 border-y border-[var(--border-subtle)] py-28
md:py-40
```

Content:

```text
mx-auto flex w-full max-w-[1180px] flex-col items-center px-5 text-center
md:px-10 lg:px-16
```

Kicker:

```text
mb-7 font-mono text-[10px] uppercase tracking-[0.22em]
text-[var(--accent)] md:text-xs
```

Copy: `THE CHARGE`

Statement:

```text
max-w-[15ch] font-display text-[clamp(2.75rem,7vw,6.5rem)]
font-semibold leading-[0.9] tracking-[-0.055em] text-[var(--text-primary)]
```

Copy: `A CONVINCING REQUEST CAN STILL BE A TRAP`

Metadata:

```text
mt-8 max-w-[58ch] font-mono text-[10px] uppercase leading-[1.7]
tracking-[0.12em] text-[var(--text-muted)] md:text-xs
```

Copy: `URGENCY IS A CLAIM. A SCREENSHOT IS A CLAIM. A FAMILIAR NAME IS A CLAIM.`

Statement animation:

```text
initial: { opacity: 0, filter: 'blur(10px)', y: 22 }
animate: { opacity: 1, filter: 'blur(0px)', y: 0 }
duration: 0.85s
ease: [0.16, 1, 0.3, 1]
delay: 0s
viewport: { once: false, amount: 0.1 }
```

## 6. Section 3: The Trial

**Recipe:** `vertical-grid-walkthrough`, adapted with a pinned SVG morph sequence.

Purpose: demonstrate the product mechanism as a case moving through four states.

```text
section id="trial" data-section="trial" data-density="dense"
data-pinned-trial relative z-10 overflow-clip bg-[var(--bg-secondary)]
```

Desktop stage:

```text
relative min-h-[300vh] lg:block
```

Pinned viewport shell:

```text
relative flex min-h-[100dvh] items-center overflow-hidden px-5 py-20
md:px-10 lg:px-16
```

The GSAP trigger pins this shell on desktop. Do not add a second sticky or pinned parent.

SVG stage:

```text
pointer-events-none absolute inset-0 z-0 h-full w-full
```

SVG visual rules:

- ViewBox: `0 0 1440 900`
- Four path groups with identical point counts for clean morphing
- Stroke width: `1.5`
- Grid line opacity: `0.16`
- Active path opacity: `0.92`
- Inactive path opacity: `0.16`
- Accent stroke: `var(--accent)`
- No free-running loop

Content grid:

```text
relative z-10 mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12
md:gap-16 lg:grid-cols-[0.42fr_0.58fr] lg:items-center lg:gap-20
```

Left label:

```text
font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs
```

Copy: `THE CASE MOVES`

Left headline:

```text
mt-5 max-w-[8ch] font-display text-[clamp(3rem,7vw,6.5rem)]
font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]
```

Copy: `FROM CLAIM TO RULING`

Stage index:

```text
mt-8 flex flex-col gap-3 border-l border-[var(--border-default)] pl-4
```

Stage item:

```text
flex items-baseline gap-3 font-mono text-[10px] uppercase tracking-[0.14em]
text-[var(--text-muted)] transition-colors duration-300
```

Active item: `text-[var(--text-primary)]`

Items: `01 CLAIM`, `02 EXHIBITS`, `03 DELIBERATION`, `04 VERDICT`

Right case panel:

```text
relative z-20 rounded-[var(--radius-2xl)] border border-[var(--border-default)]
bg-[var(--bg-elevated)]/90 p-4 shadow-[var(--shadow-lg)] backdrop-blur-md
md:p-6
```

Case panel inner border:

```text
rounded-[calc(var(--radius-2xl)-6px)] border border-[var(--border-subtle)] p-5
md:p-7
```

State label:

```text
font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]
```

State copy changes with scroll: `CLAIM RECEIVED`, `EXHIBITS ATTACHED`, `OBJECTIONS OPEN`, `RULING READY`.

State headline:

```text
mt-4 max-w-[12ch] font-display text-4xl font-semibold leading-[0.92]
tracking-[-0.04em] text-[var(--text-primary)] md:text-6xl
```

State body:

```text
mt-5 max-w-[42ch] font-body text-sm leading-[1.55] text-[var(--text-secondary)]
md:text-base
```

State copy:

- `A request arrives. The agent records what was actually said.`
- `The receipt, link, amount, and timing become separate exhibits.`
- `The group can vouch, object, or admit that nobody knows.`
- `The ruling names the strongest evidence and the strongest doubt.`

Pinned panel animation:

```text
initial: { opacity: 0, filter: 'blur(10px)', y: 20 }
animate: { opacity: 1, filter: 'blur(0px)', y: 0 }
duration: 0.8s
ease: [0.16, 1, 0.3, 1]
delay: 0.1s
```

Mobile fallback: render four stacked cards with the same state copy, no pinning, no scrub, and `py-24` section spacing.

## 7. Section 4: What Counts as Proof

**Recipe:** `asymmetric-bento-grid`

```text
section id="proof" data-section="proof" data-density="dense"
relative z-10 bg-[var(--bg-primary)] py-24 md:py-32
```

Header:

```text
mx-auto max-w-[1440px] px-5 md:px-10 lg:px-16
```

Kicker: `EXHIBITS`

Title:

```text
mt-4 max-w-[11ch] font-display text-[clamp(3rem,6vw,6rem)]
font-semibold leading-[0.9] tracking-[-0.05em] text-[var(--text-primary)]
```

Copy: `SHOW YOUR WORK`

Grid:

```text
mx-auto mt-14 grid max-w-[1440px] grid-cols-1 gap-3 px-5
md:mt-20 md:grid-cols-12 md:gap-4 md:px-10 lg:px-16
```

Cell base:

```text
relative min-h-[190px] overflow-hidden border border-[var(--border-default)]
bg-[var(--bg-surface)] p-5 transition-colors duration-300
hover:border-[var(--accent)] md:p-7
```

Cells and layout:

- `md:col-span-7 md:row-span-2`: `MESSAGE / WHAT WAS ACTUALLY ASKED`
- `md:col-span-5`: `LINK / WHERE DOES IT LEAD`
- `md:col-span-5`: `IMAGE / WHAT DOES THE SCREENSHOT PROVE`
- `md:col-span-4`: `CONTEXT / DOES THE STORY LINE UP`
- `md:col-span-4`: `TESTIMONY / WHO KNOWS THIS FIRST-HAND`
- `md:col-span-4`: `GAPS / WHAT IS STILL MISSING`

Cell label:

```text
font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]
```

Cell value:

```text
mt-8 max-w-[18ch] font-display text-2xl font-medium leading-[0.95]
tracking-[-0.03em] text-[var(--text-primary)] md:text-3xl
```

Cell note:

```text
absolute bottom-5 left-5 max-w-[30ch] font-body text-xs leading-[1.5]
text-[var(--text-secondary)] md:bottom-7 md:left-7
```

Notes:

- `The original message stays separate from the agent summary.`
- `A shortened destination is not the same as a verified seller.`
- `A screenshot can support a claim and still be incomplete.`
- `Earlier conversation can expose a changed account or story.`
- `A vote without a reason is context, not proof.`
- `Missing evidence can be the most important exhibit.`

Cell entrance:

```text
initial: { opacity: 0, y: 22 }
animate: { opacity: 1, y: 0 }
duration: 0.6s
ease: [0.16, 1, 0.3, 1]
delay: index * 0.12s
viewport: { once: false, amount: 0.1 }
```

## 8. Section 5: Court in Session

**Recipe:** `stacked-card-reveal`

Purpose: make the social mechanic entertaining and understandable.

```text
section id="court" data-section="court" data-density="sparse"
relative z-10 overflow-hidden bg-[var(--bg-secondary)] py-28 md:py-40
```

Header:

```text
mx-auto max-w-[1440px] px-5 md:px-10 lg:px-16
```

Kicker: `GROUP CHAT COURT`

Title:

```text
mt-4 max-w-[10ch] font-display text-[clamp(3rem,7vw,7rem)]
font-semibold leading-[0.87] tracking-[-0.06em] text-[var(--text-primary)]
```

Copy: `EVERYONE MAY OBJECT`

Transcript stack:

```text
mx-auto mt-14 grid max-w-[760px] gap-3 md:mt-20
```

Message card:

```text
relative border border-[var(--border-default)] bg-[var(--bg-elevated)] p-5
shadow-[var(--shadow-sm)] md:p-6
```

Message meta:

```text
flex items-center justify-between gap-4 font-mono text-[10px]
uppercase tracking-[0.14em] text-[var(--text-muted)]
```

Message body:

```text
mt-4 max-w-[52ch] font-body text-base leading-[1.5] text-[var(--text-primary)]
md:text-lg
```

Messages:

1. `AGENT / OPENING STATEMENT` - `The request says urgent transfer. The account changed today. The court is now mildly interested.`
2. `MAYA / TESTIMONY` - `I have bought from this seller before. This account is not the one I used.`
3. `JON / OBJECTION` - `The receipt uses a different event name from the ticket listing.`
4. `AGENT / RESPONSE` - `Objection noted. The screenshot is evidence of a screenshot.`
5. `GROUP / VOTE` - `VOUCH 1 / OBJECT 2 / UNKNOWN 1`

Reaction chip:

```text
inline-flex rounded-full border border-[var(--border-subtle)]
px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em]
text-[var(--accent)]
```

Message reveal:

```text
initial: { opacity: 0, y: 28, rotate: -1.5deg }
animate: { opacity: 1, y: 0, rotate: 0deg }
duration: 0.65s
ease: [0.16, 1, 0.3, 1]
delay: index * 0.14s
viewport: { once: false, amount: 0.1 }
```

Do not use real names, phone numbers, avatars, or personal message content in the demo surface.

## 9. Section 6: The Agent's Rules

**Recipe:** `tabbed-feature-explorer`

```text
section id="rules" data-section="rules" data-density="dense"
relative z-10 bg-[var(--bg-primary)] py-24 md:py-32
```

Layout:

```text
mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:px-10
lg:grid-cols-[0.36fr_0.64fr] lg:gap-20 lg:px-16
```

Left title:

```text
max-w-[9ch] font-display text-[clamp(3rem,6vw,6rem)]
font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]
```

Copy: `A RULING NEEDS RULES`

Tab list:

```text
mt-8 flex flex-wrap gap-2 lg:mt-12 lg:flex-col lg:items-start
```

Tab button:

```text
rounded-[var(--radius-md)] border border-[var(--border-default)]
px-3 py-2 font-mono text-[10px] uppercase tracking-[0.13em]
text-[var(--text-secondary)] transition-all duration-150
hover:border-[var(--accent)] hover:text-[var(--accent)]
aria-[selected=true]:border-[var(--accent)] aria-[selected=true]:bg-[var(--accent-glow)]
aria-[selected=true]:text-[var(--text-primary)]
```

Tabs: `OBSERVED`, `INFERRED`, `UNKNOWN`, `HUMAN CALL`.

Panel:

```text
relative min-h-[360px] border border-[var(--border-default)]
bg-[var(--bg-surface)] p-6 md:p-10
```

Panel label:

```text
font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--accent)]
```

Panel title:

```text
mt-5 max-w-[12ch] font-display text-4xl font-medium leading-[0.92]
tracking-[-0.04em] text-[var(--text-primary)] md:text-6xl
```

Panel copy:

- `OBSERVED / Say exactly what the message, image, or link shows.`
- `INFERRED / Mark a pattern as a pattern, not as a fact.`
- `UNKNOWN / Missing context stays visible instead of becoming confidence.`
- `HUMAN CALL / The agent recommends. The person decides.`

Panel animation:

```text
initial: { opacity: 0, filter: 'blur(8px)', y: 16 }
animate: { opacity: 1, filter: 'blur(0px)', y: 0 }
duration: 0.5s
ease: [0.16, 1, 0.3, 1]
delay: 0s
```

## 10. Section 7: Where It Helps

**Recipe:** `horizontal-scroll-showcase`

```text
section id="use-cases" data-section="use-cases" data-density="sparse"
relative z-10 overflow-hidden bg-[var(--bg-secondary)] py-24 md:py-32
```

Header:

```text
mx-auto flex max-w-[1440px] flex-col gap-5 px-5 md:flex-row md:items-end
md:justify-between md:px-10 lg:px-16
```

Title:

```text
max-w-[10ch] font-display text-[clamp(3rem,6vw,6rem)]
font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]
```

Copy: `BEFORE THE TRANSFER`

Instruction:

```text
font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-muted)]
```

Copy: `DRAG TO INSPECT / SWIPE ON MOBILE`

Track:

```text
mt-12 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-5
md:mt-16 md:px-10 lg:px-16
```

Hide scrollbar:

```css
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { scrollbar-width: none; }
```

Case card:

```text
min-w-[78vw] snap-start border border-[var(--border-default)]
bg-[var(--bg-elevated)] p-6 md:min-w-[420px] md:p-8
```

Card index:

```text
font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--accent)]
```

Card title:

```text
mt-16 max-w-[9ch] font-display text-4xl font-medium leading-[0.9]
tracking-[-0.04em] text-[var(--text-primary)] md:mt-24 md:text-5xl
```

Cards:

- `01 / MARKETPLACE`: `The seller changes the payment account at the last minute.`
- `02 / TICKETS`: `The screenshot looks official. The event details do not match.`
- `03 / RENTAL`: `The deposit is urgent. The address and owner story conflict.`
- `04 / FREELANCE`: `The client wants work before a deposit. The thread needs a record.`

Card footer:

```text
mt-12 border-t border-[var(--border-subtle)] pt-4 font-body text-sm
leading-[1.5] text-[var(--text-secondary)] md:mt-16
```

Footer copy: `Start with the message. Keep the final call human.`

## 11. Section 8: Trust and Limits

**Recipe:** `split-image-text`, adapted into a non-photographic safety panel.

```text
section id="limits" data-section="limits" data-density="sparse"
relative z-10 py-28 md:py-40
```

Grid:

```text
mx-auto grid max-w-[1440px] grid-cols-1 gap-12 px-5 md:px-10
lg:grid-cols-[0.44fr_0.56fr] lg:items-center lg:gap-20 lg:px-16
```

Left copy label: `THE LIMIT`

Heading:

```text
mt-5 max-w-[9ch] font-display text-[clamp(3rem,6vw,6rem)]
font-semibold leading-[0.88] tracking-[-0.055em] text-[var(--text-primary)]
```

Copy: `A SECOND OPINION IS NOT A GUARANTEE`

Body:

```text
mt-6 max-w-[45ch] font-body text-base leading-[1.6] text-[var(--text-secondary)]
```

Copy: `Quorum can organise evidence, expose contradictions, and ask for independent verification. It cannot know every private fact. The person sending the money remains responsible for the final decision.`

Right safety panel:

```text
border border-[var(--border-default)] bg-[var(--bg-surface)] p-5
md:p-8
```

Safety rows:

```text
grid grid-cols-[auto_1fr] gap-4 border-b border-[var(--border-subtle)]
py-4 last:border-b-0
```

Status marker:

```text
mt-1 h-2 w-2 rounded-full bg-[var(--success)]
```

Labels:

- `SHOW SOURCES`: every conclusion links to an exhibit
- `NAME DOUBT`: missing evidence remains in the ruling
- `VERIFY OUTSIDE`: urgent identity claims need another channel
- `NO AUTO-PAY`: the agent never moves money

Panel entrance:

```text
initial: { opacity: 0, x: 24 }
animate: { opacity: 1, x: 0 }
duration: 0.7s
ease: [0.16, 1, 0.3, 1]
delay: 0.2s
viewport: { once: false, amount: 0.1 }
```

## 12. Section 9: Final Ruling

**Composition:** bespoke verdict-poster composition

```text
section id="ruling" data-section="ruling" data-density="hero"
relative z-10 overflow-hidden border-t border-[var(--border-subtle)]
bg-[var(--text-primary)] px-5 py-28 md:px-10 md:py-40 lg:px-16
```

Background SVG:

```text
pointer-events-none absolute right-[-8%] top-[-18%] z-0 h-[130%] w-[65%]
opacity-[0.16] lg:w-[48%]
```

Content:

```text
relative z-10 mx-auto flex max-w-[1440px] flex-col items-start
```

Kicker:

```text
font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--accent)] md:text-xs
```

Copy: `THE RULING`

Heading:

```text
mt-6 max-w-[10ch] font-display text-[clamp(3.5rem,9vw,9rem)]
font-semibold leading-[0.84] tracking-[-0.06em] text-[var(--bg-primary)]
```

Copy: `PAUSE BEFORE YOU PAY`

Subtext:

```text
mt-7 max-w-[43ch] font-body text-base leading-[1.55]
text-[var(--bg-secondary)] md:text-lg
```

Copy: `Send the request to the chat. Let the evidence speak before urgency does.`

CTA:

```text
group mt-10 inline-flex items-center gap-3 rounded-[var(--radius-md)]
bg-[var(--accent)] px-6 py-3.5 font-mono text-xs font-medium uppercase
tracking-[0.12em] text-[var(--bg-elevated)] transition-all duration-150
hover:bg-[var(--accent-hover)] hover:shadow-[0_8px_24px_rgba(217,78,59,0.3)]
focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]
```

Label: `CHECK A PAYMENT`

Heading animation:

```text
initial: { opacity: 0, filter: 'blur(12px)', y: 24 }
animate: { opacity: 1, filter: 'blur(0px)', y: 0 }
duration: 0.8s
ease: [0.16, 1, 0.3, 1]
delay: 0s
viewport: { once: false, amount: 0.1 }
```

## 13. Footer

```text
footer relative z-10 border-t border-[var(--border-subtle)]
bg-[var(--bg-primary)] px-5 py-10 md:px-10 md:py-12 lg:px-16
```

Container:

```text
mx-auto flex max-w-[1440px] flex-col gap-8 md:flex-row md:items-end
md:justify-between
```

Wordmark:

```text
font-mono text-[11px] uppercase tracking-[0.24em] text-[var(--text-primary)]
```

Attribution:

```text
mt-3 max-w-[38ch] font-body text-xs leading-[1.5] text-[var(--text-muted)]
```

Copy: `A Photon-powered iMessage agent for the moment before money moves.`

Link row:

```text
flex flex-wrap gap-x-6 gap-y-3 md:justify-end
```

Link:

```text
font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--text-secondary)]
transition-colors duration-150 hover:text-[var(--accent)]
focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]
```

Links: `Demo`, `Docs`, `Privacy`, `GitHub`.

Bottom line:

```text
mt-8 flex flex-col gap-2 border-t border-[var(--border-subtle)] pt-5
font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-muted)]
md:flex-row md:justify-between
```

Copy left: `Decision support, not a guarantee`

Copy right: `Built on Photon`

## 14. Asset briefs

No photographic or video assets are required for the approved design. The visual proof is coded UI and SVG geometry.

### Asset 1: Case morph SVG

- Type: coded inline SVG
- Description: four compatible outline states for claim, exhibits, deliberation, and verdict
- Motion: scroll-mapped shape morphing through GSAP
- Mood: precise, lightly theatrical, evidence-led
- Resolution: responsive vector, ViewBox `0 0 1440 900`
- Generation tool: hand-authored SVG paths, not an image model
- Hosting: component source, no external request
- Fallback: static four-state diagram for mobile and reduced motion

### Asset 2: Chat portal UI

- Type: coded interface composition
- Description: fictional iMessage-style conversation surface with no Apple or Photon marks
- Motion: repeatable message reveals, no audio
- Mood: familiar, dryly funny, trustworthy
- Resolution: responsive CSS layout, minimum content width `320px`
- Generation tool: React and Tailwind
- Hosting: application source
- Fallback: plain stacked transcript with all messages visible

### Asset 3: Grain texture

- Type: CSS-generated texture
- Description: quiet monochrome grain layer for depth
- Motion: none
- Mood: printed case file, restrained
- Resolution: repeating `128px` texture
- Generation tool: CSS SVG filter
- Hosting: global stylesheet
- Fallback: solid background with no texture

### Logo and favicon policy

No logo or brand symbol is required. Use a text-only wordmark. If a Photon or iMessage mark is later requested, stop and ask for explicit approval plus supplied brand assets before adding it.

## 15. Responsive and accessibility requirements

- Every layout includes mobile, `md`, and `lg` behaviour where positioning or sizing changes
- Hero portal appears before the headline on mobile
- Desktop pinned scroll becomes normal stacked content below `lg`
- Horizontal use-case track remains touch-scrollable and hides its scrollbar
- Focus states are visible with a two-pixel accent outline and four-pixel offset
- All SVGs used as decoration have `aria-hidden="true"`
- Interactive SVG controls have accessible labels and keyboard equivalents
- Colour contrast must meet WCAG AA
- No text is placed inside an image
- No emojis are used as interface icons
- Use inline SVG icons or approved Material icons only
- Loading states use skeleton shimmer, never spinners
- Error and empty states are required for the demo and any case index
- Skip link: `sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[600]`

## 16. Interaction limits

The marketing page uses three premium interaction patterns:

1. Scroll-progress navigation
2. GSAP pinned SVG morph sequence
3. Horizontal use-case track

Do not add mouse-tracked 3D, a custom cursor, autoplay audio, or a second page-wide animation system. Touch devices must receive a clean degradation for every interaction.

## 17. Implementation self-check

- [x] All seven design gates are confirmed
- [x] Fingerprint and dials are recorded
- [x] Exact palette and font import are recorded
- [x] Every major element has exact Tailwind classes
- [x] Every entrance has initial, animate, duration, ease, delay, and viewport behaviour
- [x] GSAP pin values and SVG morph ranges are exact
- [x] Semantic z-index values are declared
- [x] No logo or brand symbol is assumed
- [x] Asset briefs include all required fields
- [x] No image or video dependency is required
- [x] Mobile and reduced-motion fallbacks are specified
- [x] Scroll entrances are repeatable
- [x] No pure black, pure white, AI purple glow, or generic three-card feature block is used
- [x] No em dash appears in product copy
