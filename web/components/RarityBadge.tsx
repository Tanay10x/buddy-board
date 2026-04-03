import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

export function RarityBadge({ rarity }: { rarity: Rarity }) {
  const color = RARITY_COLORS[rarity];

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-bold font-display uppercase"
      style={{
        color,
        letterSpacing: "0.12em",
      }}
    >
      <span style={{ letterSpacing: "0.05em" }}>{RARITY_STARS[rarity]}</span>
      <span>{rarity}</span>
    </span>
  );
}
