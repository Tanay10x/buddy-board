import { RARITY_COLORS, RARITY_STARS } from "../lib/constants";
import type { Rarity } from "../lib/types";

export const RarityBadge: React.FC<{ rarity: Rarity }> = ({ rarity }) => {
  const color = RARITY_COLORS[rarity];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 700,
        fontFamily: "'Satoshi', sans-serif",
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color,
      }}
    >
      <span style={{ letterSpacing: "0.05em" }}>{RARITY_STARS[rarity]}</span>
      <span>{rarity}</span>
    </span>
  );
};
