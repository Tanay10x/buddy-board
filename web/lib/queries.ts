import { supabase } from "./supabase";
import type { Buddy, StatName } from "./types";

type SortField = "total_stats" | StatName | "rarity" | "hatched_at";

const RARITY_ORDER = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };

export async function getLeaderboard(
  sortBy: SortField = "total_stats",
  filterSpecies?: string,
  filterRarity?: string,
): Promise<Buddy[]> {
  let query = supabase
    .from("buddies_public")
    .select("*")
    .order(sortBy === "rarity" ? "total_stats" : sortBy === "hatched_at" ? "hatched_at" : "total_stats", {
      ascending: sortBy === "hatched_at",
    })
    .limit(100);

  if (filterSpecies) {
    query = query.eq("species", filterSpecies);
  }
  if (filterRarity) {
    query = query.eq("rarity", filterRarity);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  let buddies = data as Buddy[];

  // Sort by individual stat if needed
  if (["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"].includes(sortBy)) {
    buddies.sort((a, b) => (b.stats[sortBy as StatName] ?? 0) - (a.stats[sortBy as StatName] ?? 0));
  }

  // Sort by rarity tier
  if (sortBy === "rarity") {
    buddies.sort(
      (a, b) =>
        (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0),
    );
  }

  return buddies;
}

export async function getBuddyByUsername(username: string): Promise<Buddy | null> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("*")
    .eq("username", username.toLowerCase())
    .single();

  if (error) return null;
  return data as Buddy;
}

export async function getBuddyRank(username: string): Promise<{
  overall: number;
  perStat: Record<StatName, number>;
  total: number;
}> {
  const { data: all, error } = await supabase
    .from("buddies_public")
    .select("username, stats, total_stats");

  if (error || !all) return { overall: 0, perStat: {} as Record<StatName, number>, total: 0 };

  const sorted = [...all].sort((a: any, b: any) => b.total_stats - a.total_stats);
  const overall = sorted.findIndex((b: any) => b.username === username) + 1;

  const statNames: StatName[] = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];
  const perStat = {} as Record<StatName, number>;
  for (const stat of statNames) {
    const byStat = [...all].sort((a: any, b: any) => (b.stats[stat] ?? 0) - (a.stats[stat] ?? 0));
    perStat[stat] = byStat.findIndex((b: any) => b.username === username) + 1;
  }

  return { overall, perStat, total: all.length };
}

export async function getDexOverview(): Promise<{
  speciesCounts: Record<string, number>;
  totalDiscovered: number;
  totalBuddies: number;
}> {
  const { data, error } = await supabase.from("buddies_public").select("species");
  if (error || !data) return { speciesCounts: {}, totalDiscovered: 0, totalBuddies: 0 };

  const speciesCounts: Record<string, number> = {};
  for (const row of data as { species: string }[]) {
    speciesCounts[row.species] = (speciesCounts[row.species] || 0) + 1;
  }

  const totalDiscovered = Object.values(speciesCounts).filter((c) => c > 0).length;
  return { speciesCounts, totalDiscovered, totalBuddies: data.length };
}

export async function getSpeciesBuddies(species: string): Promise<Buddy[]> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("*")
    .eq("species", species)
    .order("total_stats", { ascending: false });

  if (error || !data) return [];
  return data as Buddy[];
}

export async function getGlobalStats(): Promise<{
  totalBuddies: number;
  speciesCounts: Record<string, number>;
  rarityCounts: Record<string, number>;
  avgStats: Record<string, number>;
  shinies: number;
}> {
  const { data, error } = await supabase.from("buddies_public").select("*");
  if (error || !data) {
    return { totalBuddies: 0, speciesCounts: {}, rarityCounts: {}, avgStats: {}, shinies: 0 };
  }

  const buddies = data as Buddy[];
  const speciesCounts: Record<string, number> = {};
  const rarityCounts: Record<string, number> = {};
  const statSums: Record<string, number> = { DEBUGGING: 0, PATIENCE: 0, CHAOS: 0, WISDOM: 0, SNARK: 0 };
  let shinies = 0;

  for (const b of buddies) {
    speciesCounts[b.species] = (speciesCounts[b.species] || 0) + 1;
    rarityCounts[b.rarity] = (rarityCounts[b.rarity] || 0) + 1;
    if (b.shiny) shinies++;
    for (const stat of Object.keys(statSums)) {
      statSums[stat] += b.stats[stat as StatName] ?? 0;
    }
  }

  const avgStats: Record<string, number> = {};
  for (const stat of Object.keys(statSums)) {
    avgStats[stat] = buddies.length > 0 ? Math.round(statSums[stat] / buddies.length) : 0;
  }

  return {
    totalBuddies: buddies.length,
    speciesCounts,
    rarityCounts,
    avgStats,
    shinies,
  };
}
