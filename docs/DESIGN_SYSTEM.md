# Zury Design System

## Design Direction

Zury is a premium consumer product for students. It should feel intelligent,
personal and beautifully engineered without looking like developer software.

The visual standard is a blend of:

- Amie's warmth, personality and joyful interaction
- Bothive's editorial scale, precise rhythm and confident product presentation
- Craft's tactile depth, editorial composition and sense of ownership
- Limitless' quiet intelligence and ambient technology
- Orizon's precision, confidence and high-quality product presentation

Use these references as principles, not templates. Zury must have its own
identity and must not reproduce another product's layout or visual assets.

## Experience Principles

### Calm intelligence

Zury should reduce pressure rather than add another system to manage. Show the
most relevant information first and progressively disclose everything else.

### Consumer first

Use familiar language such as "Your week", "Study plan" and "Saved offline".
Do not expose implementation language such as agents, tools, sync queues,
models, API calls, tokens, repositories or database records in the primary UI.

### Beautiful utility

Every screen must have a clear purpose and a strong visual focal point. Beauty
comes from hierarchy, typography, composition, material and motion, not from
decorative clutter.

### Personal, not corporate

The app belongs to one student. Prefer "you" and "your" over workspace,
organization and resource language. Avoid enterprise dashboards, admin tables
and generic SaaS card grids.

### Advanced technology, quiet presentation

The product may be technically sophisticated, but the interface should make
that sophistication feel effortless. AI should appear through useful outcomes,
timely suggestions and clear explanations rather than constant AI branding.

### Trust by design

Always distinguish live, cached, pending and unavailable information in plain
language. Never use alarming technical errors when a humane explanation and a
clear recovery action will do.

## Visual Identity

Zury's core visual language is editorial, tactile and composed. Dark mode is
mineral and luminous; light mode is warm and paper-like. Both should feel more
like a premium personal device than a control panel.

### Color

Dark palette:

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#080A09` | Primary app background |
| `canvas-raised` | `#0D100F` | Large elevated regions |
| `surface` | `#121614` | Cards, sheets and controls |
| `surface-hover` | `#181E1B` | Hovered or selected surfaces |
| `line` | `rgba(255, 255, 255, 0.08)` | Quiet boundaries |
| `text-primary` | `#F4F7F5` | Primary text |
| `text-secondary` | `#A7B0AB` | Supporting text |
| `text-tertiary` | `#68716C` | Metadata and disabled text |
| `emerald` | `#21D18B` | Primary action and active state |
| `emerald-soft` | `rgba(33, 209, 139, 0.14)` | Selection and subtle emphasis |
| `emerald-glow` | `rgba(33, 209, 139, 0.28)` | Restrained ambient glow |
| `warning` | `#F0B35A` | Attention without alarm |
| `danger` | `#F07178` | Destructive actions and errors |

Light palette:

| Token | Value | Use |
| --- | --- | --- |
| `canvas` | `#F5F4EF` | Warm primary background |
| `canvas-raised` | `#EBECE5` | Editorial feature regions |
| `surface` | `#FFFEFA` | Forms, sheets and controls |
| `surface-hover` | `#EEF0E9` | Hovered or selected surfaces |
| `line` | `rgba(23, 32, 28, 0.11)` | Quiet boundaries |
| `text-primary` | `#17201C` | Primary text |
| `text-secondary` | `#606B65` | Supporting text |
| `emerald` | `#087A50` | Primary action and active state |

Use emerald as a signal, not as paint. Most screens should remain neutral, with
one dominant accent action. Gradients may use deep emerald, mineral blue or warm
white at low saturation. Avoid neon rainbow gradients and large flat areas of
bright green.

### Light and material

- Build depth with tonal surfaces, soft inner highlights and precise borders.
- Use one restrained ambient glow around the screen's main idea or action.
- Prefer large, continuous surfaces over many detached cards.
- Use blur only for transient layers such as menus, sheets and floating controls.
- Add very subtle texture or noise when it prevents gradients from feeling flat.
- Keep shadows broad and low contrast; avoid heavy black drop shadows.

### Typography

- Expressive display and meaningful headings: Fraunces
- Interface and body: Inter
- Numeric schedules and times: Inter with tabular numerals

Fraunces gives Zury an academic, warm and distinctive editorial voice. Use it
selectively for onboarding statements, daily greetings, recommendations,
meaningful empty states and major page titles. Inter owns all operational UI:
forms, navigation, buttons, schedules, metadata and dense headings. Serif
expresses meaning; sans-serif supports action.

Do not assign Fraunces to every semantic heading automatically. Structural
headings inside forms, lists and settings may remain Inter. Italic Fraunces is a
rare emphasis device for expressive moments, not a repeated decoration.

Recommended scale:

| Role | Size | Weight | Notes |
| --- | --- | --- | --- |
| Display | `48-72px` | `500-600` | Marketing and key onboarding moments |
| Page title | `32-44px` | `550-650` | One clear title per screen |
| Section title | `20-24px` | `550-650` | Strong but not oversized |
| Body | `15-17px` | `400-500` | Comfortable reading |
| Label | `13-14px` | `500-600` | Controls and metadata |
| Caption | `12-13px` | `450-550` | Secondary context only |

### Authentication composition

- Desktop uses an asymmetric split: approximately 60% editorial story and 40%
  authentication form.
- The editorial side uses a large Fraunces statement and a restrained preview of
  the student's day.
- The form panel is integrated into the page rather than placed in a generic
  floating card.
- Google remains the visually dominant sign-in method; email is secondary.
- Mobile removes the preview and uses a focused, centered single-column form.
- Authentication supports complete light and dark themes, following the system
  preference by default.

### Implementation convention

- Use Tailwind utilities for component layout and visual styling.
- Keep `globals.css` limited to Tailwind configuration, semantic theme tokens and
  true base styles.
- Use `next/font` for Fraunces and Inter so fonts are self-hosted and stable.
- Use `next-themes` for theme preference and system theme support.
- shadcn/ui may provide accessible primitives, but identity-defining composition
  remains custom to Zury.

### Shape

- Use rounded geometry with disciplined variation, generally `10-24px`.
- Large feature surfaces may use `24-32px` radii.
- Buttons and compact controls should use `10-14px`, not excessive pill shapes.
- Pills are reserved for filters, statuses and small segmented choices.
- Icons should be simple, softly rounded and visually consistent.

## Layout

### Desktop

- Use a focused content canvas rather than an edge-to-edge analytics dashboard.
- Keep primary content between `1120px` and `1280px` where practical.
- Navigation should feel quiet and stable, with no oversized admin sidebar.
- Build screens around one hero surface, timeline or document-like flow.
- Use asymmetry selectively to make key moments feel editorial and intentional.

### Mobile

- Design mobile as a primary experience, not a collapsed desktop view.
- Keep the current day, next commitment and primary action within easy reach.
- Replace sidebars with a compact bottom navigation or focused drill-down flows.
- Use bottom sheets for short tasks and full screens for attention-heavy tasks.
- Respect safe areas and keep touch targets at least `44px`.

### Density

Default to relaxed density. Students should understand a screen in seconds.
Allow denser calendar or list views only when the task requires comparison.
Never fill empty space merely to make the product appear feature-rich.

## Components

### Actions

- Each view should have one visually dominant primary action.
- Primary buttons use emerald with dark text and a subtle pressed response.
- Secondary actions use neutral surfaces or text treatment.
- Destructive actions remain quiet until confirmation is required.
- Labels describe outcomes: "Create study plan", not "Run agent".

### Cards and surfaces

- Use cards to group a meaningful unit, not every piece of content.
- Avoid repetitive grids of identical rounded rectangles.
- Vary composition with timelines, stacked sheets, full-width moments and lists.
- Keep borders and labels subtle so content remains dominant.

### Inputs

- Inputs should be spacious, direct and lightly framed.
- Keep forms short and explain why sensitive information is needed.
- Validate near the field with helpful language.
- Never expose raw provider errors to users.

### Status

Translate system states into consumer language:

| System state | User-facing language |
| --- | --- |
| Synced | Up to date |
| Cached | Saved for offline use |
| Sync pending | Will update when you're online |
| Connection error | Couldn't update just now |
| Tool unavailable | This action isn't available right now |

Status should usually be subtle. Elevate it only when it changes what the user
can trust or do.

### Empty states

Empty states should feel optimistic and useful. Include a concise explanation,
one next action and an elegant visual moment. Do not show fake analytics,
placeholder charts or developer setup instructions.

## Motion

Motion should make Zury feel responsive and alive without stealing attention.

- Standard transitions: `180-260ms`
- Page or large-surface transitions: `300-450ms`
- Use spring motion for direct manipulation and quick controls.
- Use ease-out fades and small position changes for entering content.
- Stagger only a few important elements; do not animate every card on load.
- Preserve spatial continuity when opening details or moving scheduled work.
- Support `prefers-reduced-motion` everywhere.

Avoid looping glows, floating particles, excessive parallax and animations that
delay access to content.

## Voice and Copy

Zury sounds calm, capable and encouraging. It does not sound like a developer
tool, a productivity coach shouting instructions or an AI chatbot performing a
personality.

Use:

- "Here's what needs your attention today."
- "Your schedule is saved for offline use."
- "Want to move this study session to tomorrow?"
- "I couldn't refresh your calendar. You're still seeing the latest saved copy."

Avoid:

- "Agent execution complete."
- "Tool call failed."
- "Repository synced."
- "Your productivity score decreased."
- "AI-powered" repeated throughout the interface.

## Accessibility

- Meet WCAG AA contrast at minimum.
- Never communicate status with color alone.
- Maintain visible keyboard focus and logical tab order.
- Provide labels for icon-only controls and useful alternative text for imagery.
- Ensure zoom and dynamic text do not break primary flows.
- Do not rely on motion to explain a state change.

## Product Imagery

Marketing and onboarding imagery should show real student outcomes: a clear
week, an achievable study plan, organized notes and confidence during poor
connectivity. Product screenshots should be the hero whenever possible.

Avoid terminal windows, code snippets, infrastructure diagrams, robot imagery,
generic 3D blobs and stock photos of people pointing at laptops.

## Quality Bar

Before shipping a screen, confirm:

- The primary purpose is obvious within five seconds.
- The main action is easy to find and uses consumer language.
- The screen does not resemble an admin dashboard or developer console.
- Offline and stale data are communicated honestly but calmly.
- The layout works intentionally on desktop and mobile.
- Motion improves continuity and does not delay interaction.
- Empty, loading, error and success states receive the same design care.
