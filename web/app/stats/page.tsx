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
    <div className="space-y-3">
      {sorted.map(([key, count]) => (
        <div key={key} className="flex items-center gap-3">
          <span
            className="font-mono text-xs capitalize w-24 shrink-0"
            style={{ color: "#9ca3af" }}
          >
            {key}
          </span>
          <div
            className="flex-1 rounded-sm overflow-hidden"
            style={{ backgroundColor: "#1a1a1a", height: "8px" }}
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
            className="font-mono text-xs w-8 text-right shrink-0"
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
    <div className="max-w-3xl mx-auto space-y-14">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="text-center pt-4">
        <h1
          className="text-4xl font-black mb-2 tracking-tight"
          style={{ fontFamily: "Satoshi, sans-serif", color: "#e5e7eb" }}
        >
          Global Stats
        </h1>
        <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
          {stats.totalBuddies} {stats.totalBuddies === 1 ? "buddy" : "buddies"} registered
          {stats.shinies > 0 && (
            <span style={{ color: "#4ade80" }}> • {stats.shinies} shiny</span>
          )}
        </p>
      </div>

      {/* ── Species Distribution ─────────────────────────── */}
      <section>
        <h2
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "Satoshi, sans-serif", color: "#e5e7eb" }}
        >
          Species Distribution
        </h2>
        <div
          className="rounded-lg border p-6"
          style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
        >
          <BarChart data={stats.speciesCounts} />
        </div>
      </section>

      {/* ── Rarity Distribution ──────────────────────────── */}
      <section>
        <h2
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "Satoshi, sans-serif", color: "#e5e7eb" }}
        >
          Rarity Distribution
        </h2>
        <div
          className="rounded-lg border p-6"
          style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
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
          className="text-xl font-bold mb-5"
          style={{ fontFamily: "Satoshi, sans-serif", color: "#e5e7eb" }}
        >
          Average Stats
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(stats.avgStats).map(([stat, avg]) => (
            <div
              key={stat}
              className="rounded-lg border p-4 text-center"
              style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
            >
              <div
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "Satoshi, sans-serif", color: "#4ade80" }}
              >
                {avg}
              </div>
              <div className="font-mono text-xs uppercase" style={{ color: "#6b7280" }}>
                {stat}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
