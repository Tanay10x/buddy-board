# Buddy Board

Competitive leaderboard and shareable trading cards for Claude Code [`/buddy`](https://docs.anthropic.com/en/docs/claude-code) companions.

**Live:** [buddyboard.xyz](https://buddyboard.xyz)

## Submit Your Buddy

Just run this in your terminal — it walks you through everything interactively:

```bash
npx buddy-board
```

You'll be asked for:
- **Username** — your unique leaderboard identity (3-20 chars, lowercase)
- **GitHub** — optional, links your profile and adds a verified badge
- **Org** — optional, joins your team's dashboard

Or use flags directly:

```bash
npx buddy-board --username yourname --github yourgithub --org your-org
```

Requires Node.js 18+. If you use Claude Code, you already have it.

## What You Get

- A **trading card** with your buddy's ASCII sprite, stats, rarity, and personality
- A **profile page** at `buddyboard.xyz/u/yourname`
- An **embeddable card image** for your GitHub README
- A **badge** for your README header
- Your spot on the **global leaderboard**

## Embed in Your README

**Full card:**
```markdown
[![buddy](https://buddyboard.xyz/card/yourname)](https://buddyboard.xyz/u/yourname)
```

**Compact badge:**
```markdown
[![buddy](https://buddyboard.xyz/badge/yourname)](https://buddyboard.xyz/u/yourname)
```

## Features

### Leaderboard
Global rankings sorted by total stats, filterable by species, rarity, and org.

### BuddyDex
Pokedex-style gallery of all 18 species. Undiscovered species show as silhouettes. Track which combos have been found across the community.

### Trading Cards
Every buddy gets a card with rarity-specific visual treatments:
- **Common** — clean, minimal border
- **Uncommon** — green border
- **Rare** — blue glow
- **Epic** — purple glow
- **Legendary** — gold pulsing glow + holographic shimmer + scanlines

### Organizations
Team dashboards for companies and groups. See your org's leaderboard, species coverage, and combined stats at `buddyboard.xyz/org/your-org`.

### Compare
Side-by-side buddy comparison with stat-by-stat breakdown at `buddyboard.xyz/compare/user1/user2`.

### Share
One-click share to X (Twitter) with auto-generated OG card that renders inline. Copy-to-clipboard on all embed codes and URLs.

## How It Works

Your buddy's species, rarity, stats, eyes, and hat are **deterministic** — they're computed from a hash of your Claude Code account ID using the same algorithm as Claude Code itself. The name and personality are AI-generated on first `/buddy` hatch and stored in your `~/.claude.json`.

The CLI reads your local config, computes the buddy data, and submits it to the leaderboard. Nothing is modified on your machine.

### The Numbers
- **18 species:** duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk
- **5 rarities:** common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%)
- **6 eye types** and **8 hat types** (commons don't get hats)
- **1% shiny chance**
- **1,728 unique visual combinations**

## Tech Stack

| Layer | Tech |
|---|---|
| CLI | Node.js, zero dependencies |
| Web | Next.js 16, Tailwind CSS v4, Vercel |
| Database | Supabase Postgres (RLS, bcrypt auth) |
| OG Cards | `@vercel/og` (Satori) |
| Fonts | Satoshi, Instrument Sans, JetBrains Mono |

## Development

```bash
# CLI (local)
cd cli && node index.js

# Web
cd web && npm install && npm run dev

# Requires .env.local in web/ with:
# NEXT_PUBLIC_SUPABASE_URL=...
# NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Project Structure

```
buddy-board/
├── cli/                  # npx buddy-board CLI
│   ├── index.js          # Interactive prompts + submission
│   ├── roll.js           # Deterministic buddy algorithm
│   ├── config.js         # Reads ~/.claude.json
│   └── submit.js         # Supabase RPC + GitHub verification
├── web/                  # Next.js web app
│   ├── app/              # Pages (home, profile, stats, dex, org, etc.)
│   ├── components/       # BuddyCard, LeaderboardTable, etc.
│   └── lib/              # Types, queries, sprites, constants
└── supabase/             # SQL migrations
```

## License

MIT
