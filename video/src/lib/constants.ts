import type { Rarity, StatName } from "./types";

export const STAT_NAMES: StatName[] = [
  "DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK",
];

export const RARITY_COLORS: Record<Rarity, string> = {
  common: "#9ca3af",
  uncommon: "#22c55e",
  rare: "#3b82f6",
  epic: "#a855f7",
  legendary: "#eab308",
};

export const RARITY_STARS: Record<Rarity, string> = {
  common: "★",
  uncommon: "★★",
  rare: "★★★",
  epic: "★★★★",
  legendary: "★★★★★",
};

// Design system colors
export const COLORS = {
  base: "#0c0c0c",
  surface: "#1a1a1a",
  elevated: "#242424",
  hover: "#2a2a2a",
  border: "#2e2e2e",
  borderSubtle: "#1f1f1f",
  textPrimary: "#e5e7eb",
  textSecondary: "#9ca3af",
  textMuted: "#6b7280",
  terminal: "#4ade80",
  terminalDim: "#22c55e",
};
