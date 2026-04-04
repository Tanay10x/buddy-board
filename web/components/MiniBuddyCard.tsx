import Link from "next/link";
import { SpriteRenderer } from "./SpriteRenderer";
import { RarityBadge } from "./RarityBadge";
import { RARITY_COLORS } from "@/lib/constants";
import type { Buddy } from "@/lib/types";

export function MiniBuddyCard({
  buddy,
  position,
}: {
  buddy: Buddy;
  position?: number;
}) {
  const rarityColor = RARITY_COLORS[buddy.rarity];

  return (
    <Link
      href={`/u/${buddy.username}`}
      className="block rounded-lg transition-colors duration-150"
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #2e2e2e",
      }}
    >
      <div className="flex items-center gap-4 p-4">
        {/* Position number */}
        {position !== undefined && (
          <span
            className="font-mono text-xs w-6 shrink-0 text-right"
            style={{ color: "#6b7280" }}
          >
            {position}
          </span>
        )}

        {/* Sprite — small */}
        <div className="shrink-0 scale-75 origin-center">
          <SpriteRenderer
            species={buddy.species}
            eye={buddy.eye}
            hat={buddy.hat}
          />
        </div>

        {/* Main info */}
        <div className="flex-1 min-w-0">
          <p
            className="font-display font-bold text-sm truncate"
            style={{ color: "#e5e7eb" }}
          >
            Welcome{" "}
            <span style={{ color: rarityColor }}>{buddy.name}</span> the{" "}
            {buddy.species}!
          </p>
          <p className="font-mono text-xs mt-0.5" style={{ color: "#6b7280" }}>
            @{buddy.username}
          </p>
        </div>

        {/* Right: rarity + date */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <RarityBadge rarity={buddy.rarity} />
          <span className="font-mono text-[10px]" style={{ color: "#6b7280" }}>
            {new Date(buddy.created_at).toLocaleDateString()}
          </span>
        </div>
      </div>
    </Link>
  );
}
