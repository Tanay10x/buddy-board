import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  return (
    <span
      className="font-mono text-sm font-bold uppercase"
      style={{ color: RARITY_COLORS[rarity] }}
    >
      {RARITY_STARS[rarity]} {rarity}
    </span>
  );
}
