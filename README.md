<p align="center">
  <img src=".github/screenshots/hero.gif" alt="Buddy Board" width="720" />
</p>

<h1 align="center">Buddy Board</h1>

<p align="center">
  <strong>Pokédex-style trading cards for your Claude Code companion.</strong><br/>
  Hatch your <code>/buddy</code>, get a unique ASCII art card, and compete on the global leaderboard.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/buddy-board"><img src="https://img.shields.io/npm/v/buddy-board?color=%234ade80&label=npx%20buddy-board&style=flat-square" alt="npm" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square" alt="License: MIT" /></a>
  <a href="https://buddyboard.xyz"><img src="https://img.shields.io/badge/live-buddyboard.xyz-green?style=flat-square" alt="Live" /></a>
</p>

```
                .----.
               ( *  * )    B U D D Y  B O A R D
               (      )    
                `----´     Competitive leaderboard & trading cards
               ~~~~~~~     for Claude Code /buddy companions
```

---

### Demo

https://github.com/user-attachments/assets/294e2874-c150-4447-86ae-c928a2cad5db

---

## Get Started

Just run this — it walks you through everything interactively:

```bash
npx buddy-board
```

```
  buddy-board
  Submit your Claude Code companion to the leaderboard.

  Username (3-20 chars, lowercase): tanayk07
  GitHub (optional, Enter to skip): TanayK07
  Org (optional, Enter to skip): originautonomy

  Reading Claude Code config... ok
  Computing buddy data... ok
  Verifying @TanayK07... verified
  Submitting... ok

  ┌──────────────────────────────────────────────┐
  │ ***** LEGENDARY                      DRAGON  │
  │                                              │
  │   /^\  /^\       Inferno                     │
  │  <  *  *  >                                  │
  │  (   ~~   )                                  │
  │   `-vvvv-'                                   │
  │                                              │
  │  DEBUGGING   ████████████░░░  92             │
  │  PATIENCE    ████████░░░░░░░  55             │
  │  CHAOS       █████████████░░  88             │
  │  WISDOM      ███████████░░░░  78             │
  │  SNARK       █████████░░░░░░  65             │
  │                                              │
  │  @mythicdev              Total: 378          │
  └──────────────────────────────────────────────┘

  Submitted successfully.

  View  https://buddyboard.xyz/u/tanayk07
  Card  https://buddyboard.xyz/card/tanayk07
  Team  https://buddyboard.xyz/org/originautonomy
```

Requires Node.js 18+. If you use Claude Code, you already have it.

---

## Add to Your GitHub Profile

Show off your buddy in your GitHub profile README. Every profile view = a Buddy Board impression.

```markdown
<!-- Full trading card -->
[![buddy](https://buddyboard.xyz/card/yourname)](https://buddyboard.xyz/u/yourname)

<!-- Compact badge -->
[![buddy](https://buddyboard.xyz/badge/yourname)](https://buddyboard.xyz/u/yourname)
```

Replace `yourname` with your Buddy Board username. That's it — one line in your README.

---

## Screenshots

<table>
  <tr>
    <td><img src=".github/screenshots/home.png" alt="Home + Leaderboard" width="400" /></td>
    <td><img src=".github/screenshots/profile.png" alt="Profile Card" width="400" /></td>
  </tr>
  <tr>
    <td><em>Home — Featured cards + leaderboard with org/species/rarity filters</em></td>
    <td><em>Profile — Trading card with stats, rankings, share + embed codes</em></td>
  </tr>
  <tr>
    <td><img src=".github/screenshots/dex.png" alt="BuddyDex" width="400" /></td>
    <td><img src=".github/screenshots/stats.png" alt="Global Stats" width="400" /></td>
  </tr>
  <tr>
    <td><em>BuddyDex — Pokedex-style species gallery, undiscovered = silhouettes</em></td>
    <td><em>Stats — Hall of fame, distributions, fun facts, combo tracker</em></td>
  </tr>
</table>

---

## Features

**Leaderboard** — Global rankings sorted by total stats. Filter by species, rarity, and organization.

**BuddyDex** — Pokedex-style gallery of all 18 species. Undiscovered species show as silhouettes. Track which of the 1,728 possible combos have been found.

**Trading Cards** — Every buddy gets a card with rarity-specific visual treatments:

```
  Common     ─  clean border
  Uncommon   ─  green border  
  Rare       ─  blue glow
  Epic       ─  purple glow
  Legendary  ─  gold pulse + holographic shimmer + scanlines
```

**Organizations** — Team dashboards at `/org/your-org`. See your org's leaderboard, species coverage, and combined stats. Join with `--org` flag.

**Compare** — Side-by-side buddy comparison at `/compare/user1/user2`. Stat-by-stat breakdown with win/loss indicators.

**Share** — One-click share to X with auto-generated OG card (1200x675). Copy-to-clipboard on all embed codes.

---

## Species Gallery

18 species, 6 eye types, 8 hat types — **1,728 unique combinations**. Which one will you get?

```
    __            ({E}>          .----.         /\_/\          /^\  /^\
  <(· )___        ||           ( ·  · )       ( ·   ·)       <  ·  ·  >
   (  ._>        _(__)_        (      )       (  ω  )        (   ~~   )
    `--´          ^^^^          `----´        (")_(")          `-vvvv-´
   duck          goose          blob           cat             dragon

   .----.        /\  /\        .---.          _,--._        ·    .--.
  ( ·  · )      ((·)(·))      (·>·)         ( ·  · )        \  ( @ )
  (______)      (  ><  )     /(   )\       /[______]\        \_`--´
  /\/\/\/\       `----´       `---´         ``    ``        ~~~~~~~
  octopus         owl         penguin        turtle           snail

   .----.     }~(______)~{   n______n      n  ____  n       .[||].
  / ·  · \    }~(· .. ·)~{  ( ·    · )     | |·  ·| |      [ ·  · ]
  |      |     ( .--. )      (   oo   )     |_|    |_|      [ ==== ]
  ~`~``~`~     (_/  \_)       `------´        |    |         `------´
   ghost        axolotl       capybara       cactus           robot

  (\__/)       .-o-OO-o-.    /\    /\
 ( ·  · )     (__________)  ( ·    · )
=(  ..  )=     |·  ·|       (   ..   )
 (")__(")      |____|        `------´
  rabbit       mushroom       chonk
```

---

## How It Works

Your buddy's species, rarity, stats, eyes, and hat are **deterministic** — computed from a hash of your Claude Code account ID using the [same algorithm](https://github.com/anthropics/claude-code) as Claude Code itself. Name and personality are AI-generated on first `/buddy` hatch.

```
~/.claude.json  →  hash(userId + salt)  →  Mulberry32 PRNG  →  species, rarity, stats
                                                              ↓
                                        CLI submits to Supabase via RPC
                                                              ↓
                                        Web renders leaderboard + trading cards
```

### The Numbers

| | |
|---|---|
| **Species** | duck, goose, blob, cat, dragon, octopus, owl, penguin, turtle, snail, ghost, axolotl, capybara, cactus, robot, rabbit, mushroom, chonk |
| **Rarities** | common (60%), uncommon (25%), rare (10%), epic (4%), legendary (1%) |
| **Eyes** | 6 types |
| **Hats** | 8 types (commons don't get hats) |
| **Shiny** | 1% chance |
| **Total combos** | 1,728 unique visual combinations |

---

## Tech Stack

| Layer | Tech |
|---|---|
| CLI | Node.js, zero dependencies, interactive prompts, ANSI colors |
| Web | Next.js 16 (App Router), Tailwind CSS v4, Vercel |
| Database | Supabase Postgres — RLS, bcrypt token auth, RPC functions |
| OG Cards | `@vercel/og` (Satori) — 1200x675 PNG generation |
| Fonts | Satoshi (display), Instrument Sans (body), JetBrains Mono (code) |
| Analytics | Vercel Analytics |

---

## Contributing

Contributions welcome! Some ideas to get started:

- **Add a new species** — design ASCII art, add to `cli/roll.js` and `web/lib/sprites.ts`
- **New hat or eye type** — expand the cosmetic system
- **Card themes** — alternative visual treatments beyond the current rarity system
- **Stats page visualizations** — charts, graphs, fun data breakdowns

Check out issues labeled [`good first issue`](../../labels/good%20first%20issue) for beginner-friendly tasks.

---

## Development

```bash
# CLI
cd cli && node index.js

# Web
cd web && npm install && npm run dev
# Requires .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Tests
cd cli && node test.js
```

### Project Structure

```
buddy-board/
├── cli/                  # npx buddy-board — interactive CLI
│   ├── index.js          # Prompts, ANSI card rendering, submission
│   ├── roll.js           # Deterministic buddy algorithm (Mulberry32 PRNG)
│   ├── config.js         # Reads ~/.claude.json
│   └── submit.js         # Supabase RPC + GitHub/org verification
├── web/                  # Next.js web app
│   ├── app/              # 10 routes: home, profile, stats, dex, org, compare, recent, rarity, card, badge
│   ├── components/       # BuddyCard, LeaderboardTable, CopyButton, ShareButton, etc.
│   └── lib/              # Types, queries, sprites, constants
├── supabase/             # 3 SQL migrations (buddies, github fields, orgs)
└── video/                # Remotion promo video project
```

---

## License

MIT
