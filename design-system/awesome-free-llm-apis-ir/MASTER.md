# Awesome Free LLM APIs IR — Design System

> Source of truth for product UI decisions. Derived from the MIT-licensed `nextlevelbuilder/ui-ux-pro-max-skill` framework and adapted for this repository's static HTML/CSS/JavaScript stack, Persian RTL interface, evidence-heavy provider catalog, and developer audience.

## Product classification

This product is a hybrid of:

1. **API Developer Portal** — endpoints, limits, model and authentication information must be immediately discoverable.
2. **Directory / Listing Site** — users need fast search, filtering and comparison across many providers.
3. **Knowledge Base / Documentation** — claims require dates, sources, definitions and evidence.

The interface must behave like a decision tool, not a marketing landing page.

## Product pattern

**Search-first comparison workspace**

1. Compact product header
2. Short value proposition and two primary actions
3. Search and high-value filters above the fold
4. Evidence and freshness summary
5. Provider results
6. Guided recommendation and onboarding paths
7. Educational and SEO content
8. Sources, FAQ and contribution links

The catalog is the primary task. Explanatory content must never delay access to it.

## Visual direction

### Style

- Swiss-inspired minimalism
- Trust-and-authority visual language
- Data-dense only inside result and comparison components
- Flat surfaces with restrained elevation
- Strong typographic hierarchy
- Semantic status colors

### Avoid

- Large dark gradient hero blocks
- Purple/pink AI gradients
- Decorative glowing blobs
- Excessive 22–34px corner radii
- Multiple equally prominent cards before the catalog
- Emoji as structural icons
- Hover-only meaning
- Tiny metadata below 12px
- Color as the only status indicator
- Generic provider initials presented as brand logos

## Color tokens

### Light

| Token | Value | Use |
|---|---:|---|
| `--bg` | `#F7F8FA` | Page background |
| `--surface` | `#FFFFFF` | Primary surface |
| `--surface-raised` | `#FFFFFF` | Elevated controls |
| `--surface-muted` | `#F2F4F7` | Secondary surface |
| `--text` | `#101828` | Primary text |
| `--text-secondary` | `#475467` | Secondary text |
| `--text-tertiary` | `#667085` | Metadata |
| `--border` | `#D0D5DD` | Default border |
| `--border-strong` | `#98A2B3` | Emphasized border |
| `--primary` | `#155EEF` | Primary action and focus |
| `--primary-hover` | `#004EEB` | Primary hover |
| `--primary-soft` | `#EFF4FF` | Selected / informational background |
| `--success` | `#067647` | Verified / success text |
| `--success-soft` | `#ECFDF3` | Verified / success background |
| `--warning` | `#B54708` | Stale / warning text |
| `--warning-soft` | `#FFFAEB` | Stale / warning background |
| `--danger` | `#B42318` | Blocked / error text |
| `--danger-soft` | `#FEF3F2` | Blocked / error background |

### Dark

Dark mode uses neutral navy surfaces rather than pure black. Contrast must be checked independently.

- Background: `#0C111D`
- Surface: `#161B26`
- Muted surface: `#1F242F`
- Primary text: `#F5F5F6`
- Secondary text: `#CECFD2`
- Border: `#333741`
- Primary: `#84ADFF`

## Typography

- Persian and UI: system sans stack with `Vazirmatn` as an optional locally available preference, never a blocking external dependency.
- Base body size: `16px`.
- Body line-height: `1.65` Persian, `1.55` Latin/code.
- Metadata minimum: `12px`.
- Headings use tight but readable line-height; no decorative letter spacing on Persian text.
- Long educational text uses a maximum measure of `72ch`.

## Spacing and shape

Use a 4/8px rhythm.

- `4, 8, 12, 16, 24, 32, 48, 64`
- Control height: minimum `44px`, preferred `48px`
- Default radius: `12px`
- Large container radius: `16px`
- Pill radius is reserved for statuses and compact filters
- Shadows are secondary to borders; maximum default elevation is subtle

## Layout

- Maximum content width: `1280px`
- Adaptive gutters: `16px / 24px / 32px`
- Mobile-first breakpoints: `640px`, `960px`, `1200px`
- No horizontal document scrolling
- Search and core actions remain reachable without traversing educational content
- Result cards: one column mobile, two medium, three only where content remains readable

## Components

### Header

- Sticky, translucent only when contrast is preserved
- Product name may collapse on narrow screens
- Five or fewer primary destinations
- Current page is visually and semantically indicated
- Theme and language controls have explicit labels and minimum targets

### Hero / command center

- Short, light surface—not a decorative banner
- One H1, one explanatory paragraph
- Primary CTA: guided API Finder
- Secondary CTA: Quick Start or Compare
- Search/catalog starts immediately after hero

### Catalog search

- Always visible
- Label remains visible
- Clear search control
- Advanced filters use progressive disclosure
- Active filters are represented in URL state
- Results count is announced through `aria-live`

### Provider card

Order of information:

1. Provider name
2. Iran access status and evidence freshness
3. Free-tier type and headline limit
4. OpenAI compatibility and payment-method knowledge
5. Capabilities
6. Detail and official documentation actions

Rules:

- No fake logo treatment for provider initials
- Status includes text plus a shape/dot; never color alone
- Primary action is internal detail/evidence page
- Official docs are visually secondary but clear
- Technical details stay available without dominating the first scan

### Status badges

Badges use semantic text, color and a leading dot. No emoji.

- Working: success
- VPN / partial: informational
- Stale / intermittent / unknown: warning or neutral
- Blocked / unsupported / signup or account barrier: danger

### Forms

- Visible labels
- Helper text where terminology is specialized
- Inline error placement
- No placeholder-only labels
- Focus management and visible focus rings

## Interaction and motion

- Feedback: `150–220ms`
- Use opacity, color, border and subtle elevation
- Avoid layout-shifting hover transforms
- No decorative looping animation
- Respect `prefers-reduced-motion`
- Loading states reserve layout space

## Accessibility gates

- Text contrast at least WCAG AA
- Keyboard path covers navigation, search, filters, cards and disclosure widgets
- Focus rings are never removed
- Interactive targets at least `44×44px`
- Color is never the sole carrier of state
- RTL visual order matches DOM and screen-reader order
- Icons use SVG or CSS shapes and have accessible labels where meaningful

## Responsive gates

Test at:

- `375×667`
- `768×1024`
- `1024×768`
- `1440×900`

Required:

- No horizontal page overflow
- Navigation remains usable
- Search stays visible
- Cards do not truncate primary facts
- Sticky elements do not cover content
- Text zoom to 200% remains functional

## Implementation strategy

The project uses static HTML, CSS and ESM JavaScript. Do not introduce a framework solely for visual work.

- Global semantic tokens live in `site/styles.css`.
- Homepage-specific composition lives in `site/ux-clarity.css` and `site/ui-pro-max.css`.
- Behavior remains in small ESM modules.
- Build-time transforms must be idempotent and must not become the primary component architecture.
- Every visual contract must assert behavior and hierarchy, not exact decorative markup.

## Attribution

Design methodology adapted from **UI UX Pro Max** by Next Level Builder, MIT License:

- Repository: `nextlevelbuilder/ui-ux-pro-max-skill`
- Copyright © 2024 Next Level Builder
