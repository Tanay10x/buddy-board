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
          <span
            className="font-mono text-[10px] sm:text-xs capitalize w-16 sm:w-24 shrink-0"
            style={{ color: "#9ca3af" }}
          >
            {key}
          </span>
          <div
            className="flex-1 rounded-sm overflow-hidden h-2 sm:h-3"
            style={{ backgroundColor: "#1a1a1a" }}
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

export default async function StatsPage() {
  const stats = await getGlobalStats();

  return (
    <div className="max-w-3xl mx-auto space-y-10 sm:space-y-14">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="text-center pt-2 sm:pt-4">
        <h1 className="font-display text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tight" style={{ color: "#e5e7eb" }}>
          Global Stats
        </h1>
        <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
          {stats.totalBuddies} {stats.totalBuddies === 1 ? "buddy" : "buddies"} registered
          {stats.shinies > 0 && (
            <span style={{ color: "#4ade80" }}> &bull; {stats.shinies} shiny</span>
          )}
        </p>
      </div>

      {/* ── Species Distribution ─────────────────────────── */}
      <section>
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5" style={{ color: "#e5e7eb" }}>
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
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5" style={{ color: "#e5e7eb" }}>
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
        <h2 className="font-display text-lg sm:text-xl font-bold mb-4 sm:mb-5" style={{ color: "#e5e7eb" }}>
          Average Stats
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
          {Object.entries(stats.avgStats).map(([stat, avg]) => (
            <div
              key={stat}
              className="rounded-lg p-3 sm:p-4 text-center"
              style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
            >
              <div className="font-display text-xl sm:text-2xl font-bold mb-1" style={{ color: "#4ade80" }}>
                {avg}
              </div>
              <div className="font-mono text-[10px] sm:text-xs uppercase" style={{ color: "#6b7280" }}>
                {stat}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
