import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpeciesBuddies } from "@/lib/queries";
import { SPECIES_LIST, RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import { renderSprite } from "@/lib/sprites";
import type { Species, Rarity, Eye } from "@/lib/types";

export const revalidate = 300;

const TOTAL_SPECIES = 18;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const EYE_VARIANTS: Eye[] = ["·", "✦", "×"];

export default async function SpeciesDetailPage({
  params,
}: {
  params: Promise<{ species: string }>;
}) {
  const { species: speciesParam } = await params;

  if (!(SPECIES_LIST as readonly string[]).includes(speciesParam)) {
    notFound();
  }

  const species = speciesParam as Species;
  const buddies = await getSpeciesBuddies(species);
  const total = buddies.length;

  // Rarity breakdown
  const rarityCounts: Record<string, number> = {};
  for (const b of buddies) {
    rarityCounts[b.rarity] = (rarityCounts[b.rarity] || 0) + 1;
  }

  // First discovered (earliest created_at)
  const firstDiscovered =
    total > 0
      ? buddies.reduce((earliest, b) =>
          b.created_at < earliest.created_at ? b : earliest
        )
      : null;

  // Dominant rarity for accent color
  const rarityOrder: Rarity[] = ["legendary", "epic", "rare", "uncommon", "common"];
  const dominantRarity = rarityOrder.find((r) => rarityCounts[r] && rarityCounts[r] > 0) ?? "common";
  const accentColor = RARITY_COLORS[dominantRarity];

  return (
    <div className="max-w-3xl mx-auto space-y-8 sm:space-y-10">
      {/* Back link */}
      <Link
        href="/dex"
        className="inline-flex items-center gap-1.5 font-mono text-xs transition-colors"
        style={{ color: "#6b7280" }}
        onMouseEnter={undefined}
      >
        ← BuddyDex
      </Link>

      {/* Header */}
      <div className="text-center pt-2">
        <div
          className="font-mono text-xs mb-2 uppercase tracking-widest"
          style={{ color: accentColor }}
        >
          {RARITY_STARS[dominantRarity]} {dominantRarity}
        </div>
        <h1
          className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-2"
          style={{ color: "#e5e7eb" }}
        >
          {capitalize(species)}
        </h1>
        <p className="font-sans text-sm" style={{ color: "#9ca3af" }}>
          {total === 0
            ? "No buddies discovered yet"
            : `${total} ${total === 1 ? "buddy" : "buddies"} discovered`}
        </p>
      </div>

      {/* Three eye variants side by side */}
      <div
        className="rounded-lg p-5 sm:p-6 flex justify-center gap-6 sm:gap-10"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
      >
        {EYE_VARIANTS.map((eye) => (
          <div key={eye} className="flex flex-col items-center gap-2">
            <pre
              className="font-mono text-[10px] sm:text-xs leading-tight select-none"
              style={{ whiteSpace: "pre", color: "#4ade80" }}
            >
              {renderSprite(species, eye, "none").join("\n")}
            </pre>
            <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
              {eye}
            </span>
          </div>
        ))}
      </div>

      {/* Stats box */}
      {total > 0 && (
        <div
          className="rounded-lg p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 gap-3"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="text-center">
            <div
              className="font-display text-2xl font-bold"
              style={{ color: "#4ade80" }}
            >
              {total}
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: "#6b7280" }}>
              total
            </div>
          </div>

          {(["common", "uncommon", "rare", "epic", "legendary"] as Rarity[])
            .filter((r) => rarityCounts[r])
            .map((r) => (
              <div key={r} className="text-center">
                <div
                  className="font-display text-2xl font-bold"
                  style={{ color: RARITY_COLORS[r] }}
                >
                  {rarityCounts[r]}
                </div>
                <div className="font-mono text-xs mt-0.5 capitalize" style={{ color: "#6b7280" }}>
                  {r}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* First discovered */}
      {firstDiscovered && (
        <div>
          <h2
            className="font-display text-base font-semibold mb-3"
            style={{ color: "#e5e7eb" }}
          >
            First Discovered
          </h2>
          <div
            className="rounded-lg p-4 flex items-center justify-between"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold"
                style={{ backgroundColor: "#242424", border: "1px solid #2e2e2e", color: "#9ca3af" }}
              >
                {firstDiscovered.username[0].toUpperCase()}
              </div>
              <div>
                <Link
                  href={`/u/${firstDiscovered.username}`}
                  className="font-mono text-sm"
                  style={{ color: "#4ade80" }}
                >
                  {firstDiscovered.username}
                </Link>
                <div className="font-sans text-xs mt-0.5" style={{ color: "#6b7280" }}>
                  {firstDiscovered.name}
                </div>
              </div>
            </div>
            <div className="font-mono text-xs text-right" style={{ color: "#6b7280" }}>
              {new Date(firstDiscovered.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
      )}

      {/* Known Specimens */}
      {total > 0 && (
        <div>
          <h2
            className="font-display text-base font-semibold mb-3"
            style={{ color: "#e5e7eb" }}
          >
            Known Specimens
          </h2>
          <div
            className="rounded-lg overflow-hidden"
            style={{ border: "1px solid #2e2e2e" }}
          >
            {buddies.map((buddy, i) => (
              <div
                key={buddy.id}
                className="flex items-center justify-between px-4 py-3 transition-colors"
                style={{
                  backgroundColor: "#1a1a1a",
                  borderBottom: i < buddies.length - 1 ? "1px solid #222" : "none",
                }}
              >
                {/* Left: rank + user */}
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="font-mono text-xs w-5 text-right shrink-0"
                    style={{ color: "#4b5563" }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold"
                    style={{ backgroundColor: "#242424", border: "1px solid #2e2e2e", color: "#9ca3af" }}
                  >
                    {buddy.username[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/u/${buddy.username}`}
                      className="font-mono text-xs sm:text-sm truncate block"
                      style={{ color: "#e5e7eb" }}
                    >
                      {buddy.username}
                    </Link>
                    <span className="font-sans text-xs" style={{ color: "#6b7280" }}>
                      {buddy.name}
                    </span>
                  </div>
                </div>

                {/* Right: rarity + total stats */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className="font-mono text-xs"
                    style={{ color: RARITY_COLORS[buddy.rarity] }}
                    title={buddy.rarity}
                  >
                    {RARITY_STARS[buddy.rarity]}
                  </span>
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: "#e5e7eb" }}
                  >
                    {buddy.total_stats}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {total === 0 && (
        <div
          className="rounded-lg p-8 text-center"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <pre
            className="font-mono text-[10px] leading-tight select-none mx-auto inline-block mb-4"
            style={{ whiteSpace: "pre", color: "#333" }}
          >
            {renderSprite(species, "·", "none").join("\n")}
          </pre>
          <p className="font-sans text-sm" style={{ color: "#4b5563" }}>
            No {capitalize(species)} buddies discovered yet.
          </p>
          <p className="font-sans text-xs mt-1" style={{ color: "#374151" }}>
            Be the first!
          </p>
        </div>
      )}
    </div>
  );
}
