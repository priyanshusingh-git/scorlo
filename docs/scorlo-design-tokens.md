# Scorlo Design System

Scorlo uses a light-first academic product UI with a restrained premium tone. The current system is built around stable surfaces, visible borders, dark shell navigation, and a mobile-first content layout.

## Design direction

- Product: `Scorlo`
- Tone: calm, academic, professional
- Primary layout model: persistent shell + content surfaces
- Preferred depth model: surface contrast + border first, shadow second
- Mobile behavior: flatter backgrounds, reduced blur, fast route transitions

## Core tokens

### Color tokens

These values are defined in [app/globals.css](/Users/priyanshu/Downloads/AktuBot-main/scorlo/app/globals.css) and mapped into Tailwind in [tailwind.config.ts](/Users/priyanshu/Downloads/AktuBot-main/scorlo/tailwind.config.ts).

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg-app` | `#f2ede5` | overall app background |
| `--bg-surface` | `#fffaf3` | main content surface |
| `--bg-surface-muted` | `#e8dece` | muted controls and grouped controls |
| `--bg-surface-elevated` | `#fffdfa` | elevated light surface |
| `--text-primary` | `#102031` | primary text |
| `--text-secondary` | `#536273` | body copy |
| `--text-muted` | `#7d8894` | labels and secondary notes |
| `--border-subtle` | `#cbb9a1` | standard border |
| `--border-strong` | `#ae977b` | stronger border |
| `--accent` | `#0e807b` | primary accent |
| `--accent-strong` | `#095c60` | active accent state |
| `--accent-soft` | `#d2eeea` | accent background |
| `--success` | `#1f8f5f` | success state |
| `--success-soft` | `#def6e8` | success background |
| `--warning` | `#b57529` | warning or attention state |
| `--warning-soft` | `#f9ebd1` | warning background |
| `--danger` | `#b34f39` | destructive or error state |
| `--danger-soft` | `#f8ddd6` | error background |
| `--info` | `#2563eb` | information state |
| `--info-soft` | `#dbeafe` | information background |
| `--shell-ink` | `#09111b` | desktop shell background start |
| `--shell-ink-soft` | `#122234` | desktop shell background end |

### Tailwind semantic names

The Tailwind layer maps the CSS variables into semantic names:

- `app`
- `surface`
- `surface-muted`
- `elevated`
- `ink`
- `slate`
- `mist`
- `line`
- `line-strong`
- `accent`
- `accent-strong`
- `accent-soft`
- `success`
- `success-soft`
- `warning`
- `warning-soft`
- `danger`
- `danger-soft`
- `info`
- `info-soft`

## Typography

- UI font: `Host Grotesk`
- Display font: `Instrument Serif`
- Primary body font token: `font-sans`
- Display accent token: `font-display`

### Typical scale

- Display wordmark and hero names: `1.7rem` to `2.45rem`
- Page or section title: `1.125rem`
- Strong card title: `1rem`
- Body copy: `0.875rem`
- Metadata labels: `0.6875rem` to `0.75rem`

## Radius

Tailwind extends the shared radius system with:

| Token | Value | Use |
| --- | --- | --- |
| `rounded-inner` | `1.25rem` | inputs, grouped controls |
| `rounded-scorlo` | `1.5rem` | cards |
| `rounded-shell` | `2rem` | large auth surfaces |

In practice, several pages also use explicit rounded values around:

- `1.2rem` to `1.35rem` for nested cards
- `1.75rem` to `1.9rem` for primary content cards
- `2.3rem` for desktop side rails

## Shadow and depth

Tailwind tokens:

| Token | Value | Use |
| --- | --- | --- |
| `shadow-scorlo` | `0 16px 36px rgba(17, 24, 39, 0.08)` | elevated cards and login panels |
| `shadow-soft` | `0 8px 20px rgba(17, 24, 39, 0.06)` | lighter depth |

### Depth rules

- use borders first
- use shadows sparingly
- do not rely on glow to separate nested boxes
- on mobile, keep blur and visual cost low

## Surface hierarchy

Scorlo now uses a clearer surface hierarchy.

### `surface-1`

- top-level content containers
- slightly brighter than the app background

### `surface-2`

- nested cards inside sections
- standard inner card level

### `surface-3`

- muted grouped controls
- segmented switches and compact nested groups

### Supporting surface classes

- `surface-panel`: elevated translucent light panel
- `surface-subtle`: muted low-emphasis block
- `glass-card`: more decorative light card, used sparingly
- `ink-panel`: dark desktop shell rail
- `shell-panel`: soft translucent shell surface
- `soft-grid`: chart or panel background grid

## Layout system

### Student shell

- shared student shell under `app/(student)`
- persistent desktop left rail
- mobile top bar
- mobile bottom navigation
- route content transition wrapper for fast tab changes

### Admin shell

- same structural shell language as the student side
- main admin and delegated admin share shell behavior
- navigation differs by role

## Component rules

### Navigation

- desktop uses a fixed left rail
- mobile uses top bar + bottom nav
- active item states rely on background and border contrast, not heavy motion

### Cards

- primary cards should use `surface-1` or `surface-2`
- nested cards should keep `border-line`
- avoid white-on-cream invisible borders

### Forms

- use full labels
- place inline field errors under the field
- avoid stacked duplicate status messages

### Login

- simple centered auth card
- brand mark above the form
- one clear auth state at a time

### Student pages

- Home: hero + metric tiles + standing/progress
- Results: summary actions + semester archive
- Rankings: personal ranking views only
- Support: issue form + issue history

### Admin pages

- table-first where data is dense
- descriptive controls only where they help action-taking
- destructive actions restricted and visually distinct

## Motion

- route transition animation: `route-content-in`
- disabled on mobile for cheaper rendering
- loading states use shimmer and simple pulse utilities

Available animation utilities from CSS:

- `animate-breathe`
- `animate-pulse-glow`
- `animate-draw-logo`
- `animate-route-content-in`

## Mobile rules

- flatter backgrounds than desktop
- reduced blur cost
- no mobile route animation
- navigation should stay quick and visually stable

## Implementation references

- Global tokens and utilities: [app/globals.css](/Users/priyanshu/Downloads/AktuBot-main/scorlo/app/globals.css)
- Tailwind token mapping: [tailwind.config.ts](/Users/priyanshu/Downloads/AktuBot-main/scorlo/tailwind.config.ts)
- Student shell: [components/app-shell.tsx](/Users/priyanshu/Downloads/AktuBot-main/scorlo/components/app-shell.tsx)
- Admin shell: [components/admin-shell.tsx](/Users/priyanshu/Downloads/AktuBot-main/scorlo/components/admin-shell.tsx)
- Shared section primitive: [components/section-block.tsx](/Users/priyanshu/Downloads/AktuBot-main/scorlo/components/section-block.tsx)

## Design constraints

- prefer semantic classes over raw hex values
- keep the UI light-first
- do not add decorative glow as a separation mechanism
- prefer visible borders and stable surfaces
- preserve the existing visual language instead of introducing unrelated patterns
