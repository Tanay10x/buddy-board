import { SpriteRenderer } from "./SpriteRenderer";
import { StatBar } from "./StatBar";
import { RarityBadge } from "./RarityBadge";
import { STAT_NAMES, RARITY_COLORS } from "@/lib/constants";
import type { Buddy } from "@/lib/types";

export function BuddyCard({ buddy }: { buddy: Buddy }) {
  const borderColor = RARITY_COLORS[buddy.rarity];

  return (
    <div
      className="relative rounded-lg border-2 bg-gray-950 p-6 font-mono max-w-lg"
      style={{ borderColor }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <RarityBadge rarity={buddy.rarity} />
        <span className="text-gray-400 text-sm uppercase">
          {buddy.species}
          {buddy.shiny && <span className="ml-2 text-yellow-300">✨ SHINY</span>}
        </span>
      </div>

      {/* Sprite + Info */}
      <div className="flex gap-6 mb-4">
        <SpriteRenderer species={buddy.species} eye={buddy.eye} hat={buddy.hat} />
        <div className="flex flex-col justify-center">
          <h2 className="text-xl font-bold text-white">{buddy.name}</h2>
          <p className="text-gray-400 text-sm italic mt-1 leading-snug max-w-64">
            &quot;{buddy.personality}&quot;
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-1">
        {STAT_NAMES.map((stat) => (
          <StatBar
            key={stat}
            label={stat}
            value={buddy.stats[stat]}
            rarity={buddy.rarity}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800 text-sm">
        <span className="text-gray-400">
          @{buddy.username}
          {buddy.github_verified && (
            <span className="ml-2 text-green-400">✓ GitHub</span>
          )}
        </span>
        <span className="text-gray-500">
          Hatched {new Date(buddy.hatched_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
