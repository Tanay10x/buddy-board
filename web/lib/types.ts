export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type Species =
  | "duck" | "goose" | "blob" | "cat" | "dragon" | "octopus" | "owl"
  | "penguin" | "turtle" | "snail" | "ghost" | "axolotl" | "capybara"
  | "cactus" | "robot" | "rabbit" | "mushroom" | "chonk";

export type Eye = "·" | "✦" | "×" | "◉" | "@" | "°";

export type Hat = "none" | "crown" | "tophat" | "propeller" | "halo" | "wizard" | "beanie" | "tinyduck";

export type StatName = "DEBUGGING" | "PATIENCE" | "CHAOS" | "WISDOM" | "SNARK";

export type Buddy = {
  id: string;
  username: string;
  github_username: string | null;
  github_verified: boolean;
  github_avatar_url: string | null;
  github_bio: string | null;
  github_profile_url: string | null;
  name: string;
  personality: string;
  hatched_at: number;
  species: Species;
  rarity: Rarity;
  eye: Eye;
  hat: Hat;
  shiny: boolean;
  stats: Record<StatName, number>;
  total_stats: number;
  created_at: string;
  updated_at: string;
};
