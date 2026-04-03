import { getGlobalStats } from "@/lib/queries";
import { RARITY_COLORS } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

export const revalidate = 300;

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
          <span className="font-mono text-[10px] sm:text-xs capitalize w-16 sm:w-24 shrink-0 text-text-secondary">
            {key}
          </span>
          <div className="flex-1 rounded-sm overflow-hidden h-1.5 sm:h-2 bg-surface">
            <div
              style={{
                width: `${(count / max) * 100}%`,
                height: "100%",
                backgroundColor: colorFn?.(key) ?? "#4ade80",
                borderRadius: "2px",
              }}
            />
          </div>
          <span className="font-mono text-[10px] sm:text-xs w-7 sm:w-8 text-right shrink-0 text-text-muted">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function StatsPage() {
  const stats = await getGlobalStats();

  return (
    <div className="max-w-3xl mx-auto space-y-10 sm:space-y-14">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="text-center pt-2 sm:pt-4">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight text-text-primary">
          Global Stats
        </h1>
        <p className="font-sans text-sm text-text-muted">
          {stats.totalBuddies} {stats.totalBuddies === 1 ? "buddy" : "buddies"} registered
          {stats.shinies > 0 && (
            <span className="text-terminal"> &bull; {stats.shinies} shiny</span>
          )}
        </p>
      </div>

      {/* ── Species Distribution ─────────────────────────── */}
      <section>
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-text-primary">
          Species Distribution
        </h2>
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <BarChart data={stats.speciesCounts} />
        </div>
      </section>

      {/* ── Rarity Distribution ──────────────────────────── */}
      <section>
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-text-primary">
          Rarity Distribution
        </h2>
        <div className="rounded-lg border border-border bg-surface p-4 sm:p-6">
          <BarChart
            data={stats.rarityCounts}
            colorFn={(key) => RARITY_COLORS[key as Rarity] ?? "#9ca3af"}
          />
        </div>
      </section>

      {/* ── Average Stats ────────────────────────────────── */}
      <section>
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5 text-text-primary">
          Average Stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          {Object.entries(stats.avgStats).map(([stat, avg]) => (
            <div
              key={stat}
              className="rounded-lg border border-border bg-surface p-3 sm:p-4 text-center"
            >
              <div className="font-display text-xl sm:text-2xl font-bold mb-1 text-terminal">
                {avg}
              </div>
              <div className="font-mono text-[10px] sm:text-xs uppercase text-text-muted">
                {stat}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
