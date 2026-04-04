# Phase 7: Community & Engagement Features

## Overview

Five features shipped in order of implementation complexity and dependency:

1. **Recently Submitted Feed** (`/recent`) — simplest, standalone
2. **Rarity Pages** (`/rarity/[rarity]`) — standalone, reuses existing queries
3. **Achievement Badges** — computed logic, displayed on existing profile page
4. **Compare Mode** (`/compare/[user1]/[user2]`) — depends on badge logic being settled
5. **Animated Card Reveal** — client component layered on top of existing profile page

---

## Step 1 — Recently Submitted Feed (`/recent`)

### New query: `getRecentBuddies`

Add to `/home/tanay/personal/buddy-board/web/lib/queries.ts`:

```ts
export async function getRecentBuddies(limit = 30): Promise<Buddy[]> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Buddy[];
}
```

### New page: `/home/tanay/personal/buddy-board/web/app/recent/page.tsx`

```tsx
import { getRecentBuddies } from "@/lib/queries";
import { MiniBuddyCard } from "@/components/MiniBuddyCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recently Hatched — Buddy Board",
  description: "The newest Claude Code companions to join the board.",
};

// ISR: revalidate every 30 seconds
export const revalidate = 30;

export default async function RecentPage() {
  const buddies = await getRecentBuddies(30);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1
          className="font-display text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "#e5e7eb" }}
        >
          Recently Hatched
        </h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          The newest companions to join the board — refreshes every 30s.
        </p>
      </div>

      <div className="space-y-3">
        {buddies.map((buddy, i) => (
          <MiniBuddyCard key={buddy.id} buddy={buddy} position={i + 1} />
        ))}
        {buddies.length === 0 && (
          <p className="text-center py-16 font-mono text-sm" style={{ color: "#6b7280" }}>
            No buddies yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
```

### New component: `/home/tanay/personal/buddy-board/web/components/MiniBuddyCard.tsx`

```tsx
import Link from "next/link";
import { SpriteRenderer } from "./SpriteRenderer";
import { RarityBadge } from "./RarityBadge";
import { RARITY_COLORS } from "@/lib/constants";
import type { Buddy } from "@/lib/types";

export function MiniBuddyCard({
  buddy,
  position,
}: {
  buddy: Buddy;
  position?: number;
}) {
  const rarityColor = RARITY_COLORS[buddy.rarity];

  return (
    <Link
      href={`/u/${buddy.username}`}
      className="block rounded-lg transition-colors duration-150 hover:border-[#3a3a3a]"
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #2e2e2e",
      }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Position number */}
        {position !== undefined && (
          <span
            className="font-mono text-xs w-6 shrink-0 text-right"
            style={{ color: "#6b7280" }}
          >
            {position}
          </span>
        )}

        {/* Sprite — small */}
        <div className="shrink-0 scale-75 origin-center">
          <SpriteRenderer
            species={buddy.species}
            eye={buddy.eye}
            hat={buddy.hat}
          />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-display font-bold text-sm truncate"
            style={{ color: "#e5e7eb" }}
          >
            Welcome{" "}
            <span style={{ color: rarityColor }}>{buddy.name}</span> the{" "}
            {buddy.species}!
          </p>
          <p className="font-mono text-xs mt-0.5" style={{ color: "#6b7280" }}>
            @{buddy.username}
          </p>
        </div>

        {/* Right: rarity + date */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <RarityBadge rarity={buddy.rarity} />
          <span className="font-mono text-[10px]" style={{ color: "#6b7280" }}>
            {new Date(buddy.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

### Nav update

Add "Recent" link to the nav in `/home/tanay/personal/buddy-board/web/app/layout.tsx`:

```tsx
// After the "Stats" link, before the Submit button:
<a href="/recent" className="hover:text-white transition-colors">
  Recent
</a>
```

### Commit

```
feat: add /recent feed with ISR-30s and MiniBuddyCard
```

---

## Step 2 — Rarity Pages (`/rarity/[rarity]`)

### New query: `getBuddiesByRarity`

Add to `/home/tanay/personal/buddy-board/web/lib/queries.ts`:

```ts
export async function getBuddiesByRarity(rarity: string): Promise<Buddy[]> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("*")
    .eq("rarity", rarity)
    .order("total_stats", { ascending: false });

  if (error || !data) return [];
  return data as Buddy[];
}
```

### Static params generation

The page uses `generateStaticParams` so all five rarity pages are pre-rendered at build time.

### New page: `/home/tanay/personal/buddy-board/web/app/rarity/[rarity]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { getBuddiesByRarity } from "@/lib/queries";
import { BuddyCard } from "@/components/BuddyCard";
import { RARITY_COLORS } from "@/lib/constants";
import type { Rarity } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 300;

const VALID_RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

const RARITY_LABELS: Record<Rarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

const RARITY_DESCRIPTIONS: Record<Rarity, string> = {
  common: "The backbone of the board. Every legend starts somewhere.",
  uncommon: "A cut above the rest. These buddies have a little extra something.",
  rare: "Hard to find, harder to forget. Blue-bordered and proud.",
  epic: "Elite companions. The purple glow is earned.",
  legendary: "The rarest of all. The Hall of Fame.",
};

type Props = { params: Promise<{ rarity: string }> };

export async function generateStaticParams() {
  return VALID_RARITIES.map((rarity) => ({ rarity }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { rarity } = await params;
  if (!VALID_RARITIES.includes(rarity as Rarity)) return { title: "Not Found" };
  const label = RARITY_LABELS[rarity as Rarity];
  return {
    title: `${label} Buddies — Buddy Board`,
    description: RARITY_DESCRIPTIONS[rarity as Rarity],
  };
}

export default async function RarityPage({ params }: Props) {
  const { rarity } = await params;
  if (!VALID_RARITIES.includes(rarity as Rarity)) notFound();

  const r = rarity as Rarity;
  const buddies = await getBuddiesByRarity(r);
  const color = RARITY_COLORS[r];
  const label = RARITY_LABELS[r];
  const isLegendary = r === "legendary";

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 sm:mb-10">
        {isLegendary && (
          <p
            className="font-mono text-xs uppercase tracking-widest mb-3"
            style={{ color: "#eab308" }}
          >
            ★★★★★ Hall of Fame
          </p>
        )}
        <h1
          className="font-display text-2xl sm:text-3xl font-bold mb-2"
          style={{ color }}
        >
          {label} Buddies
        </h1>
        <p className="text-sm" style={{ color: "#9ca3af" }}>
          {RARITY_DESCRIPTIONS[r]}
        </p>
        <p className="font-mono text-xs mt-2" style={{ color: "#6b7280" }}>
          {buddies.length} {buddies.length === 1 ? "buddy" : "buddies"} — sorted by total stats
        </p>
      </div>

      {/* Rarity nav */}
      <div className="flex flex-wrap gap-2 mb-8">
        {VALID_RARITIES.map((rv) => (
          <a
            key={rv}
            href={`/rarity/${rv}`}
            className="px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider transition-all"
            style={
              rv === r
                ? {
                    backgroundColor: RARITY_COLORS[rv] + "22",
                    border: `1px solid ${RARITY_COLORS[rv]}`,
                    color: RARITY_COLORS[rv],
                  }
                : {
                    backgroundColor: "#1a1a1a",
                    border: "1px solid #2e2e2e",
                    color: "#6b7280",
                  }
            }
          >
            {RARITY_LABELS[rv]}
          </a>
        ))}
      </div>

      {/* Card grid */}
      {buddies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {buddies.map((buddy, i) => (
            <div key={buddy.id} className="relative">
              {/* Rank badge */}
              <div
                className="absolute -top-2 -left-2 z-20 w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs font-bold"
                style={{ backgroundColor: "#0c0c0c", border: `1px solid ${color}`, color }}
              >
                {i + 1}
              </div>
              <a href={`/u/${buddy.username}`} className="block">
                <BuddyCard buddy={buddy} />
              </a>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center py-24 font-mono text-sm" style={{ color: "#6b7280" }}>
          No {label.toLowerCase()} buddies yet.
        </p>
      )}
    </div>
  );
}
```

### Commit

```
feat: add /rarity/[rarity] pages with Hall of Fame treatment for legendary
```

---

## Step 3 — Achievement Badges

Badges are computed at render time from existing `Buddy` data + rank data. No new DB columns needed.

### Badge definitions and logic: `/home/tanay/personal/buddy-board/web/lib/badges.ts`

```ts
import type { Buddy, StatName } from "./types";

export type BadgeId =
  | "og"
  | "verified"
  | "shiny_hunter"
  | "stat_champion"
  | "top_10_pct"
  | "first_of_species";

export type Badge = {
  id: BadgeId;
  label: string;
  description: string;
  icon: string; // ASCII/emoji icon
  color: string;
};

export const BADGE_DEFS: Record<BadgeId, Badge> = {
  og: {
    id: "og",
    label: "OG",
    description: "Joined before April 8, 2026",
    icon: "◈",
    color: "#eab308",
  },
  verified: {
    id: "verified",
    label: "Verified",
    description: "GitHub account verified",
    icon: "✓",
    color: "#4ade80",
  },
  shiny_hunter: {
    id: "shiny_hunter",
    label: "Shiny Hunter",
    description: "Has a shiny buddy",
    icon: "✨",
    color: "#a855f7",
  },
  stat_champion: {
    id: "stat_champion",
    label: "Stat Champion",
    description: "Ranked #1 in any individual stat",
    icon: "⚡",
    color: "#3b82f6",
  },
  top_10_pct: {
    id: "top_10_pct",
    label: "Top 10%",
    description: "Overall rank in top 10% of all buddies",
    icon: "▲",
    color: "#22c55e",
  },
  first_of_species: {
    id: "first_of_species",
    label: "First of Species",
    description: "The first buddy of their species on the board",
    icon: "★",
    color: "#eab308",
  },
};

// OG cutoff: submitted before April 8, 2026 00:00:00 UTC
const OG_CUTOFF = new Date("2026-04-08T00:00:00Z").getTime();

export function computeBadges(
  buddy: Buddy,
  rank: { overall: number; perStat: Record<StatName, number>; total: number },
  allBuddies: { username: string; species: string; created_at: string }[],
): Badge[] {
  const earned: Badge[] = [];

  // OG: joined before cutoff
  if (new Date(buddy.created_at).getTime() < OG_CUTOFF) {
    earned.push(BADGE_DEFS.og);
  }

  // Verified: github_verified flag
  if (buddy.github_verified) {
    earned.push(BADGE_DEFS.verified);
  }

  // Shiny Hunter
  if (buddy.shiny) {
    earned.push(BADGE_DEFS.shiny_hunter);
  }

  // Stat Champion: rank #1 in any stat
  const statNames: StatName[] = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];
  if (statNames.some((s) => rank.perStat[s] === 1)) {
    earned.push(BADGE_DEFS.stat_champion);
  }

  // Top 10%: overall rank <= ceil(total * 0.1), minimum 1
  const top10Threshold = Math.max(1, Math.ceil(rank.total * 0.1));
  if (rank.total > 0 && rank.overall <= top10Threshold) {
    earned.push(BADGE_DEFS.top_10_pct);
  }

  // First of Species: buddy's created_at is the earliest among same species
  const sameSpecies = allBuddies
    .filter((b) => b.species === buddy.species)
    .sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  if (sameSpecies.length > 0 && sameSpecies[0].username === buddy.username) {
    earned.push(BADGE_DEFS.first_of_species);
  }

  return earned;
}
```

### New query to support badge computation: add to `queries.ts`

```ts
export async function getAllBuddiesLight(): Promise<
  { username: string; species: string; created_at: string }[]
> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("username, species, created_at");

  if (error || !data) return [];
  return data;
}
```

### Badge display component: `/home/tanay/personal/buddy-board/web/components/BadgeRow.tsx`

```tsx
import type { Badge } from "@/lib/badges";

export function BadgeRow({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => (
        <div
          key={badge.id}
          title={badge.description}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-medium cursor-default select-none"
          style={{
            backgroundColor: badge.color + "18",
            border: `1px solid ${badge.color}55`,
            color: badge.color,
          }}
        >
          <span>{badge.icon}</span>
          <span>{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
```

### Profile page update: `/home/tanay/personal/buddy-board/web/app/u/[username]/page.tsx`

Add badge computation and `BadgeRow` display. Updated imports and data fetching section:

```tsx
import { notFound } from "next/navigation";
import { BuddyCard } from "@/components/BuddyCard";
import { BadgeRow } from "@/components/BadgeRow";
import { CardRevealWrapper } from "@/components/CardRevealWrapper";
import { getBuddyByUsername, getBuddyRank, getAllBuddiesLight } from "@/lib/queries";
import { computeBadges } from "@/lib/badges";
import { STAT_NAMES } from "@/lib/constants";
import type { StatName } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = { params: Promise<{ username: string }> };

// ... generateMetadata stays identical ...

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;

  // Parallel fetches — avoid waterfall
  const [buddy, rank, allBuddiesLight] = await Promise.all([
    getBuddyByUsername(username),
    getBuddyRank(username),
    getAllBuddiesLight(),
  ]);

  if (!buddy) notFound();

  const badges = computeBadges(buddy, rank, allBuddiesLight);

  const cardUrl = `https://buddyboard.dev/card/${username}`;
  const profileUrl = `https://buddyboard.dev/u/${username}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Animated reveal wrapper (handles face-down flip for share link visitors) */}
      <CardRevealWrapper rarity={buddy.rarity}>
        <BuddyCard buddy={buddy} />
      </CardRevealWrapper>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="mt-4">
          <BadgeRow badges={badges} />
        </div>
      )}

      {/* Rankings — unchanged ... */}
      {/* Share — unchanged ... */}
    </div>
  );
}
```

Note: The full Rankings and Share sections stay identical to the current page.tsx. Only the top section changes (add parallel fetch, badges, CardRevealWrapper).

### Commit

```
feat: add achievement badges (OG, Verified, Shiny Hunter, Stat Champion, Top 10%, First of Species)
```

---

## Step 4 — Compare Mode (`/compare/[user1]/[user2]`)

### New query: `getTwoBuddies`

Add to `queries.ts`:

```ts
export async function getTwoBuddies(
  user1: string,
  user2: string,
): Promise<[Buddy | null, Buddy | null]> {
  const [a, b] = await Promise.all([
    getBuddyByUsername(user1),
    getBuddyByUsername(user2),
  ]);
  return [a, b];
}
```

### New page: `/home/tanay/personal/buddy-board/web/app/compare/[user1]/[user2]/page.tsx`

```tsx
import { notFound } from "next/navigation";
import { getTwoBuddies } from "@/lib/queries";
import { BuddyCard } from "@/components/BuddyCard";
import { StatCompareRow } from "@/components/StatCompareRow";
import { STAT_NAMES, RARITY_COLORS } from "@/lib/constants";
import type { StatName } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = { params: Promise<{ user1: string; user2: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user1, user2 } = await params;
  return {
    title: `${user1} vs ${user2} — Buddy Board`,
    description: `Compare ${user1}'s buddy against ${user2}'s buddy on Buddy Board.`,
  };
}

export default async function ComparePage({ params }: Props) {
  const { user1, user2 } = await params;
  const [buddyA, buddyB] = await getTwoBuddies(user1, user2);

  if (!buddyA || !buddyB) notFound();

  const statNames: StatName[] = STAT_NAMES;

  // Determine winner by total stats
  const aWins = buddyA.total_stats > buddyB.total_stats;
  const tie = buddyA.total_stats === buddyB.total_stats;

  const winnerName = tie ? null : aWins ? buddyA.name : buddyB.name;
  const winnerColor = tie
    ? "#6b7280"
    : aWins
      ? RARITY_COLORS[buddyA.rarity]
      : RARITY_COLORS[buddyB.rarity];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: "#e5e7eb" }}>
          Buddy Showdown
        </h1>
        <p className="font-mono text-sm mt-1" style={{ color: "#6b7280" }}>
          @{user1} vs @{user2}
        </p>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <a href={`/u/${buddyA.username}`}>
          <BuddyCard buddy={buddyA} />
        </a>
        <a href={`/u/${buddyB.username}`}>
          <BuddyCard buddy={buddyB} />
        </a>
      </div>

      {/* Stat-by-stat comparison */}
      <div
        className="rounded-xl overflow-hidden mb-8"
        style={{ border: "1px solid #2e2e2e", backgroundColor: "#1a1a1a" }}
      >
        <div className="grid grid-cols-3 px-5 py-3" style={{ borderBottom: "1px solid #2e2e2e" }}>
          <span className="font-display font-bold text-sm truncate" style={{ color: RARITY_COLORS[buddyA.rarity] }}>
            {buddyA.name}
          </span>
          <span className="font-mono text-xs uppercase text-center self-center" style={{ color: "#6b7280" }}>
            stat
          </span>
          <span className="font-display font-bold text-sm truncate text-right" style={{ color: RARITY_COLORS[buddyB.rarity] }}>
            {buddyB.name}
          </span>
        </div>

        {statNames.map((stat) => (
          <StatCompareRow
            key={stat}
            stat={stat}
            valueA={buddyA.stats[stat]}
            valueB={buddyB.stats[stat]}
          />
        ))}

        {/* Total row */}
        <div
          className="grid grid-cols-3 px-5 py-4"
          style={{ borderTop: "1px solid #2e2e2e" }}
        >
          <span
            className="font-display font-bold text-lg"
            style={{ color: aWins ? RARITY_COLORS[buddyA.rarity] : "#6b7280" }}
          >
            {buddyA.total_stats}
          </span>
          <span
            className="font-mono text-xs uppercase text-center self-center"
            style={{ color: "#9ca3af" }}
          >
            TOTAL
          </span>
          <span
            className="font-display font-bold text-lg text-right"
            style={{ color: !aWins && !tie ? RARITY_COLORS[buddyB.rarity] : "#6b7280" }}
          >
            {buddyB.total_stats}
          </span>
        </div>
      </div>

      {/* Who would win? */}
      <div
        className="rounded-xl p-6 text-center mb-8"
        style={{ backgroundColor: "#1a1a1a", border: `1px solid ${winnerColor}44` }}
      >
        {tie ? (
          <>
            <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#6b7280" }}>
              Result
            </p>
            <p className="font-display text-xl font-bold" style={{ color: "#9ca3af" }}>
              Dead tie — it&apos;s anyone&apos;s game.
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#6b7280" }}>
              Who would win?
            </p>
            <p className="font-display text-xl font-bold" style={{ color: winnerColor }}>
              {winnerName}
            </p>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              wins by {Math.abs(buddyA.total_stats - buddyB.total_stats)} stat points
            </p>
          </>
        )}
      </div>

      {/* Share this comparison */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
      >
        <label className="block font-sans text-xs mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>
          Share this matchup
        </label>
        <code className="font-mono text-xs break-all block" style={{ color: "#4ade80" }}>
          https://buddyboard.dev/compare/{user1}/{user2}
        </code>
      </div>
    </div>
  );
}
```

### New component: `/home/tanay/personal/buddy-board/web/components/StatCompareRow.tsx`

```tsx
import type { StatName } from "@/lib/types";

export function StatCompareRow({
  stat,
  valueA,
  valueB,
}: {
  stat: StatName;
  valueA: number;
  valueB: number;
}) {
  const aHigher = valueA > valueB;
  const bHigher = valueB > valueA;
  const tied = valueA === valueB;

  const winColor = "#4ade80";
  const neutralColor = "#6b7280";

  return (
    <div
      className="grid grid-cols-3 px-5 py-3"
      style={{ borderTop: "1px solid #1f1f1f" }}
    >
      {/* Left value */}
      <div className="flex items-center gap-1.5">
        <span
          className="font-display font-bold text-base"
          style={{ color: aHigher ? winColor : "#9ca3af" }}
        >
          {valueA}
        </span>
        {aHigher && (
          <span className="font-mono text-xs" style={{ color: winColor }}>
            ↑
          </span>
        )}
        {bHigher && (
          <span className="font-mono text-xs" style={{ color: neutralColor }}>
            ↓
          </span>
        )}
      </div>

      {/* Stat label */}
      <span
        className="font-mono text-[10px] uppercase tracking-wider text-center self-center"
        style={{ color: neutralColor }}
      >
        {stat}
      </span>

      {/* Right value */}
      <div className="flex items-center justify-end gap-1.5">
        {aHigher && (
          <span className="font-mono text-xs" style={{ color: neutralColor }}>
            ↓
          </span>
        )}
        {bHigher && (
          <span className="font-mono text-xs" style={{ color: winColor }}>
            ↑
          </span>
        )}
        <span
          className="font-display font-bold text-base"
          style={{ color: bHigher ? winColor : "#9ca3af" }}
        >
          {valueB}
        </span>
      </div>
    </div>
  );
}
```

### Add compare link to profile page

In `web/app/u/[username]/page.tsx`, add a "Compare" input inside the Share section:

```tsx
{/* Compare link */}
<div
  className="rounded-lg p-3 sm:p-4"
  style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
>
  <label className="block font-sans text-xs mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>
    Compare with another buddy
  </label>
  <CompareInput username={buddy.username} />
</div>
```

### New client component: `/home/tanay/personal/buddy-board/web/components/CompareInput.tsx`

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CompareInput({ username }: { username: string }) {
  const [other, setOther] = useState("");
  const router = useRouter();

  function handleCompare() {
    const opponent = other.trim().toLowerCase().replace(/^@/, "");
    if (!opponent) return;
    router.push(`/compare/${username}/${opponent}`);
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="@username"
        value={other}
        onChange={(e) => setOther(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCompare()}
        className="flex-1 bg-transparent font-mono text-xs rounded-md px-3 py-2 outline-none"
        style={{
          border: "1px solid #3a3a3a",
          color: "#e5e7eb",
        }}
      />
      <button
        onClick={handleCompare}
        className="px-3 py-2 rounded-md font-mono text-xs font-medium transition-colors"
        style={{
          backgroundColor: "#1f1f1f",
          border: "1px solid #2e2e2e",
          color: "#4ade80",
        }}
      >
        Compare
      </button>
    </div>
  );
}
```

### Commit

```
feat: add /compare/[user1]/[user2] side-by-side showdown page
```

---

## Step 5 — Animated Card Reveal

This is a client component that wraps `BuddyCard`. It only plays the flip animation when the visitor arrives via a share link (i.e., `?reveal=1` query param). `sessionStorage` ensures the animation fires only once per session.

### New client component: `/home/tanay/personal/buddy-board/web/components/CardRevealWrapper.tsx`

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Rarity } from "@/lib/types";

// Rarity-specific reveal overlay color shown on card back
const REVEAL_BACK_COLOR: Record<Rarity, string> = {
  common: "#1a1a1a",
  uncommon: "#0a1f12",
  rare: "#0a0f1f",
  epic: "#130a1f",
  legendary: "#1f1700",
};

const REVEAL_BACK_BORDER: Record<Rarity, string> = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#eab308",
};

const SESSION_KEY = "bb_revealed";

export function CardRevealWrapper({
  children,
  rarity,
}: {
  children: React.ReactNode;
  rarity: Rarity;
}) {
  const searchParams = useSearchParams();
  const shouldReveal = searchParams.get("reveal") === "1";
  const [flipped, setFlipped] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!shouldReveal) return;

    // Only animate once per browser session
    const key = `${SESSION_KEY}_${window.location.pathname}`;
    if (sessionStorage.getItem(key)) {
      // Already revealed — show front immediately
      setFlipped(true);
      return;
    }

    // Start face-down, flip after a brief pause
    const timer = setTimeout(() => {
      setFlipped(true);
      sessionStorage.setItem(key, "1");
    }, 600);

    hasAnimated.current = true;
    return () => clearTimeout(timer);
  }, [shouldReveal]);

  // No reveal param — render children directly, no wrapper
  if (!shouldReveal) {
    return <>{children}</>;
  }

  const backBg = REVEAL_BACK_COLOR[rarity];
  const backBorder = REVEAL_BACK_BORDER[rarity];

  return (
    <div
      className="w-full max-w-sm mx-auto"
      style={{ perspective: "1000px" }}
    >
      {/*
        Flip container.
        When flipped=false → shows card back (rotateY 180deg).
        When flipped=true  → shows card front (rotateY 0).
        transition-all duration-700 handles the animation.
      */}
      <div
        className="relative w-full transition-all duration-700 ease-in-out"
        style={{
          transformStyle: "preserve-3d",
          transform: flipped ? "rotateY(0deg)" : "rotateY(180deg)",
          minHeight: "380px",
        }}
      >
        {/* Front face — actual card */}
        <div
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {children}
        </div>

        {/* Back face — rarity-tinted placeholder */}
        <div
          className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            backgroundColor: backBg,
            border: `2px solid ${backBorder}`,
          }}
        >
          <span
            className="font-display text-4xl font-bold select-none"
            style={{ color: backBorder + "88" }}
          >
            BB
          </span>
          <span
            className="font-mono text-xs uppercase tracking-widest select-none"
            style={{ color: backBorder + "66" }}
          >
            Buddy Board
          </span>
        </div>
      </div>
    </div>
  );
}
```

### Suspense boundary requirement

`CardRevealWrapper` uses `useSearchParams`, which requires a `Suspense` boundary in Next.js App Router to avoid CSR bailout. Wrap the usage in the profile page:

```tsx
// In web/app/u/[username]/page.tsx:
import { Suspense } from "react";

// Replace the <CardRevealWrapper> usage:
<Suspense fallback={<div className="w-full max-w-sm mx-auto" style={{ minHeight: "380px" }} />}>
  <CardRevealWrapper rarity={buddy.rarity}>
    <BuddyCard buddy={buddy} />
  </CardRevealWrapper>
</Suspense>
```

### Share link update

The share link in `ProfilePage` should include `?reveal=1`:

```tsx
const profileUrl = `https://buddyboard.dev/u/${username}`;
const shareUrl   = `${profileUrl}?reveal=1`;
```

Update the "Share link" code block to show `shareUrl` rather than `profileUrl`:

```tsx
<code className="font-mono text-xs break-all block" style={{ color: "#4ade80" }}>
  {shareUrl}
</code>
```

### Rarity-specific flair (legendary)

For legendary cards, add a brief particle burst (pure CSS, no JS library). Add to `globals.css`:

```css
/* Legendary reveal burst */
@keyframes burst-out {
  0%   { opacity: 1; transform: scale(0.5) translateY(0); }
  100% { opacity: 0; transform: scale(1.5) translateY(-60px); }
}

.legendary-reveal-particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 9999px;
  background: #eab308;
  pointer-events: none;
  animation: burst-out 0.8s ease-out forwards;
}
```

Render particles in `CardRevealWrapper` when `rarity === "legendary"` and the flip just completed:

```tsx
// Inside CardRevealWrapper, after the flip container:
{rarity === "legendary" && flipped && (
  <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
    {Array.from({ length: 8 }).map((_, i) => (
      <span
        key={i}
        className="legendary-reveal-particle"
        style={{
          left: `${10 + i * 11}%`,
          top: "40%",
          animationDelay: `${i * 60}ms`,
        }}
      />
    ))}
  </div>
)}
```

Wrap the entire `CardRevealWrapper` return div in `position: relative` to contain particles.

### Commit

```
feat: add animated card reveal with rarity-specific flip for share link visitors
```

---

## Step 6 — Nav + Wiring

Update `layout.tsx` to add all new nav links (Recent already covered in Step 1). Optionally add Rarity dropdown:

```tsx
<a href="/recent" className="hover:text-white transition-colors">
  Recent
</a>
<a href="/rarity/legendary" className="hover:text-white transition-colors">
  Rarities
</a>
```

### Commit

```
feat: add Recent and Rarities nav links to global header
```

---

## Implementation Order (summary)

| Step | Feature | New Files | Touches Existing |
|------|---------|-----------|-----------------|
| 1 | `/recent` feed | `app/recent/page.tsx`, `components/MiniBuddyCard.tsx` | `lib/queries.ts`, `app/layout.tsx` |
| 2 | `/rarity/[rarity]` | `app/rarity/[rarity]/page.tsx` | `lib/queries.ts` |
| 3 | Achievement badges | `lib/badges.ts`, `components/BadgeRow.tsx` | `lib/queries.ts`, `app/u/[username]/page.tsx` |
| 4 | Compare mode | `app/compare/[user1]/[user2]/page.tsx`, `components/StatCompareRow.tsx`, `components/CompareInput.tsx` | `lib/queries.ts`, `app/u/[username]/page.tsx` |
| 5 | Card reveal | `components/CardRevealWrapper.tsx` | `app/u/[username]/page.tsx`, `app/globals.css` |
| 6 | Nav | — | `app/layout.tsx` |

---

## Key Design Decisions

- **No new DB columns for badges.** All badge logic is computed from existing `buddies_public` view data. `getAllBuddiesLight` fetches only the three columns needed (username, species, created_at) to minimize payload.
- **`?reveal=1` for card reveal.** The profile page URL stays clean for all non-share traffic. Only users clicking a share link get the animation. `sessionStorage` ensures the flip only plays once per session.
- **`useSearchParams` inside `Suspense`.** Required by Next.js App Router to avoid CSR bailout (the Suspense fallback renders a same-size placeholder to prevent layout shift).
- **`Promise.all` in profile page.** The three fetches (buddy, rank, allBuddiesLight) run in parallel — no waterfall.
- **Rarity pages use `generateStaticParams`.** All five rarity pages are pre-rendered at build time and revalidated every 300s via ISR.
- **Compare page is server-rendered.** No client state needed — the URL carries both usernames. The `CompareInput` component on the profile page is the only client component for this feature.
- **Design system compliance.** All colors, fonts, and spacing follow DESIGN.md exactly: `#0c0c0c` base, `#1a1a1a` surfaces, `#2e2e2e` borders, `#4ade80` accent, rarity colors per spec. Motion durations: 600ms delay + 700ms flip is in the "long" range (400–700ms) per DESIGN.md.

---

## File Map

```
web/
  app/
    recent/
      page.tsx                          NEW
    rarity/
      [rarity]/
        page.tsx                        NEW
    compare/
      [user1]/
        [user2]/
          page.tsx                      NEW
    u/
      [username]/
        page.tsx                        MODIFIED (badges, CardRevealWrapper, CompareInput, Promise.all)
    layout.tsx                          MODIFIED (nav links)
    globals.css                         MODIFIED (legendary-reveal-particle animation)
  components/
    MiniBuddyCard.tsx                   NEW
    BadgeRow.tsx                        NEW
    StatCompareRow.tsx                  NEW
    CompareInput.tsx                    NEW  ('use client')
    CardRevealWrapper.tsx               NEW  ('use client', useSearchParams)
  lib/
    badges.ts                           NEW
    queries.ts                          MODIFIED (getRecentBuddies, getBuddiesByRarity, getTwoBuddies, getAllBuddiesLight)
```
