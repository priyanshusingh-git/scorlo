# Scorlo Design Tokens

Scorlo uses a custom light-first design system for a mobile-first student app. The goal is premium utility, not a generic dashboard template.

## Brand direction

- Product: `Scorlo`
- Tone: premium utility
- Visual mood: ivory surfaces, ink typography, teal accents, restrained status colors
- Layout logic: app shell first, desktop second

## Core tokens

### Colors

| Token | Value | Purpose |
| --- | --- | --- |
| `--bg-app` | `#f6f2ea` | app background |
| `--bg-surface` | `#ffffff` | card surface |
| `--bg-surface-muted` | `#f1ede5` | muted chips, tabs |
| `--bg-surface-elevated` | `#fffdf9` | hero surfaces |
| `--text-primary` | `#111827` | primary text |
| `--text-secondary` | `#475569` | body text |
| `--text-muted` | `#7b8794` | labels |
| `--border-subtle` | `#e7e1d6` | default border |
| `--border-strong` | `#d7d0c5` | stronger border |
| `--accent` | `#0f8b8d` | primary accent |
| `--accent-strong` | `#0b6668` | active button/nav |
| `--accent-soft` | `#d9f1f0` | accent background |
| `--success` | `#1f8f5f` | positive status |
| `--success-soft` | `#dff4e8` | positive surface |
| `--warning` | `#c0841a` | ranking/attention |
| `--warning-soft` | `#f9edd2` | warning surface |
| `--danger` | `#b54a36` | active back or fail |
| `--danger-soft` | `#f7dfd9` | fail surface |
| `--info` | `#2563eb` | informational tag |
| `--info-soft` | `#dbeafe` | info surface |

### Typography

- UI font: `Host Grotesk`
- Display accent: `Instrument Serif`
- Display size: `2.2rem` to `2.4rem`
- Section title: `1.125rem`
- Card title: `1rem`
- Body copy: `0.875rem`
- Labels: `0.75rem`

### Radius

- hero surfaces: `1.75rem` to `1.9rem`
- cards: `1.5rem`
- inner cards: `1.125rem` to `1.375rem`
- badges: full pill

### Shadows

- `shadow-scorlo`: primary elevated hero surfaces
- `shadow-soft`: standard cards and buttons

## Component rules

### App shell

- fixed bottom nav
- 20px side padding on mobile
- max width `28rem`

### Hero card

- elevated surface
- strongest hierarchy on screen
- display name or headline at the top

### Metric tile

- 2-column mobile grid
- live chip in top-right
- large numeric emphasis

### Results

- accordion-driven, not table-driven
- subject rows use soft app tint backgrounds

### Rankings

- segmented tabs for metric switching
- self row highlighted in warning-soft
- peer rows anonymous

## Implementation notes

- CSS variables live in `/Users/priyanshu/Downloads/AktuBot-main/scorlo/app/globals.css`
- Tailwind tokens are mapped in `/Users/priyanshu/Downloads/AktuBot-main/scorlo/tailwind.config.ts`
- Components should consume semantic token classes, not raw hex values
- New screens should prefer existing primitives before introducing new visual patterns
