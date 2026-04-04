# Phase 8: Stats Page Enhancements

## Overview

Enhance `/stats` with five new sections: a combinations counter, a Rarest Finds showcase,
a Hall of Fame, auto-generated Fun Facts, and improved charts. All data comes from a single
expanded query so we hit Supabase once per cache cycle.

### Next.js 16 Caching Strategy

The existing `export const revalidate = 300` is the old ISR pattern. Because this project
uses Next.js 16 with `cacheComponents`, replace it with `'use cache'` + `cacheLife` at the
query level. The page itself becomes a normal async Server Component; caching lives inside
the data functions.

---

## Step 1 — Expand `getGlobalStats` in `web/lib/queries.ts`

Replace the existing `getGlobalStats` export with the version below. It returns everything
the new page needs in one Supabase round-trip.

```ts
// web/lib/queries.ts  (add these imports at top if not already present)
import { cacheLife, cacheTag } from 'next/cache';
```

Replace the entire `getGlobalStats` function:

```ts
export async function getGlobalStats(): Promise<{
  totalBuddies: number;
  speciesCounts: Record<string, number>;
  rarityCounts: Record<string, number>;
  avgStats: Record<string, number>;
  statRanges: Record<string, { min: number; max: number; avg: number }>;
  shinies: number;
  legendaries: number;
  shinyLegendaries: number;
  mostCommonSpecies: { species: string; count: number } | null;
  topThreeOverall: Buddy[];
  topPerStat: Record<StatName, Buddy>;
  rarestFinds: Buddy[];
  combinations: { total: number; discovered: number };
}> {
  'use cache';
  cacheLife('minutes');
  cacheTag('global-stats');

  const { data, error } = await supabase.from('buddies_public').select('*');
  if (error || !data) {
    return {
      totalBuddies: 0,
      speciesCounts: {},
      rarityCounts: {},
      avgStats: {},
      statRanges: {},
      shinies: 0,
      legendaries: 0,
      shinyLegendaries: 0,
      mostCommonSpecies: null,
      topThreeOverall: [],
      topPerStat: {} as Record<StatName, Buddy>,
      rarestFinds: [],
      combinations: { total: 1728, discovered: 0 },
    };
  }

  const buddies = data as Buddy[];

  // ── Counts ────────────────────────────────────────────────────────────
  const speciesCounts: Record<string, number> = {};
  const rarityCounts: Record<string, number> = {};
  const statSums: Record<string, number> = {
    DEBUGGING: 0, PATIENCE: 0, CHAOS: 0, WISDOM: 0, SNARK: 0,
  };
  const statMins: Record<string, number> = {
    DEBUGGING: Infinity, PATIENCE: Infinity, CHAOS: Infinity,
    WISDOM: Infinity, SNARK: Infinity,
  };
  const statMaxs: Record<string, number> = {
    DEBUGGING: -Infinity, PATIENCE: -Infinity, CHAOS: -Infinity,
    WISDOM: -Infinity, SNARK: -Infinity,
  };
  let shinies = 0;
  let legendaries = 0;
  let shinyLegendaries = 0;

  for (const b of buddies) {
    speciesCounts[b.species] = (speciesCounts[b.species] || 0) + 1;
    rarityCounts[b.rarity] = (rarityCounts[b.rarity] || 0) + 1;
    if (b.shiny) shinies++;
    if (b.rarity === 'legendary') legendaries++;
    if (b.shiny && b.rarity === 'legendary') shinyLegendaries++;
    for (const stat of Object.keys(statSums) as StatName[]) {
      const v = b.stats[stat] ?? 0;
      statSums[stat] += v;
      if (v < statMins[stat]) statMins[stat] = v;
      if (v > statMaxs[stat]) statMaxs[stat] = v;
    }
  }

  const n = buddies.length;
  const avgStats: Record<string, number> = {};
  const statRanges: Record<string, { min: number; max: number; avg: number }> = {};
  for (const stat of Object.keys(statSums)) {
    const avg = n > 0 ? Math.round(statSums[stat] / n) : 0;
    avgStats[stat] = avg;
    statRanges[stat] = {
      min: isFinite(statMins[stat]) ? statMins[stat] : 0,
      max: isFinite(statMaxs[stat]) ? statMaxs[stat] : 0,
      avg,
    };
  }

  // ── Most common species ───────────────────────────────────────────────
  let mostCommonSpecies: { species: string; count: number } | null = null;
  for (const [species, count] of Object.entries(speciesCounts)) {
    if (!mostCommonSpecies || count > mostCommonSpecies.count) {
      mostCommonSpecies = { species, count };
    }
  }

  // ── Hall of Fame: top 3 overall ───────────────────────────────────────
  const topThreeOverall = [...buddies]
    .sort((a, b) => b.total_stats - a.total_stats)
    .slice(0, 3);

  // ── Hall of Fame: top 1 per stat ──────────────────────────────────────
  const statNames: StatName[] = ['DEBUGGING', 'PATIENCE', 'CHAOS', 'WISDOM', 'SNARK'];
  const topPerStat = {} as Record<StatName, Buddy>;
  for (const stat of statNames) {
    const best = [...buddies].sort(
      (a, b) => (b.stats[stat] ?? 0) - (a.stats[stat] ?? 0),
    )[0];
    if (best) topPerStat[stat] = best;
  }

  // ── Rarest Finds: shinies + legendaries, up to 6 ─────────────────────
  const rarestFinds = buddies
    .filter((b) => b.shiny || b.rarity === 'legendary')
    .sort((a, b) => {
      // shiny legendary first, then legendary, then shiny
      const scoreA = (a.shiny && a.rarity === 'legendary' ? 2 : a.rarity === 'legendary' ? 1 : 0);
      const scoreB = (b.shiny && b.rarity === 'legendary' ? 2 : b.rarity === 'legendary' ? 1 : 0);
      return scoreB - scoreA;
    })
    .slice(0, 6);

  // ── Combinations ──────────────────────────────────────────────────────
  // 18 species × 6 eyes × 8 hats × 2 shiny = 1,728
  const TOTAL_COMBINATIONS = 18 * 6 * 8 * 2; // 1728
  const seen = new Set<string>();
  for (const b of buddies) {
    seen.add(`${b.species}|${b.eye}|${b.hat}|${b.shiny ? '1' : '0'}`);
  }

  return {
    totalBuddies: n,
    speciesCounts,
    rarityCounts,
    avgStats,
    statRanges,
    shinies,
    legendaries,
    shinyLegendaries,
    mostCommonSpecies,
    topThreeOverall,
    topPerStat,
    rarestFinds,
    combinations: { total: TOTAL_COMBINATIONS, discovered: seen.size },
  };
}
```

**Why one query:** Every stat is derived in JavaScript from the full `buddies_public` table.
Supabase calls are already cheap at this scale, and the `'use cache'` directive means the
work only runs once per revalidation window (default: ~5 min with `cacheLife('minutes')`).

---

## Step 2 — Create `web/components/MiniBuddyCard.tsx`

A compact version of `BuddyCard` used in Rarest Finds and Hall of Fame. It shares the same
rarity border/glow config but omits stats bars to stay small.

```tsx
// web/components/MiniBuddyCard.tsx
import { SpriteRenderer } from './SpriteRenderer';
import { RarityBadge } from './RarityBadge';
import { RARITY_COLORS } from '@/lib/constants';
import type { Buddy, Rarity } from '@/lib/types';

function getRarityConfig(rarity: Rarity): { borderColor: string; extraClasses: string } {
  switch (rarity) {
    case 'common':    return { borderColor: '#9ca3af', extraClasses: '' };
    case 'uncommon':  return { borderColor: '#22c55e', extraClasses: '' };
    case 'rare':      return { borderColor: '#3b82f6', extraClasses: 'card-glow-rare' };
    case 'epic':      return { borderColor: '#a855f7', extraClasses: 'card-glow-epic' };
    case 'legendary': return { borderColor: '#eab308', extraClasses: 'card-glow-legendary holo-shimmer' };
  }
}

export function MiniBuddyCard({
  buddy,
  badge,
}: {
  buddy: Buddy;
  /** Optional rank/label badge, e.g. "#1" or "DEBUGGING" */
  badge?: string;
}) {
  const { borderColor, extraClasses } = getRarityConfig(buddy.rarity);
  const rarityColor = RARITY_COLORS[buddy.rarity];

  return (
    <div
      className={`scanlines relative rounded-xl border-2 overflow-hidden transition-transform duration-300 ease-out hover:-translate-y-1 ${extraClasses}`}
      style={{ borderColor, backgroundColor: '#1a1a1a' }}
    >
      <div className="relative z-10 p-3 sm:p-4">
        {/* Badge */}
        {badge && (
          <div className="absolute top-2 right-2">
            <span
              className="font-mono text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
              style={{ backgroundColor: '#0c0c0c', color: rarityColor, border: `1px solid ${borderColor}` }}
            >
              {badge}
            </span>
          </div>
        )}

        {/* Rarity + shiny row */}
        <div className="flex items-center gap-1.5 mb-2">
          <RarityBadge rarity={buddy.rarity} />
          {buddy.shiny && (
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: '#eab308' }}>
              ✨
            </span>
          )}
        </div>

        {/* Sprite + name */}
        <div className="flex items-center gap-2.5">
          <SpriteRenderer species={buddy.species} eye={buddy.eye} hat={buddy.hat} />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold leading-tight truncate" style={{ color: '#e5e7eb' }}>
              {buddy.name}
            </p>
            <p className="font-mono text-[10px] truncate mt-0.5" style={{ color: '#6b7280' }}>
              @{buddy.username}
            </p>
            <p className="font-mono text-[10px] capitalize mt-0.5" style={{ color: rarityColor }}>
              {buddy.species}
            </p>
          </div>
        </div>

        {/* Total stats */}
        <div className="mt-2 pt-2" style={{ borderTop: '1px solid #1f1f1f' }}>
          <span className="font-mono text-[10px]" style={{ color: '#6b7280' }}>
            TOTAL{' '}
            <span style={{ color: '#4ade80' }} className="font-bold">
              {buddy.total_stats}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## Step 3 — Rewrite `web/app/stats/page.tsx`

Drop `export const revalidate = 300` (old ISR). Caching now lives in the query. Add all five
new sections below the existing ones, and upgrade the charts.

```tsx
// web/app/stats/page.tsx
import { getGlobalStats } from '@/lib/queries';
import { MiniBuddyCard } from '@/components/MiniBuddyCard';
import { RARITY_COLORS, STAT_NAMES } from '@/lib/constants';
import type { Rarity, StatName } from '@/lib/types';

// ─── Bar Chart (enhanced) ────────────────────────────────────────────────────

function BarChart({
  data,
  colorFn,
  showCount = true,
}: {
  data: Record<string, number>;
  colorFn?: (key: string) => string;
  showCount?: boolean;
}) {
  const max = Math.max(...Object.values(data), 1);
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {sorted.map(([key, count]) => (
        <div key={key} className="flex items-center gap-2 sm:gap-3">
          <span
            className="font-mono text-[10px] sm:text-xs capitalize w-20 sm:w-28 shrink-0"
            style={{ color: '#9ca3af' }}
          >
            {key}
          </span>
          <div
            className="flex-1 rounded-sm overflow-hidden h-3 sm:h-4 relative"
            style={{ backgroundColor: '#111' }}
          >
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: '100%',
                backgroundColor: colorFn?.(key) ?? '#4ade80',
                borderRadius: '2px',
              }}
            />
          </div>
          {showCount && (
            <span
              className="font-mono text-[10px] sm:text-xs w-8 text-right shrink-0"
              style={{ color: '#6b7280' }}
            >
              {count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Stat Range Chart ────────────────────────────────────────────────────────

function StatRangeChart({
  ranges,
}: {
  ranges: Record<string, { min: number; max: number; avg: number }>;
}) {
  const MAX_VAL = 100;

  return (
    <div className="space-y-4">
      {STAT_NAMES.map((stat) => {
        const r = ranges[stat];
        if (!r) return null;
        const minPct = (r.min / MAX_VAL) * 100;
        const maxPct = (r.max / MAX_VAL) * 100;
        const avgPct = (r.avg / MAX_VAL) * 100;

        return (
          <div key={stat}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[10px] sm:text-xs uppercase" style={{ color: '#9ca3af' }}>
                {stat}
              </span>
              <span className="font-mono text-[10px]" style={{ color: '#6b7280' }}>
                {r.min} — {r.avg} — {r.max}
              </span>
            </div>
            {/* Track */}
            <div className="relative h-2 sm:h-3 rounded-sm overflow-hidden" style={{ backgroundColor: '#111' }}>
              {/* Range band: min → max */}
              <div
                className="absolute top-0 h-full rounded-sm"
                style={{
                  left: `${minPct}%`,
                  width: `${maxPct - minPct}%`,
                  backgroundColor: 'rgba(74,222,128,0.2)',
                }}
              />
              {/* Avg tick */}
              <div
                className="absolute top-0 h-full w-0.5"
                style={{
                  left: `${avgPct}%`,
                  backgroundColor: '#4ade80',
                }}
              />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="font-mono text-[9px]" style={{ color: '#374151' }}>min {r.min}</span>
              <span className="font-mono text-[9px]" style={{ color: '#4ade80' }}>avg {r.avg}</span>
              <span className="font-mono text-[9px]" style={{ color: '#374151' }}>max {r.max}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const stats = await getGlobalStats();

  const shinyPct =
    stats.totalBuddies > 0
      ? Math.round((stats.shinies / stats.totalBuddies) * 100)
      : 0;

  const funFacts: string[] = [
    stats.mostCommonSpecies
      ? `Most common species is ${stats.mostCommonSpecies.species} with ${stats.mostCommonSpecies.count} ${stats.mostCommonSpecies.count === 1 ? 'buddy' : 'buddies'}.`
      : null,
    `Average WISDOM across all buddies is ${stats.avgStats['WISDOM'] ?? 0}.`,
    stats.totalBuddies > 0
      ? `${shinyPct}% of buddies are shiny.`
      : null,
    stats.shinyLegendaries === 0
      ? 'No one has found a shiny legendary yet!'
      : `${stats.shinyLegendaries} shiny ${stats.shinyLegendaries === 1 ? 'legendary has' : 'legendaries have'} been discovered.`,
    stats.legendaries > 0
      ? `${stats.legendaries} legendary ${stats.legendaries === 1 ? 'buddy' : 'buddies'} walk among us.`
      : 'No legendaries discovered yet — will you be the first?',
  ].filter(Boolean) as string[];

  const HOF_MEDALS = ['#1', '#2', '#3'];

  return (
    <div className="max-w-3xl mx-auto space-y-10 sm:space-y-14">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center pt-2 sm:pt-4">
        <h1
          className="font-display text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight"
          style={{ color: '#e5e7eb' }}
        >
          Global Stats
        </h1>
        <p className="font-sans text-sm" style={{ color: '#6b7280' }}>
          {stats.totalBuddies}{' '}
          {stats.totalBuddies === 1 ? 'buddy' : 'buddies'} registered
          {stats.shinies > 0 && (
            <span style={{ color: '#4ade80' }}> &bull; {stats.shinies} shiny</span>
          )}
        </p>
      </div>

      {/* ── Total Possible Combinations ────────────────────────────────── */}
      <section>
        <div
          className="rounded-lg p-5 sm:p-6 text-center"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
        >
          <p className="font-display text-3xl sm:text-4xl font-black mb-1" style={{ color: '#4ade80' }}>
            {stats.combinations.total.toLocaleString()}
          </p>
          <p className="font-sans text-sm mb-3" style={{ color: '#9ca3af' }}>
            unique looks possible
          </p>
          <div
            className="inline-flex items-center gap-2 rounded-md px-3 py-1.5"
            style={{ backgroundColor: '#111', border: '1px solid #2e2e2e' }}
          >
            <span className="font-mono text-xs font-bold" style={{ color: '#4ade80' }}>
              {stats.combinations.discovered.toLocaleString()}
            </span>
            <span className="font-mono text-xs" style={{ color: '#6b7280' }}>
              discovered so far
            </span>
            <span className="font-mono text-xs" style={{ color: '#374151' }}>
              ({stats.combinations.total > 0
                ? Math.round((stats.combinations.discovered / stats.combinations.total) * 100)
                : 0}%)
            </span>
          </div>
          <p className="font-mono text-[10px] mt-3" style={{ color: '#374151' }}>
            18 species × 6 eyes × 8 hats × 2 shiny
          </p>
        </div>
      </section>

      {/* ── Fun Facts ──────────────────────────────────────────────────── */}
      {funFacts.length > 0 && (
        <section>
          <h2
            className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
            style={{ color: '#e5e7eb' }}
          >
            Fun Facts
          </h2>
          <div className="grid gap-2 sm:gap-3">
            {funFacts.map((fact, i) => (
              <div
                key={i}
                className="rounded-lg px-4 py-3 flex items-start gap-3"
                style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
              >
                <span style={{ color: '#4ade80' }} className="mt-0.5 shrink-0">▸</span>
                <p className="font-sans text-sm" style={{ color: '#9ca3af' }}>
                  {fact}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Hall of Fame ───────────────────────────────────────────────── */}
      {(stats.topThreeOverall.length > 0 || Object.keys(stats.topPerStat).length > 0) && (
        <section>
          <h2
            className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
            style={{ color: '#e5e7eb' }}
          >
            Hall of Fame
          </h2>

          {/* Top 3 overall */}
          {stats.topThreeOverall.length > 0 && (
            <div className="mb-6">
              <p className="font-mono text-xs uppercase mb-3" style={{ color: '#6b7280' }}>
                Top Overall
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {stats.topThreeOverall.map((buddy, idx) => (
                  <MiniBuddyCard key={buddy.id} buddy={buddy} badge={HOF_MEDALS[idx]} />
                ))}
              </div>
            </div>
          )}

          {/* Top per stat */}
          {Object.keys(stats.topPerStat).length > 0 && (
            <div>
              <p className="font-mono text-xs uppercase mb-3" style={{ color: '#6b7280' }}>
                Stat Champions
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {STAT_NAMES.map((stat) => {
                  const buddy = stats.topPerStat[stat];
                  if (!buddy) return null;
                  return <MiniBuddyCard key={`${stat}-${buddy.id}`} buddy={buddy} badge={stat} />;
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Rarest Finds ───────────────────────────────────────────────── */}
      {stats.rarestFinds.length > 0 && (
        <section>
          <h2
            className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
            style={{ color: '#e5e7eb' }}
          >
            Rarest Finds
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.rarestFinds.map((buddy) => (
              <MiniBuddyCard key={buddy.id} buddy={buddy} />
            ))}
          </div>
          {stats.shinies === 0 && stats.legendaries === 0 && (
            <p className="font-mono text-xs text-center mt-4" style={{ color: '#374151' }}>
              No shinies or legendaries discovered yet.
            </p>
          )}
        </section>
      )}

      {/* ── Species Distribution ───────────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: '#e5e7eb' }}
        >
          Species Distribution
        </h2>
        <div
          className="rounded-lg p-4 sm:p-6"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
        >
          <BarChart data={stats.speciesCounts} />
        </div>
      </section>

      {/* ── Rarity Distribution ────────────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: '#e5e7eb' }}
        >
          Rarity Distribution
        </h2>
        <div
          className="rounded-lg p-4 sm:p-6"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
        >
          <BarChart
            data={stats.rarityCounts}
            colorFn={(key) => RARITY_COLORS[key as Rarity] ?? '#9ca3af'}
          />
        </div>
      </section>

      {/* ── Average Stats ──────────────────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: '#e5e7eb' }}
        >
          Average Stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          {Object.entries(stats.avgStats).map(([stat, avg]) => (
            <div
              key={stat}
              className="rounded-lg p-3 sm:p-4 text-center"
              style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
            >
              <div
                className="font-display text-xl sm:text-2xl font-bold mb-1"
                style={{ color: '#4ade80' }}
              >
                {avg}
              </div>
              <div
                className="font-mono text-[10px] sm:text-xs uppercase"
                style={{ color: '#6b7280' }}
              >
                {stat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stat Ranges ────────────────────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: '#e5e7eb' }}
        >
          Stat Distribution
        </h2>
        <div
          className="rounded-lg p-4 sm:p-6"
          style={{ backgroundColor: '#1a1a1a', border: '1px solid #2e2e2e' }}
        >
          <p className="font-mono text-[10px] mb-4" style={{ color: '#374151' }}>
            min — avg — max per stat. Green band = range, tick = average.
          </p>
          <StatRangeChart ranges={stats.statRanges} />
        </div>
      </section>

    </div>
  );
}
```

---

## Step 4 — Update `web/next.config.ts`

Enable Cache Components (required for `'use cache'`). If the file already has other config,
merge this in:

```ts
// web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  cacheComponents: true,
  // ...other existing config
};

export default nextConfig;
```

**Important:** Remove `export const revalidate = 300` from `app/stats/page.tsx` — the old
ISR export is superseded by the `'use cache'` directive inside `getGlobalStats`.

---

## Step 5 — Verify `SpriteRenderer` and `RarityBadge` exports

`MiniBuddyCard` reuses these two components. Confirm they are named exports (not default):
