import { RARITY_COLORS } from "@/lib/constants";
import type { Rarity } from "@/lib/types";

export function StatBar({
  label,
  value,
  rarity,
}: {
  label: string;
  value: number;
  rarity: Rarity;
}) {
  const filled = Math.round(value / 10);
  const empty = 10 - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  return (
    <div className="flex items-center gap-2 font-mono text-sm">
      <span className="w-24 text-gray-400">{label}</span>
      <span style={{ color: RARITY_COLORS[rarity] }}>{bar}</span>
      <span className="w-8 text-right text-white">{value}</span>
    </div>
  );
}
