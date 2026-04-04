import Link from "next/link";
import { getDexOverview } from "@/lib/queries";
import { SPECIES_LIST, RARITY_COLORS } from "@/lib/constants";
import { renderSprite } from "@/lib/sprites";
import type { Species } from "@/lib/types";

export const revalidate = 60;

const TOTAL_SPECIES = 18;

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function SpeciesCard({
  species,
  count,
}: {
  species: Species;
  count: number;
}) {
  const discovered = count > 0;
  const spriteLines = renderSprite(species, "·", "none");
  const spriteColor = discovered ? "#E07A5F" : "#333333";

  const cardContent = (
    <div
      className="rounded-lg p-4 flex flex-col items-center gap-2 transition-transform duration-150 hover:-translate-y-0.5"
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #2e2e2e",
        cursor: discovered ? "pointer" : "default",
      }}
    >
      {/* ASCII Sprite */}
      <pre
        className="font-mono text-[10px] leading-tight select-none"
        style={{ whiteSpace: "pre", color: spriteColor }}
      >
        {spriteLines.join("\n")}
      </pre>

      {/* Species name */}
      <div
        className="font-display text-sm font-semibold capitalize"
        style={{ color: discovered ? "#e5e7eb" : "#4b5563" }}
      >
        {discovered ? capitalize(species) : "???"}
      </div>

      {/* Count */}
      <div
        className="font-mono text-xs"
        style={{ color: discovered ? "#9ca3af" : "#374151" }}
      >
        {discovered ? (count === 1 ? "1 found" : `${count} found`) : "None found"}
      </div>
    </div>
  );

  if (discovered) {
    return (
      <Link href={`/dex/${species}`} className="block">
        {cardContent}
      </Link>
    );
  }

  return <div>{cardContent}</div>;
}

export default async function DexPage() {
  const { speciesCounts, totalDiscovered, totalBuddies } = await getDexOverview();
  const pct = Math.round((totalDiscovered / TOTAL_SPECIES) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 sm:space-y-10">
      {/* Header */}
      <div className="text-center pt-2 sm:pt-4">
        <h1
          className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-2"
          style={{ color: "#e5e7eb" }}
        >
          BuddyDex
        </h1>
        <p className="font-sans text-sm" style={{ color: "#9ca3af" }}>
          <span style={{ color: "#E07A5F" }}>{totalDiscovered}</span>
          {" / "}
          {TOTAL_SPECIES} species discovered
          {totalBuddies > 0 && (
            <span style={{ color: "#6b7280" }}>
              {" "}
              &bull; {totalBuddies} total {totalBuddies === 1 ? "buddy" : "buddies"}
            </span>
          )}
        </p>
      </div>

      {/* Completion bar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
            Completion
          </span>
          <span className="font-mono text-xs" style={{ color: "#E07A5F" }}>
            {pct}%
          </span>
        </div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: "6px", backgroundColor: "#242424" }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: "#E07A5F",
              borderRadius: "9999px",
              transition: "width 0.4s ease",
            }}
          />
        </div>
      </div>

      {/* Species grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {(SPECIES_LIST as readonly Species[]).map((species) => (
          <SpeciesCard
            key={species}
            species={species}
            count={speciesCounts[species] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
