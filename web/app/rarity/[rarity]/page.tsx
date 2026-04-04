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
