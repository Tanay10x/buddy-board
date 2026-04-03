# Design System — Buddy Board

## Product Context
- **What this is:** Competitive leaderboard + shareable trading cards for Claude Code `/buddy` companions
- **Who it's for:** Developers who use Claude Code — technically savvy, appreciate terminal aesthetics, enjoy gamification
- **Space/industry:** Developer tools, gamification, collectible card games
- **Project type:** Web app (leaderboard + profile cards + embeddable OG images)

## Aesthetic Direction
- **Direction:** Retro-Futuristic — CRT terminal nostalgia meets premium trading card collectible
- **Decoration level:** Expressive — holographic foil effects for rare+ cards, scanline textures, glow halos around sprites
- **Mood:** Dark, warm, glowing. Like opening a rare card pack under a desk lamp at midnight. The terminal is familiar territory; the card treatments make it feel special.
- **Reference sites:** [pokemon-cards-css](https://poke-holo.simey.me/), [github-readme-stats](https://github.com/anuraghazra/github-readme-stats), [githubcard.com](https://githubcard.com/)

## Typography
- **Display/Hero:** Satoshi (900, 700) — geometric sans with warmth, breaks from pure terminal aesthetic, adds approachability. Loaded from Fontshare.
- **Body:** Instrument Sans (400, 500, 600) — clean, readable, neutral. Google Fonts.
- **UI/Labels:** Satoshi (600, 500) — same as display for consistency
- **Data/Tables:** JetBrains Mono (400, 500, 700) — tabular-nums, terminal heritage, used for all stats/sprites/code. Google Fonts.
- **Code:** JetBrains Mono
- **Loading:** Google Fonts for JetBrains Mono + Instrument Sans, Fontshare CDN for Satoshi
- **Scale:**
  - `xs`: 11px / 0.6875rem — mono labels, timestamps
  - `sm`: 13px / 0.8125rem — body small, card text
  - `base`: 14px / 0.875rem — body, table cells
  - `md`: 16px / 1rem — body large, descriptions
  - `lg`: 18px / 1.125rem — subheadings
  - `xl`: 20px / 1.25rem — card names, section headers
  - `2xl`: 32px / 2rem — page titles
  - `3xl`: 48px / 3rem — hero heading

## Color
- **Approach:** Balanced — one strong accent (terminal green), rarity colors as the expressive palette
- **Base:** `#0c0c0c` — near-black, deep charcoal
- **Surface:** `#1a1a1a` — card backgrounds, elevated panels
- **Elevated:** `#242424` — modals, dropdowns, hover states
- **Hover:** `#2a2a2a` — table row hover, interactive states
- **Border:** `#2e2e2e` — primary borders
- **Border Subtle:** `#1f1f1f` — dividers, card internal separators
- **Text Primary:** `#e5e7eb` — headings, important content
- **Text Secondary:** `#9ca3af` — body text, descriptions
- **Text Muted:** `#6b7280` — labels, timestamps, tertiary content
- **Accent Terminal:** `#4ade80` — primary accent, CTAs, terminal green
- **Accent Terminal Dim:** `#22c55e` — hover state for terminal accent
- **Rarity Colors:**
  - Common: `#9ca3af` (gray)
  - Uncommon: `#22c55e` (green)
  - Rare: `#3b82f6` (blue) + subtle glow `rgba(59,130,246,0.15)`
  - Epic: `#a855f7` (purple) + glow `rgba(168,85,247,0.2)`
  - Legendary: `#eab308` (gold) + animated pulse glow `rgba(234,179,8,0.25)`
- **Semantic:**
  - Success: `#22c55e` / bg `rgba(34,197,94,0.08)`
  - Warning: `#eab308` / bg `rgba(234,179,8,0.08)`
  - Error: `#ef4444` / bg `rgba(239,68,68,0.08)`
  - Info: `#3b82f6` / bg `rgba(59,130,246,0.08)`
- **Dark mode:** This IS the dark mode. No light mode planned for v1.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:**
  - `2xs`: 2px
  - `xs`: 4px
  - `sm`: 8px
  - `md`: 16px
  - `lg`: 24px
  - `xl`: 32px
  - `2xl`: 48px
  - `3xl`: 64px

## Layout
- **Approach:** Grid-disciplined — clean data tables for leaderboard, card layouts for profiles, centered hero
- **Grid:** Single-column primary content, max-width container
- **Max content width:** 1100px
- **Border radius:**
  - `sm`: 4px — small chips, tags
  - `md`: 8px — buttons, inputs, alerts, swatches
  - `lg`: 12px — cards, panels
  - `xl`: 16px — buddy cards, hero elements
  - `full`: 9999px — avatars, pills

## Motion
- **Approach:** Expressive — motion is part of the collectible card identity
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`
- **Duration:** micro `50-100ms`, short `150-250ms`, medium `250-400ms`, long `400-700ms`
- **Key animations:**
  - **Stat bars:** Fill animation on page load (1s ease-out)
  - **Card hover:** translateY(-4px) lift on hover (0.3s ease)
  - **Legendary pulse:** Box-shadow breathing glow (3s ease-in-out infinite)
  - **Holographic shimmer:** Gradient sweep across legendary cards (4s ease-in-out infinite)
  - **Scanlines:** Subtle repeating-linear-gradient overlay on all cards (static, no animation)

## Card Rarity Visual Treatments
- **Common:** 2px solid gray border, no glow, no shimmer. Clean and minimal.
- **Uncommon:** 2px solid green border, no glow. Slightly elevated from common.
- **Rare:** 2px solid blue border + outer glow `box-shadow: 0 0 20px rgba(59,130,246,0.15)` + inner glow `inset 0 0 20px rgba(59,130,246,0.05)`.
- **Epic:** 2px solid purple border + outer glow `box-shadow: 0 0 24px rgba(168,85,247,0.2)` + inner glow. Gradient background hint.
- **Legendary:** 2px solid gold border + animated pulse glow + holographic shimmer overlay (rainbow gradient sweep via `::after` pseudo-element) + scanline texture via `::before`.
- **Shiny:** Additional rainbow/holographic treatment regardless of rarity. "✨ Shiny" label.
- **All cards:** Scanline overlay via `::before` — `repeating-linear-gradient` at 2px intervals, very subtle (3% opacity).

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-03 | Initial design system created | Created by /design-consultation based on competitive research (pokemon-cards-css, github-readme-stats, dev gamification leaderboards) |
| 2026-04-03 | Satoshi as display font | Breaks from pure terminal mono, adds warmth and approachability while ASCII sprites stay JetBrains Mono |
| 2026-04-03 | CSS holographic foil for rare+ cards | Inspired by pokemon-cards-css — the viral mechanic. People will screenshot and share legendary cards. |
| 2026-04-03 | Scanline texture on all cards | Ties terminal nostalgia to the visual premium. Subtle enough not to distract, distinctive enough to notice. |
| 2026-04-03 | No light mode in v1 | Developer audience strongly prefers dark. Terminal aesthetic requires dark. Simplifies the build. |
