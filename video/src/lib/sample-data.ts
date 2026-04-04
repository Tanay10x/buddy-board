import type { Buddy } from "./types";

// --- Sample buddies ---

export const LEGENDARY_BUDDY: Buddy = {
  id: "1",
  username: "tanay",
  github_verified: true,
  name: "Zephyr",
  personality: "Mass-produces chaos, calls it innovation",
  hatched_at: Date.now(),
  species: "dragon",
  rarity: "legendary",
  eye: "✦",
  hat: "crown",
  shiny: true,
  stats: { DEBUGGING: 92, PATIENCE: 45, CHAOS: 99, WISDOM: 87, SNARK: 78 },
  total_stats: 401,
};

export const EPIC_BUDDY: Buddy = {
  id: "2",
  username: "devfriend",
  github_verified: true,
  name: "Nimbus",
  personality: "Silently judges your variable names",
  hatched_at: Date.now(),
  species: "owl",
  rarity: "epic",
  eye: "◉",
  hat: "wizard",
  shiny: false,
  stats: { DEBUGGING: 88, PATIENCE: 76, CHAOS: 34, WISDOM: 95, SNARK: 62 },
  total_stats: 355,
};

export const RARE_BUDDY: Buddy = {
  id: "3",
  username: "codebuddy",
  github_verified: false,
  name: "Pip",
  personality: "Refactors your code while you sleep",
  hatched_at: Date.now(),
  species: "cat",
  rarity: "rare",
  eye: "·",
  hat: "beanie",
  shiny: false,
  stats: { DEBUGGING: 72, PATIENCE: 85, CHAOS: 55, WISDOM: 68, SNARK: 90 },
  total_stats: 370,
};

export const COMMON_BUDDY: Buddy = {
  id: "4",
  username: "newdev",
  github_verified: false,
  name: "Quackers",
  personality: "Just happy to be here",
  hatched_at: Date.now(),
  species: "duck",
  rarity: "common",
  eye: "·",
  hat: "none",
  shiny: false,
  stats: { DEBUGGING: 42, PATIENCE: 58, CHAOS: 30, WISDOM: 45, SNARK: 35 },
  total_stats: 210,
};

export const SHOWCASE_BUDDIES: Buddy[] = [
  LEGENDARY_BUDDY,
  EPIC_BUDDY,
  RARE_BUDDY,
  {
    id: "5",
    username: "ghosthacker",
    github_verified: true,
    name: "Boo",
    personality: "404: Patience not found",
    hatched_at: Date.now(),
    species: "ghost",
    rarity: "uncommon",
    eye: "×",
    hat: "halo",
    shiny: false,
    stats: { DEBUGGING: 60, PATIENCE: 20, CHAOS: 80, WISDOM: 55, SNARK: 95 },
    total_stats: 310,
  },
  COMMON_BUDDY,
];

export const LEADERBOARD_DATA = SHOWCASE_BUDDIES.map((buddy, i) => ({
  ...buddy,
  rank: i + 1,
}));

// --- Sample orgs ---

export type SampleOrg = {
  slug: string;
  display_name: string;
  description: string;
  member_count: number;
  verified_member_count: number;
  combined_power: number;
  top_species: string;
  legendary_count: number;
};

export const SAMPLE_ORGS: SampleOrg[] = [
  {
    slug: "anthropic",
    display_name: "Anthropic",
    description: "Building reliable, interpretable AI systems",
    member_count: 48,
    verified_member_count: 45,
    combined_power: 14200,
    top_species: "dragon",
    legendary_count: 5,
  },
  {
    slug: "vercel",
    display_name: "Vercel",
    description: "Develop. Preview. Ship.",
    member_count: 36,
    verified_member_count: 34,
    combined_power: 11800,
    top_species: "robot",
    legendary_count: 3,
  },
  {
    slug: "supabase",
    display_name: "Supabase",
    description: "The open source Firebase alternative",
    member_count: 28,
    verified_member_count: 26,
    combined_power: 9400,
    top_species: "cat",
    legendary_count: 2,
  },
  {
    slug: "linear",
    display_name: "Linear",
    description: "The issue tracking tool you'll enjoy using",
    member_count: 22,
    verified_member_count: 20,
    combined_power: 7600,
    top_species: "owl",
    legendary_count: 1,
  },
];

export const ORG_COMPARE = {
  left: SAMPLE_ORGS[0],  // Anthropic
  right: SAMPLE_ORGS[1], // Vercel
};
