import { getGlobalStats } from "@/lib/queries";
import { RARITY_COLORS } from "@/lib/constants";
import type { Buddy, Rarity, StatName } from "@/lib/types";

export const revalidate = 300;

// ── Sub-components ────────────────────────────────────────────────────────────

function BarChart({
  data,
  colorFn,
}: {
  data: Record<string, number>;
  colorFn?: (key: string) => string;
}) {
  const max = Math.max(...Object.values(data), 1);
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {sorted.map(([key, count]) => (
        <div key={key} className="flex items-center gap-2 sm:gap-3">
          <span
            className="font-mono text-[10px] sm:text-xs capitalize w-16 sm:w-24 shrink-0"
            style={{ color: "#9ca3af" }}
          >
            {key}
          </span>
          <div
            className="flex-1 rounded-sm overflow-hidden h-2 sm:h-3"
            style={{ backgroundColor: "#111111" }}
          >
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: "100%",
                backgroundColor: colorFn?.(key) ?? "#4ade80",
                borderRadius: "2px",
              }}
            />
          </div>
          <span
            className="font-mono text-[10px] sm:text-xs w-7 sm:w-8 text-right shrink-0"
            style={{ color: "#6b7280" }}
          >
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const colors: Record<number, string> = {
    1: "#eab308",
    2: "#9ca3af",
    3: "#b45309",
  };
  return (
    <span
      className="font-mono text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full shrink-0"
      style={{ backgroundColor: colors[rank] ?? "#374151", color: "#0a0a0a" }}
    >
      {rank}
    </span>
  );
}

function MiniCard({ buddy, rank }: { buddy: Buddy; rank: number }) {
  return (
    <div
      className="rounded-lg p-3 sm:p-4 flex items-start gap-3"
      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
    >
      <RankBadge rank={rank} />
      <div className="min-w-0 flex-1">
        <div className="font-mono text-xs truncate" style={{ color: "#9ca3af" }}>
          @{buddy.username}
        </div>
        <div className="font-sans text-sm font-semibold truncate" style={{ color: "#e5e7eb" }}>
          {buddy.name}
        </div>
        <div className="font-mono text-xs mt-1" style={{ color: "#4ade80" }}>
          {buddy.total_stats} pts
        </div>
      </div>
      <div
        className="font-mono text-xs capitalize shrink-0"
        style={{ color: RARITY_COLORS[buddy.rarity] ?? "#9ca3af" }}
      >
        {buddy.species}
      </div>
    </div>
  );
}

function StatChampionRow({ stat, buddy }: { stat: StatName; buddy: Buddy }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg p-3"
      style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
    >
      <span
        className="font-mono text-[10px] uppercase w-20 sm:w-24 shrink-0"
        style={{ color: "#6b7280" }}
      >
        {stat}
      </span>
      <span
        className="font-mono text-sm font-bold shrink-0"
        style={{ color: "#4ade80" }}
      >
        {buddy.stats[stat]}
      </span>
      <span className="flex-1 font-sans text-sm truncate" style={{ color: "#e5e7eb" }}>
        {buddy.name}
      </span>
      <span className="font-mono text-xs shrink-0" style={{ color: "#9ca3af" }}>
        @{buddy.username}
      </span>
    </div>
  );
}

function RareCard({ buddy }: { buddy: Buddy }) {
  const isShinyLegendary = buddy.shiny && buddy.rarity === "legendary";
  const isShiny = buddy.shiny;
  const isLegendary = buddy.rarity === "legendary";

  let badgeColor = "#9ca3af";
  let badgeText = "";
  if (isShinyLegendary) {
    badgeColor = "#eab308";
    badgeText = "✦ Shiny Legendary";
  } else if (isLegendary) {
    badgeColor = "#eab308";
    badgeText = "Legendary";
  } else if (isShiny) {
    badgeColor = "#4ade80";
    badgeText = "✦ Shiny";
  }

  return (
    <div
      className="rounded-lg p-3 sm:p-4 flex flex-col gap-1.5"
      style={{
        backgroundColor: "#1a1a1a",
        border: `1px solid ${isShinyLegendary ? "#eab308" : isShiny ? "#4ade80" : "#2e2e2e"}`,
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-mono text-[10px] font-bold uppercase"
          style={{ color: badgeColor }}
        >
          {badgeText}
        </span>
        <span
          className="font-mono text-[10px] capitalize"
          style={{ color: RARITY_COLORS[buddy.rarity] ?? "#9ca3af" }}
        >
          {buddy.rarity}
        </span>
      </div>
      <div className="font-sans text-sm font-semibold truncate" style={{ color: "#e5e7eb" }}>
        {buddy.name}
      </div>
      <div className="font-mono text-[10px]" style={{ color: "#9ca3af" }}>
        @{buddy.username} &middot; {buddy.species}
      </div>
      <div className="font-mono text-xs mt-0.5" style={{ color: "#4ade80" }}>
        {buddy.total_stats} pts
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StatsPage() {
  const stats = await getGlobalStats();
  const { combinations } = stats;
  const discoveredPct =
    combinations.total > 0
      ? Math.round((combinations.discovered / combinations.total) * 100)
      : 0;

  const statNames: StatName[] = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];
  const shinyPct =
    stats.totalBuddies > 0
      ? ((stats.shinies / stats.totalBuddies) * 100).toFixed(1)
      : "0";

  return (
    <div className="max-w-3xl mx-auto space-y-10 sm:space-y-14">

      {/* ── Header ───────────────────────────────────────── */}
      <div className="text-center pt-2 sm:pt-4">
        <h1
          className="font-display text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight"
          style={{ color: "#e5e7eb" }}
        >
          Global Stats
        </h1>
        <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
          {stats.totalBuddies} {stats.totalBuddies === 1 ? "buddy" : "buddies"} registered
          {stats.shinies > 0 && (
            <span style={{ color: "#4ade80" }}> &bull; {stats.shinies} shiny</span>
          )}
        </p>
      </div>

      {/* ── Combinations Counter ─────────────────────────── */}
      <section>
        <div
          className="rounded-lg p-4 sm:p-6"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <p className="font-sans text-sm sm:text-base mb-3" style={{ color: "#9ca3af" }}>
            <span style={{ color: "#4ade80" }} className="font-mono font-bold">
              {combinations.total.toLocaleString()}
            </span>{" "}
            unique looks possible —{" "}
            <span style={{ color: "#e5e7eb" }} className="font-mono font-bold">
              {combinations.discovered.toLocaleString()}
            </span>{" "}
            discovered so far
          </p>
          <div
            className="w-full h-2.5 rounded-full overflow-hidden"
            style={{ backgroundColor: "#111111" }}
          >
            <div
              style={{
                width: `${discoveredPct}%`,
                height: "100%",
                backgroundColor: "#4ade80",
                borderRadius: "9999px",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p className="font-mono text-[10px] mt-1.5 text-right" style={{ color: "#6b7280" }}>
            {discoveredPct}% complete
          </p>
        </div>
      </section>

      {/* ── Species Distribution ─────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: "#e5e7eb" }}
        >
          Species Distribution
        </h2>
        <div
          className="rounded-lg p-4 sm:p-6"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <BarChart data={stats.speciesCounts} />
        </div>
      </section>

      {/* ── Rarity Distribution ──────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: "#e5e7eb" }}
        >
          Rarity Distribution
        </h2>
        <div
          className="rounded-lg p-4 sm:p-6"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <BarChart
            data={stats.rarityCounts}
            colorFn={(key) => RARITY_COLORS[key as Rarity] ?? "#9ca3af"}
          />
        </div>
      </section>

      {/* ── Average Stats ────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: "#e5e7eb" }}
        >
          Average Stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          {Object.entries(stats.avgStats).map(([stat, avg]) => (
            <div
              key={stat}
              className="rounded-lg p-3 sm:p-4 text-center"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
            >
              <div
                className="font-display text-xl sm:text-2xl font-bold mb-1"
                style={{ color: "#4ade80" }}
              >
                {avg}
              </div>
              <div
                className="font-mono text-[10px] sm:text-xs uppercase"
                style={{ color: "#6b7280" }}
              >
                {stat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Hall of Fame ─────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: "#e5e7eb" }}
        >
          Hall of Fame
        </h2>

        {/* Top 3 Overall */}
        <h3
          className="font-sans text-sm font-semibold mb-3"
          style={{ color: "#9ca3af" }}
        >
          Top 3 Overall
        </h3>
        {stats.topThreeOverall.length === 0 ? (
          <p className="font-mono text-xs" style={{ color: "#6b7280" }}>
            No buddies yet — be the first!
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:gap-3 mb-6">
            {stats.topThreeOverall.map((buddy, i) => (
              <MiniCard key={buddy.id} buddy={buddy} rank={i + 1} />
            ))}
          </div>
        )}

        {/* Stat Champions */}
        <h3
          className="font-sans text-sm font-semibold mb-3"
          style={{ color: "#9ca3af" }}
        >
          Stat Champions
        </h3>
        {statNames.every((s) => !stats.topPerStat[s]) ? (
          <p className="font-mono text-xs" style={{ color: "#6b7280" }}>
            No data yet.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {statNames.map((stat) => {
              const buddy = stats.topPerStat[stat];
              if (!buddy) return null;
              return <StatChampionRow key={stat} stat={stat} buddy={buddy} />;
            })}
          </div>
        )}
      </section>

      {/* ── Rarest Finds ─────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: "#e5e7eb" }}
        >
          Rarest Finds
        </h2>
        {stats.rarestFinds.length === 0 ? (
          <div
            className="rounded-lg p-6 text-center"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
          >
            <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
              No rare finds yet — be the first!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
            {stats.rarestFinds.map((buddy) => (
              <RareCard key={buddy.id} buddy={buddy} />
            ))}
          </div>
        )}
      </section>

      {/* ── Fun Facts ────────────────────────────────────── */}
      <section>
        <h2
          className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5"
          style={{ color: "#e5e7eb" }}
        >
          Fun Facts
        </h2>
        <div
          className="rounded-lg p-4 sm:p-6 space-y-3"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          {stats.mostCommonSpecies && (
            <p className="font-sans text-sm" style={{ color: "#9ca3af" }}>
              <span style={{ color: "#4ade80" }}>▸</span>{" "}
              Most common species is{" "}
              <span className="font-mono" style={{ color: "#e5e7eb" }}>
                {stats.mostCommonSpecies.species}
              </span>{" "}
              with{" "}
              <span className="font-mono" style={{ color: "#e5e7eb" }}>
                {stats.mostCommonSpecies.count}
              </span>{" "}
              {stats.mostCommonSpecies.count === 1 ? "buddy" : "buddies"}
            </p>
          )}

          <p className="font-sans text-sm" style={{ color: "#9ca3af" }}>
            <span style={{ color: "#4ade80" }}>▸</span>{" "}
            Average wisdom across all buddies is{" "}
            <span className="font-mono" style={{ color: "#e5e7eb" }}>
              {stats.avgStats["WISDOM"] ?? 0}
            </span>
          </p>

          <p className="font-sans text-sm" style={{ color: "#9ca3af" }}>
            <span style={{ color: "#4ade80" }}>▸</span>{" "}
            {stats.shinies === 0 ? (
              <span>No shiny buddies found yet!</span>
            ) : (
              <>
                <span className="font-mono" style={{ color: "#e5e7eb" }}>
                  {shinyPct}%
                </span>{" "}
                of buddies are shiny
              </>
            )}
          </p>

          <p className="font-sans text-sm" style={{ color: "#9ca3af" }}>
            <span style={{ color: "#4ade80" }}>▸</span>{" "}
            {stats.legendaries === 0 ? (
              <span>No legendaries yet — only 1% chance!</span>
            ) : (
              <>
                There {stats.legendaries === 1 ? "is" : "are"}{" "}
                <span className="font-mono" style={{ color: "#eab308" }}>
                  {stats.legendaries}
                </span>{" "}
                legendary {stats.legendaries === 1 ? "buddy" : "buddies"}
              </>
            )}
          </p>

          <p className="font-sans text-sm" style={{ color: "#9ca3af" }}>
            <span style={{ color: "#4ade80" }}>▸</span>{" "}
            <span className="font-mono" style={{ color: "#e5e7eb" }}>
              {combinations.discovered.toLocaleString()}
            </span>{" "}
            unique combos discovered out of{" "}
            <span className="font-mono" style={{ color: "#e5e7eb" }}>
              {combinations.total.toLocaleString()}
            </span>{" "}
            possible
          </p>
        </div>
      </section>

    </div>
  );
}
