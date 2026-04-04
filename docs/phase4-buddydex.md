# Phase 4: BuddyDex — Implementation Plan

## Overview

BuddyDex is a Pokédex-style species gallery for Buddy Board. It adds two new routes (`/dex` and `/dex/[species]`), three new query functions, one new reusable component (`DexSpriteCard`), and a nav link update. All data comes from the existing `buddies_public` Supabase view — no schema changes required.

---

## Files To Create

```
web/
  app/
    dex/
      page.tsx                  # /dex — species grid with filter + counter
      [species]/
        page.tsx                # /dex/[species] — species detail
  components/
    DexSpriteCard.tsx           # Reusable species card used in /dex grid
```

## Files To Modify

```
web/
  lib/
    queries.ts                  # Add getDexOverview(), getSpeciesStats(), getSpeciesBuddies()
  app/
    layout.tsx                  # Add "Dex" nav link
```

---

## Step 1: New Query Functions in `web/lib/queries.ts`

Append these three functions to the bottom of the existing file. They all query the `buddies_public` view — no new Supabase tables or views needed.

### `getDexOverview()`

Returns, for each of the 18 species: buddy count, most common rarity, and rarity breakdown. Used by `/dex`.

```ts
export async function getDexOverview(): Promise<{
  species: string;
  count: number;
  rarityBreakdown: Record<string, number>;
  dominantRarity: Rarity | null;
}[]> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("species, rarity");

  if (error || !data) return SPECIES_LIST.map((s) => ({
    species: s,
    count: 0,
    rarityBreakdown: {},
    dominantRarity: null,
  }));

  // Group by species
  const bySpecies: Record<string, { count: number; rarityBreakdown: Record<string, number> }> = {};
  for (const row of data as { species: string; rarity: Rarity }[]) {
    if (!bySpecies[row.species]) {
      bySpecies[row.species] = { count: 0, rarityBreakdown: {} };
    }
    bySpecies[row.species].count++;
    bySpecies[row.species].rarityBreakdown[row.rarity] =
      (bySpecies[row.species].rarityBreakdown[row.rarity] || 0) + 1;
  }

  const RARITY_RANK: Record<string, number> = {
    legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1,
  };

  return SPECIES_LIST.map((species) => {
    const entry = bySpecies[species];
    if (!entry) return { species, count: 0, rarityBreakdown: {}, dominantRarity: null };

    const dominantRarity = (Object.entries(entry.rarityBreakdown)
      .sort((a, b) => (RARITY_RANK[b[0]] ?? 0) - (RARITY_RANK[a[0]] ?? 0))[0]?.[0] ?? null) as Rarity | null;

    return { species, count: entry.count, rarityBreakdown: entry.rarityBreakdown, dominantRarity };
  });
}
```

**Import needed at top of queries.ts** (add `SPECIES_LIST` to the existing import from constants, and `Rarity` to the types import):

```ts
import { SPECIES_LIST } from "./constants";
import type { Buddy, Rarity, StatName } from "./types";
```

### `getSpeciesStats(species: string)`

Returns aggregate stats for a single species: count, rarity breakdown, average stats, shiny count, first registered buddy (earliest `hatched_at`). Used by `/dex/[species]`.

```ts
export async function getSpeciesStats(species: string): Promise<{
  count: number;
  rarityBreakdown: Record<string, number>;
  avgStats: Record<string, number>;
  shinies: number;
  firstDiscovered: { username: string; hatched_at: number } | null;
} | null> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("username, rarity, stats, shiny, hatched_at")
    .eq("species", species);

  if (error || !data) return null;

  const buddies = data as Pick<Buddy, "username" | "rarity" | "stats" | "shiny" | "hatched_at">[];
  if (buddies.length === 0) {
    return { count: 0, rarityBreakdown: {}, avgStats: {}, shinies: 0, firstDiscovered: null };
  }

  const rarityBreakdown: Record<string, number> = {};
  const statSums: Record<string, number> = {
    DEBUGGING: 0, PATIENCE: 0, CHAOS: 0, WISDOM: 0, SNARK: 0,
  };
  let shinies = 0;

  for (const b of buddies) {
    rarityBreakdown[b.rarity] = (rarityBreakdown[b.rarity] || 0) + 1;
    if (b.shiny) shinies++;
    for (const stat of Object.keys(statSums)) {
      statSums[stat] += b.stats[stat as StatName] ?? 0;
    }
  }

  const avgStats: Record<string, number> = {};
  for (const stat of Object.keys(statSums)) {
    avgStats[stat] = Math.round(statSums[stat] / buddies.length);
  }

  const firstDiscovered = buddies.reduce((earliest, b) =>
    b.hatched_at < (earliest?.hatched_at ?? Infinity) ? b : earliest,
    buddies[0]
  );

  return {
    count: buddies.length,
    rarityBreakdown,
    avgStats,
    shinies,
    firstDiscovered: { username: firstDiscovered.username, hatched_at: firstDiscovered.hatched_at },
  };
}
```

### `getSpeciesBuddies(species: string)`

Returns all buddies of a given species, sorted by total_stats descending, capped at 50. Used by `/dex/[species]` "Known specimens" section.

```ts
export async function getSpeciesBuddies(species: string): Promise<Buddy[]> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("*")
    .eq("species", species)
    .order("total_stats", { ascending: false })
    .limit(50);

  if (error || !data) return [];
  return data as Buddy[];
}
```

---

## Step 2: `DexSpriteCard` Component (`web/components/DexSpriteCard.tsx`)

This is a server component (no `"use client"`). It renders one species tile for the `/dex` grid. Undiscovered species (count === 0) render with a dark silhouette sprite and `???` name.

The silhouette effect is achieved with CSS `filter: brightness(0) opacity(0.25)` on the `<pre>` — no extra state needed.

```tsx
import { renderSprite } from "@/lib/sprites";
import type { Species } from "@/lib/types";
import { RARITY_COLORS } from "@/lib/constants";

type DexSpriteCardProps = {
  species: Species;
  count: number;
  dominantRarity: string | null;
  href: string;
};

export function DexSpriteCard({ species, count, dominantRarity, href }: DexSpriteCardProps) {
  const discovered = count > 0;
  // Render the sprite with neutral defaults for display purposes
  const lines = renderSprite(species, "·", "none");
  const accentColor = discovered && dominantRarity
    ? (RARITY_COLORS as Record<string, string>)[dominantRarity] ?? "#4ade80"
    : "#2e2e2e";

  return (
    <a
      href={href}
      className="group block rounded-xl transition-transform duration-300 ease-out hover:-translate-y-1"
      style={{
        backgroundColor: "#1a1a1a",
        border: `1px solid ${discovered ? accentColor + "55" : "#2e2e2e"}`,
      }}
      aria-label={discovered ? `${species} — ${count} registered` : "Undiscovered species"}
    >
      <div className="p-4 flex flex-col items-center gap-3">
        {/* Sprite */}
        <pre
          className="font-mono text-xs leading-tight select-none"
          style={{
            whiteSpace: "pre",
            color: discovered ? "#4ade80" : "#4ade80",
            filter: discovered ? "none" : "brightness(0) opacity(0.2)",
          }}
        >
          {lines.join("\n")}
        </pre>

        {/* Species name */}
        <div className="text-center">
          <div
            className="font-display text-xs font-bold uppercase tracking-widest"
            style={{ color: discovered ? "#e5e7eb" : "#2e2e2e" }}
          >
            {discovered ? species : "???"}
          </div>
          <div
            className="font-mono text-[10px] mt-0.5"
            style={{ color: discovered ? "#6b7280" : "#1f1f1f" }}
          >
            {discovered ? `${count} registered` : "undiscovered"}
          </div>
        </div>

        {/* Rarity dot — only if discovered */}
        {discovered && dominantRarity && (
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
            title={dominantRarity}
          />
        )}
      </div>
    </a>
  );
}
```

---

## Step 3: `/dex` Main Page (`web/app/dex/page.tsx`)

Server component. Fetches `getDexOverview()`, derives discovery count, renders the filter UI (client island) and the grid.

**Key design decisions:**
- Rarity filter is a client-side `<select>` that manipulates URL search params via `useRouter` — keep it simple with a `"use client"` wrapper component `DexFilterBar`.
- The grid itself is a server component that receives already-filtered data as props, so no extra fetching on filter change: we pass all data and filter client-side via a `"use client"` `DexGrid` component.
- `revalidate = 300` (5 min cache) — same pattern as stats page.
- Discovery counter bar uses inline `style={{ width: "${pct}%" }}` — no animation needed (server rendered).

### Filter + Grid as a client island

Since the filter needs to be interactive without a full page reload, the cleanest approach (given no URL search param hydration issues) is a single `"use client"` wrapper `DexClient` that holds filter state internally and filters the full dataset passed from the server. This avoids any router/searchParams complexity.

```tsx
// web/app/dex/page.tsx
import { getDexOverview } from "@/lib/queries";
import { SPECIES_LIST, RARITY_COLORS } from "@/lib/constants";
import { DexClient } from "./DexClient";
import type { Rarity } from "@/lib/types";

export const revalidate = 300;

export default async function DexPage() {
  const overview = await getDexOverview();

  const discovered = overview.filter((s) => s.count > 0).length;
  const total = SPECIES_LIST.length; // 18
  const pct = Math.round((discovered / total) * 100);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ── Header ── */}
      <div className="text-center pt-2 sm:pt-4">
        <h1
          className="font-display text-2xl sm:text-3xl md:text-4xl font-black tracking-tight mb-2"
          style={{ color: "#e5e7eb" }}
        >
          BuddyDex
        </h1>
        <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
          Discover all {total} species of Claude Code companions
        </p>
      </div>

      {/* ── Discovery Progress ── */}
      <div
        className="rounded-xl p-4 sm:p-6"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-display text-sm font-semibold" style={{ color: "#e5e7eb" }}>
            Species Discovered
          </span>
          <span className="font-mono text-xs" style={{ color: "#4ade80" }}>
            {discovered}/{total} — {pct}%
          </span>
        </div>
        {/* Progress bar */}
        <div className="rounded-full overflow-hidden h-2.5" style={{ backgroundColor: "#242424" }}>
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              background: "#4ade80",
              borderRadius: "9999px",
              boxShadow: "0 0 8px 0px #4ade8088",
              transition: "width 0.8s ease-out",
            }}
          />
        </div>
        {/* Rarity legend */}
        <div className="flex flex-wrap gap-3 mt-3">
          {(Object.entries(RARITY_COLORS) as [Rarity, string][]).map(([rarity, color]) => (
            <span key={rarity} className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider" style={{ color: "#6b7280" }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: color }} />
              {rarity}
            </span>
          ))}
        </div>
      </div>

      {/* ── Filter + Grid (client island) ── */}
      <DexClient overview={overview} />
    </div>
  );
}
```

### `DexClient` — client island for filter + grid (`web/app/dex/DexClient.tsx`)

```tsx
"use client";

import { useState } from "react";
import { DexSpriteCard } from "@/components/DexSpriteCard";
import type { Species, Rarity } from "@/lib/types";

type SpeciesOverview = {
  species: string;
  count: number;
  rarityBreakdown: Record<string, number>;
  dominantRarity: Rarity | null;
};

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

export function DexClient({ overview }: { overview: SpeciesOverview[] }) {
  const [filterRarity, setFilterRarity] = useState<Rarity | "all">("all");
  const [filterDiscovered, setFilterDiscovered] = useState<"all" | "discovered" | "undiscovered">("all");

  const filtered = overview.filter((s) => {
    if (filterDiscovered === "discovered" && s.count === 0) return false;
    if (filterDiscovered === "undiscovered" && s.count > 0) return false;
    if (filterRarity !== "all" && s.dominantRarity !== filterRarity) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <span className="font-mono text-xs" style={{ color: "#6b7280" }}>Filter:</span>

        {/* Rarity filter */}
        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value as Rarity | "all")}
          className="rounded-md px-2.5 py-1.5 text-xs font-mono"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2e2e2e",
            color: "#e5e7eb",
          }}
        >
          <option value="all">All rarities</option>
          {RARITIES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* Discovered filter */}
        <select
          value={filterDiscovered}
          onChange={(e) => setFilterDiscovered(e.target.value as typeof filterDiscovered)}
          className="rounded-md px-2.5 py-1.5 text-xs font-mono"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2e2e2e",
            color: "#e5e7eb",
          }}
        >
          <option value="all">All species</option>
          <option value="discovered">Discovered</option>
          <option value="undiscovered">Undiscovered</option>
        </select>

        <span className="font-mono text-[10px] ml-auto" style={{ color: "#6b7280" }}>
          {filtered.length} species
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 font-mono text-sm" style={{ color: "#6b7280" }}>
          No species match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
          {filtered.map((s) => (
            <DexSpriteCard
              key={s.species}
              species={s.species as Species}
              count={s.count}
              dominantRarity={s.dominantRarity}
              href={`/dex/${s.species}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

**Note on grid columns:** The 6-column layout at `lg` breakpoint keeps cards compact and Pokédex-grid-like. Cards are small (species name + ASCII sprite + count). On mobile 2 columns, tablet 3-4 columns.

---

## Step 4: Species Detail Page (`web/app/dex/[species]/page.tsx`)

Server component. Fetches `getSpeciesStats()` and `getSpeciesBuddies()` in parallel. Renders:
1. Large sprite with all 6 eye variants (one row)
2. All 8 hat variants (one row)
3. Stats panel: count, rarity breakdown, average stats, shinies
4. "First discovered" byline
5. "Known specimens" — BuddyCard list (reuses existing component)

```tsx
import { notFound } from "next/navigation";
import { getSpeciesStats, getSpeciesBuddies } from "@/lib/queries";
import { SPECIES_LIST, RARITY_COLORS, STAT_NAMES } from "@/lib/constants";
import { renderSprite } from "@/lib/sprites";
import { BuddyCard } from "@/components/BuddyCard";
import type { Species, Eye, Hat, Rarity } from "@/lib/types";

export const revalidate = 300;

// Pre-generate static paths for all 18 species at build time
export function generateStaticParams() {
  return SPECIES_LIST.map((species) => ({ species }));
}

const ALL_EYES: Eye[] = ["·", "✦", "×", "◉", "@", "°"];
const ALL_HATS: Hat[] = ["none", "crown", "tophat", "propeller", "halo", "wizard", "beanie", "tinyduck"];

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species: speciesParam } = await params;

  // Validate species
  if (!SPECIES_LIST.includes(speciesParam as Species)) {
    notFound();
  }
  const species = speciesParam as Species;

  // Parallel fetches
  const [statsResult, buddies] = await Promise.all([
    getSpeciesStats(species),
    getSpeciesBuddies(species),
  ]);

  const stats = statsResult ?? { count: 0, rarityBreakdown: {}, avgStats: {}, shinies: 0, firstDiscovered: null };
  const discovered = stats.count > 0;

  return (
    <div className="max-w-3xl mx-auto space-y-10 sm:space-y-14">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 pt-2">
        <a
          href="/dex"
          className="font-mono text-xs transition-colors hover:text-white"
          style={{ color: "#6b7280" }}
        >
          ← BuddyDex
        </a>
      </div>

      <div className="text-center">
        <h1
          className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-1 capitalize"
          style={{ color: "#e5e7eb" }}
        >
          {species}
        </h1>
        <p className="font-mono text-xs" style={{ color: "#6b7280" }}>
          {discovered ? `${stats.count} registered specimen${stats.count !== 1 ? "s" : ""}` : "No specimens registered yet"}
        </p>
      </div>

      {/* ── Eye Variants ── */}
      <section>
        <h2 className="font-display text-base sm:text-lg font-bold mb-4" style={{ color: "#e5e7eb" }}>
          Eye Variants
        </h2>
        <div
          className="rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="flex flex-wrap gap-6 sm:gap-8 justify-center">
            {ALL_EYES.map((eye) => {
              const lines = renderSprite(species, eye, "none");
              return (
                <div key={eye} className="flex flex-col items-center gap-2">
                  <pre
                    className="font-mono text-xs leading-tight select-none"
                    style={{ whiteSpace: "pre", color: "#4ade80" }}
                  >
                    {lines.join("\n")}
                  </pre>
                  <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
                    {eye}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Hat Variants ── */}
      <section>
        <h2 className="font-display text-base sm:text-lg font-bold mb-4" style={{ color: "#e5e7eb" }}>
          Hat Variants
        </h2>
        <div
          className="rounded-xl p-4 sm:p-6"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="flex flex-wrap gap-6 sm:gap-8 justify-center">
            {ALL_HATS.map((hat) => {
              const lines = renderSprite(species, "·", hat);
              return (
                <div key={hat} className="flex flex-col items-center gap-2">
                  <pre
                    className="font-mono text-xs leading-tight select-none"
                    style={{ whiteSpace: "pre", color: "#4ade80" }}
                  >
                    {lines.join("\n")}
                  </pre>
                  <span className="font-mono text-[10px] capitalize" style={{ color: "#6b7280" }}>
                    {hat}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Species Stats ── */}
      {discovered && (
        <section>
          <h2 className="font-display text-base sm:text-lg font-bold mb-4" style={{ color: "#e5e7eb" }}>
            Species Stats
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rarity Breakdown */}
            <div
              className="rounded-xl p-4 sm:p-5"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
            >
              <div className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>
                Rarity breakdown
              </div>
              <div className="space-y-2">
                {(["legendary", "epic", "rare", "uncommon", "common"] as Rarity[]).map((rarity) => {
                  const count = stats.rarityBreakdown[rarity] ?? 0;
                  const pct = stats.count > 0 ? Math.round((count / stats.count) * 100) : 0;
                  const color = RARITY_COLORS[rarity];
                  return (
                    <div key={rarity} className="flex items-center gap-2">
                      <span className="w-20 font-mono text-[10px] capitalize shrink-0" style={{ color: "#9ca3af" }}>
                        {rarity}
                      </span>
                      <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ backgroundColor: "#242424" }}>
                        <div style={{ width: `${pct}%`, height: "100%", backgroundColor: color, borderRadius: "9999px" }} />
                      </div>
                      <span className="w-5 text-right font-mono text-[10px] shrink-0" style={{ color: "#6b7280" }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              {stats.shinies > 0 && (
                <div className="mt-3 font-mono text-[10px]" style={{ color: "#eab308" }}>
                  ✨ {stats.shinies} shiny
                </div>
              )}
            </div>

            {/* Average Stats */}
            <div
              className="rounded-xl p-4 sm:p-5"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
            >
              <div className="font-mono text-xs uppercase tracking-wider mb-3" style={{ color: "#6b7280" }}>
                Average stats
              </div>
              <div className="space-y-2">
                {STAT_NAMES.map((stat) => {
                  const avg = stats.avgStats[stat] ?? 0;
                  return (
                    <div key={stat} className="flex items-center gap-2">
                      <span className="w-24 font-mono text-[10px] uppercase shrink-0" style={{ color: "#6b7280" }}>
                        {stat}
                      </span>
                      <div className="flex-1 rounded-full overflow-hidden h-1.5" style={{ backgroundColor: "#242424" }}>
                        <div
                          style={{
                            width: `${Math.min(100, avg)}%`,
                            height: "100%",
                            background: "#4ade80",
                            borderRadius: "9999px",
                          }}
                        />
                      </div>
                      <span className="w-7 text-right font-mono text-[10px] shrink-0" style={{ color: "#e5e7eb" }}>
                        {avg}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* First discovered */}
          {stats.firstDiscovered && (
            <div
              className="mt-4 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
            >
              <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: "#6b7280" }}>
                First discovered
              </span>
              <span className="font-mono text-xs" style={{ color: "#4ade80" }}>
                @{stats.firstDiscovered.username}
              </span>
              <span className="font-mono text-[10px] ml-auto" style={{ color: "#6b7280" }}>
                {new Date(stats.firstDiscovered.hatched_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </section>
      )}

      {/* ── Known Specimens ── */}
      <section>
        <h2 className="font-display text-base sm:text-lg font-bold mb-4" style={{ color: "#e5e7eb" }}>
          Known Specimens
          {buddies.length > 0 && (
            <span className="font-mono text-xs font-normal ml-2" style={{ color: "#6b7280" }}>
              ({buddies.length})
            </span>
          )}
        </h2>
        {buddies.length === 0 ? (
          <div
            className="rounded-xl p-8 sm:p-12 text-center"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
          >
            <div className="font-mono text-sm mb-2" style={{ color: "#6b7280" }}>
              No specimens registered yet.
            </div>
            <a
              href="/submit"
              className="font-mono text-xs transition-colors hover:text-white"
              style={{ color: "#4ade80" }}
            >
              Be the first →
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {buddies.map((buddy) => (
              <a key={buddy.id} href={`/u/${buddy.username}`} className="block">
                <BuddyCard buddy={buddy} />
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

**Note on `params`:** Next.js 16 (App Router, React 19) makes `params` a `Promise<...>`. Always `await params` before destructuring — this matches the pattern used in Next.js 15+ and avoids the deprecation warning.

---

## Step 5: Add "Dex" Nav Link (`web/app/layout.tsx`)

Add one `<a>` before the `Stats` link in the nav. Keep it between "Leaderboard" and "Stats".

**Old nav block:**
```tsx
<nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm" style={{ color: "#9ca3af" }}>
  <a
    href="/"
    className="hover:text-white transition-colors"
  >
    Leaderboard
  </a>
  <a
    href="/stats"
    className="hover:text-white transition-colors"
  >
    Stats
  </a>
```

**New nav block (add Dex link between Leaderboard and Stats):**
```tsx
<nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm" style={{ color: "#9ca3af" }}>
  <a
    href="/"
    className="hover:text-white transition-colors"
  >
    Leaderboard
  </a>
  <a
    href="/dex"
    className="hover:text-white transition-colors"
  >
    Dex
  </a>
  <a
    href="/stats"
    className="hover:text-white transition-colors"
  >
    Stats
  </a>
```

---

## Implementation Order

Execute these steps in sequence. Each step is independently committable.

### Step 1 — Query functions
**Files:** `web/lib/queries.ts`

- Add `import { SPECIES_LIST } from "./constants"` (and add `Rarity` to types import)
- Append `getDexOverview()`, `getSpeciesStats()`, `getSpeciesBuddies()` to the bottom of the file

**Commit:** `feat: add getDexOverview, getSpeciesStats, getSpeciesBuddies query functions`

### Step 2 — DexSpriteCard component
**Files:** `web/components/DexSpriteCard.tsx` (new)

- Create the component as specified above

**Commit:** `feat: add DexSpriteCard component for species grid tiles`

### Step 3 — /dex page
**Files:** `web/app/dex/page.tsx` (new), `web/app/dex/DexClient.tsx` (new)

- Create `page.tsx` (server component with header + progress bar + `<DexClient>`)
- Create `DexClient.tsx` (client component with filter state + grid rendering)

**Commit:** `feat: add /dex BuddyDex species gallery page`

### Step 4 — /dex/[species] detail page
**Files:** `web/app/dex/[species]/page.tsx` (new)

- Create the detail page as specified above

**Commit:** `feat: add /dex/[species] species detail page with eye/hat variants and specimens`

### Step 5 — Nav link
**Files:** `web/app/layout.tsx`

- Insert "Dex" nav link as specified above

**Commit:** `chore: add Dex nav link to global header`

---

## Key Design Decisions

### Silhouette effect for undiscovered species
`filter: brightness(0) opacity(0.2)` on the `<pre>` element. No extra CSS class or SVG needed. Works on the ASCII text itself.

### Client-side filtering in DexClient
All 18 species' overview data is tiny (18 rows, 3 fields each) — sending it to the client and filtering in-state is far simpler than URL search params + server re-fetching. No `useSearchParams`, no `Suspense` wrapper needed.

### `generateStaticParams` for species detail
Generates all 18 static paths at build time. Since `revalidate = 300`, ISR refreshes stale pages every 5 minutes. This matches the stats page pattern.

### `params` as a Promise (Next.js 15+/16)
`params` in dynamic route `page.tsx` is `Promise<{ species: string }>`. Always `await params` before use.

### No `notFound()` on zero-count species
Undiscovered species (count === 0) still get a valid detail page — showing the sprite's eye/hat variants is the point even before any specimens exist. Only truly invalid species slugs (not in `SPECIES_LIST`) trigger `notFound()`.

### BuddyCard reuse
The existing `BuddyCard` component is wrapped in an `<a href="/u/[username]">` on the specimens grid. No modifications to `BuddyCard` needed.

### No Tailwind custom spacing
All spacing uses standard Tailwind classes (`p-4`, `gap-3`, `mb-4`, etc.) and inline `style` props for custom colors. The Tailwind v4 `--spacing-*` override pitfall is avoided throughout.

### `DexSpriteCard` is a server component
It calls `renderSprite()` (pure function, no client APIs) and returns static HTML. No `"use client"` directive needed. The only client component in the feature is `DexClient.tsx`.

---

## Component/File Reference

| File | Type | Purpose |
|------|------|---------|
| `web/lib/queries.ts` | Modified | +3 query functions |
| `web/components/DexSpriteCard.tsx` | New (server) | Species tile for grid |
| `web/app/dex/page.tsx` | New (server) | /dex main page |
| `web/app/dex/DexClient.tsx` | New (client) | Filter state + grid |
| `web/app/dex/[species]/page.tsx` | New (server) | /dex/[species] detail |
| `web/app/layout.tsx` | Modified | Add Dex nav link |

Total: 4 new files, 2 modified files.
