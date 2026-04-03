import { getGlobalStats } from "@/lib/queries";
import { RARITY_COLORS } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

export const revalidate = 300;

function BarChart({ data, colorFn }: { data: Record<string, number>; colorFn?: (key: string) => string }) {
  const max = Math.max(...Object.values(data), 1);
  const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-2">
      {sorted.map(([key, count]) => (
        <div key={key} className="flex items-center gap-3 font-mono text-sm">
          <span className="w-24 text-gray-400 capitalize">{key}</span>
          <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: colorFn?.(key) ?? "#4ade80",
              }}
            />
          </div>
          <span className="w-8 text-right text-gray-500">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default async function StatsPage() {
  const stats = await getGlobalStats();

  return (
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Global Stats</h1>
        <p className="text-gray-400">
          {stats.totalBuddies} buddies registered {stats.shinies > 0 ? `• ${stats.shinies} shiny` : ""}
        </p>
      </div>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Species Distribution</h2>
        <BarChart data={stats.speciesCounts} />
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Rarity Distribution</h2>
        <BarChart
          data={stats.rarityCounts}
          colorFn={(key) => RARITY_COLORS[key as Rarity] ?? "#9ca3af"}
        />
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Average Stats</h2>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(stats.avgStats).map(([stat, avg]) => (
            <div key={stat} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-white">{avg}</div>
              <div className="text-gray-500 text-xs mt-1">{stat}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
