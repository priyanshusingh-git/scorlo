# Scorlo Layout Spec

This document defines the target "industry-standard" layout model for Scorlo without throwing away the current visual language.

The goal is not to imitate generic SaaS templates. The goal is to make the product feel more deliberate, more scalable, and easier to operate across mobile and desktop.

## Design principles

- Keep mobile first, but do not let mobile constraints weaken desktop workflows.
- Keep one primary task per screen for student flows.
- Use denser, more structured desktop layouts for admin workflows.
- Separate overview, action, and history areas.
- Prefer repeatable page archetypes over one-off page compositions.
- Use tables when users compare many records.
- Use list-detail or split-panel layouts when users review and act on one record at a time.
- Preserve the existing Scorlo tone: light surfaces, dark shell, restrained premium feel.

## Global shell model

### Student shell

- Mobile:
  - fixed top bar
  - persistent bottom nav
  - one primary content column
- Desktop:
  - sticky left rail
  - one main content column
  - allow inner grids inside the main column

### Admin shell

- Mobile:
  - fixed top bar
  - persistent bottom nav
  - stacked sections
- Desktop:
  - sticky left rail
  - content should use page-specific desktop layouts
  - do not force every admin page into a single vertical stream

## Page archetypes

Every page should fit one of these archetypes.

### 1. Overview page

Use for dashboards and summaries.

- Desktop:
  - top stat grid
  - below that, 2-column content area
  - left and right columns should hold independent sections
- Mobile:
  - stat cards stack into 1-2 columns
  - activity sections stack vertically

Use for:

- Admin overview
- Future analytics pages

### 2. Table page

Use when users compare many rows quickly.

- Desktop:
  - filters above table or in a compact filter rail
  - full-width data table
  - sticky controls only if they reduce scrolling cost
- Mobile:
  - filters stack
  - keep horizontal scroll if needed
  - optionally switch to card rows for very narrow screens

Use for:

- Admin students
- Future exports/search views

### 3. Queue page

Use when users process records one by one from a list of incoming work.

- Desktop:
  - left side: queue controls, filters, pagination, counts
  - right side: issue list or selected item detail
- Mobile:
  - queue controls first
  - issue cards stack below

Use for:

- Admin issues
- Future approval queues

### 4. Detail page

Use when a single entity is the focus.

- Desktop:
  - top summary card
  - below that, 2-column composition where possible
  - left column for overview or metrics
  - right column for history, logs, or secondary data
- Mobile:
  - stacked summary, metrics, history

Use for:

- Admin student detail
- Admin profile
- Future user detail views

### 5. Settings and controls page

Use for runtime controls, maintenance, and system state.

- Desktop:
  - left sticky column for controls
  - right column for impact, logs, and recent actions
- Mobile:
  - controls stack above logs

Use for:

- Admin maintenance
- App controls

## Student product spec

Student pages should remain simpler than admin pages.

### Student home

Target layout:

- hero card
- stat grid
- 2-column section on desktop:
  - left: current standing
  - right: progress chart

Keep:

- current single primary flow
- low cognitive load

Do not add:

- sidebars inside the content area
- extra widgets just to fill space

### Student profile

Target layout:

- top profile summary card
- details grid below
- actions only when relevant

Rule:

- if the user is unlinked or pending, keep the page single-task and form-led
- if linked, allow a tidy 2-column information grid

### Student results

Target layout:

- summary actions header
- one primary archive/history section

Rule:

- keep single-column
- results are sequential content, not a dashboard

### Student rankings

Target layout:

- filters/tabs at top
- one main comparison panel

Rule:

- stay mostly single-column
- use inner split sections only if multiple ranking scopes are shown together

### Student support

Target layout:

- issue form first
- active issues list second

Rule:

- show only active issues by default
- resolved and dismissed issues should not clutter the main support view

Optional future enhancement:

- add a separate "Past issues" filter or archive toggle

## Admin product spec

Admin pages should feel more operational and more desktop-aware.

### Admin overview

Target layout:

- top stat grid
- below it, 2-column activity area
  - left: recent login activity
  - right: recent admin actions

Desktop rule:

- the bottom area should not be one long vertical stack

### Admin students

Target layout:

- search and filters above
- full-width table
- export control in the header

Desktop rule:

- keep table dominant
- avoid side-by-side detail cards on this page

### Admin issues

Target layout:

- desktop:
  - left sticky queue controls
  - right issue cards or detail area
- mobile:
  - queue controls above issue cards

Issue card anatomy:

- header: title, user context, status badges
- body: issue description
- action area: status update, notes, save

### Admin users

Target layout:

- desktop:
  - left column: search and app controls
  - right column: user result cards
- each user card:
  - top: badges and identity
  - left sub-column: account summary
  - right sub-column: action panels

Action panels:

- dashboard access
- link controls
- data request review
- danger zone

### Admin staff

Target layout:

- desktop:
  - left column: create staff form
  - right column: staff directory cards
- each staff card:
  - summary area
  - editable access area
  - danger zone only where allowed

### Admin maintenance

Target layout:

- desktop split layout
  - left sticky controls
  - right recent maintenance activity

Rule:

- destructive actions must feel visually separated from routine actions

## Component rules

### Cards

Use three card roles consistently:

- summary card: shows identity, stats, or context
- action card: contains forms, toggles, or update controls
- history card: shows timeline-like items, logs, or activity rows

Do not mix all three roles into a single long card unless the page is mobile-only.

### Section headers

Each section should clearly answer one of:

- What is this?
- What can I do here?
- What changed here?

### Filters

Filters should be:

- grouped together
- visually lighter than destructive actions
- above the content they affect

### Danger zones

Danger actions should:

- appear last
- be isolated in their own panel or section
- never sit beside neutral save controls without separation

## Responsive rules

### Mobile

- default to one column
- keep controls stacked
- avoid overly dense side-by-side form fields
- use bottom nav and fixed top chrome carefully to preserve usable height

### Tablet

- introduce 2-column grids only for short cards or summary blocks
- avoid turning complex workflows into cramped split layouts

### Desktop

- use width intentionally
- use 2-column layouts when content blocks are independent
- use sticky side columns when the page has repeated review or control tasks

## What Scorlo should avoid

- making every page multi-column just because desktop space exists
- long stacks of mixed-purpose cards on admin pages
- hiding workflow state inside large undifferentiated sections
- overusing decorative effects instead of structural hierarchy
- generic template dashboards that do not match the product’s academic/admin use case

## Immediate priority list

These are the highest-value layout targets.

1. Keep student pages mostly as they are, with only minor refinements.
2. Keep admin students table-first.
3. Keep admin maintenance split.
4. Make admin overview a permanent 2-column desktop layout.
5. Keep admin issues as a queue-style page.
6. Keep admin users and admin staff structured as summary + action layouts instead of plain stacked forms.

## Success criteria

Scorlo will feel closer to an industry-standard product UI when:

- student pages are simple and calm
- admin pages use desktop space intentionally
- tables are used for comparison
- queues are used for triage work
- detail pages separate summary from action
- destructive actions are clearly isolated
- mobile remains fast and readable
