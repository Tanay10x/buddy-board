import { SpriteRenderer } from "./SpriteRenderer";
import { StatBar } from "./StatBar";
import { RarityBadge } from "./RarityBadge";
import { STAT_NAMES, RARITY_COLORS } from "@/lib/constants";
import type { Buddy, Rarity } from "@/lib/types";

// Rarity-specific border color + extra CSS classes
function getRarityConfig(rarity: Rarity): {
  borderColor: string;
  extraClasses: string;
} {
  switch (rarity) {
    case "common":
      return {
        borderColor: "#9ca3af",
        extraClasses: "",
      };
    case "uncommon":
      return {
        borderColor: "#22c55e",
        extraClasses: "",
      };
    case "rare":
      return {
        borderColor: "#3b82f6",
        extraClasses: "card-glow-rare",
      };
    case "epic":
      return {
        borderColor: "#a855f7",
        extraClasses: "card-glow-epic",
      };
    case "legendary":
      return {
        borderColor: "#eab308",
        extraClasses: "card-glow-legendary holo-shimmer",
      };
  }
}

export function BuddyCard({ buddy }: { buddy: Buddy }) {
  const { borderColor, extraClasses } = getRarityConfig(buddy.rarity);
  const rarityColor = RARITY_COLORS[buddy.rarity];

  return (
    <div
      className={`scanlines relative rounded-xl border-2 overflow-hidden w-full max-w-sm mx-auto transition-transform duration-300 ease-out hover:-translate-y-1 ${extraClasses}`}
      style={{
        borderColor,
        backgroundColor: "#1a1a1a",
      }}
    >
      {/* All content sits above scanlines (z-10) and holo-shimmer (z-[5]) */}
      <div className="relative z-10 p-5 sm:p-6">
        {/* Header row: rarity badge + species + shiny */}
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <RarityBadge rarity={buddy.rarity} />
          <div className="flex items-center gap-2">
            {buddy.shiny && (
              <span
                className="text-xs font-bold font-mono uppercase tracking-wider"
                style={{ color: "#eab308" }}
              >
                ✨ SHINY
              </span>
            )}
            <span
              className="text-xs font-mono uppercase tracking-wider"
              style={{ color: rarityColor }}
            >
              {buddy.species}
            </span>
          </div>
        </div>

        {/* Sprite + Name / Personality */}
        <div className="flex gap-3 sm:gap-5 mb-4 sm:mb-5">
          <SpriteRenderer
            species={buddy.species}
            eye={buddy.eye}
            hat={buddy.hat}
          />
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="font-display text-lg sm:text-xl font-bold leading-tight truncate" style={{ color: "#e5e7eb" }}>
              {buddy.name}
            </h2>
            <p className="text-xs sm:text-sm italic mt-1 leading-snug" style={{ color: "#9ca3af" }}>
              &quot;{buddy.personality}&quot;
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
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
        <div className="flex items-center justify-between mt-4 sm:mt-5 pt-3 sm:pt-4" style={{ borderTop: "1px solid #1f1f1f" }}>
          <div className="flex items-center gap-2 font-mono text-xs">
            {buddy.github_profile_url ? (
              <a
                href={buddy.github_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#9ca3af" }}
                className="transition-colors duration-150 hover-terminal-color"
              >
                @{buddy.username}
              </a>
            ) : (
              <span style={{ color: "#9ca3af" }}>
                @{buddy.username}
              </span>
            )}
            {buddy.github_verified && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-bold"
                style={{ color: "#E07A5F" }}
                title="GitHub Verified"
              >
                <span>✓</span>
                <span>GitHub</span>
              </span>
            )}
          </div>
          <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
            Hatched {new Date(buddy.hatched_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
