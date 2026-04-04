import { supabase } from "./supabase";
import type { Buddy, Org, StatName } from "./types";

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

export async function getRecentBuddies(limit = 30): Promise<Buddy[]> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as Buddy[];
}

export async function getBuddiesByRarity(rarity: string): Promise<Buddy[]> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("*")
    .eq("rarity", rarity)
    .order("total_stats", { ascending: false });

  if (error || !data) return [];
  return data as Buddy[];
}

export async function getTwoBuddies(
  user1: string,
  user2: string,
): Promise<[Buddy | null, Buddy | null]> {
  const [a, b] = await Promise.all([
    getBuddyByUsername(user1),
    getBuddyByUsername(user2),
  ]);
  return [a, b];
}

export async function getOrgs(): Promise<Org[]> {
  const { data, error } = await supabase
    .from("orgs_public")
    .select("*")
    .eq("unlisted", false)
    .order("member_count", { ascending: false });
  if (error || !data) return [];
  return data as Org[];
}

export async function getOrgBySlug(slug: string): Promise<Org | null> {
  const { data, error } = await supabase
    .from("orgs_public")
    .select("*")
    .eq("slug", slug.toLowerCase())
    .single();
  if (error) return null;
  return data as Org;
}

export async function getOrgMembers(orgId: string): Promise<Buddy[]> {
  const { data, error } = await supabase
    .from("org_members")
    .select("*")
    .eq("org_id", orgId)
    .order("total_stats", { ascending: false });
  if (error || !data) return [];
  return data as Buddy[];
}

export async function getBuddyOrgs(username: string): Promise<Array<{ slug: string; display_name: string; org_verified: boolean }>> {
  // First get buddy id
  const buddy = await getBuddyByUsername(username);
  if (!buddy) return [];

  const { data, error } = await supabase
    .from("buddy_orgs")
    .select("org_id, org_verified")
    .eq("buddy_id", buddy.id);
  if (error || !data) return [];

  // Get org details for each
  const orgs = [];
  for (const membership of data) {
    const { data: orgData } = await supabase
      .from("orgs_public")
      .select("slug, display_name")
      .eq("id", membership.org_id)
      .single();
    if (orgData) {
      orgs.push({ ...orgData, org_verified: membership.org_verified });
    }
  }
  return orgs;
}

export async function getAllBuddiesLight(): Promise<
  { username: string; species: string; created_at: string }[]
> {
  const { data, error } = await supabase
    .from("buddies_public")
    .select("username, species, created_at");

  if (error || !data) return [];
  return data;
}

export async function getGlobalStats(): Promise<{
  totalBuddies: number;
  speciesCounts: Record<string, number>;
  rarityCounts: Record<string, number>;
  avgStats: Record<string, number>;
  shinies: number;
  statRanges: Record<string, { min: number; max: number; avg: number }>;
  legendaries: number;
  shinyLegendaries: number;
  mostCommonSpecies: { species: string; count: number } | null;
  topThreeOverall: Buddy[];
  topPerStat: Record<StatName, Buddy | null>;
  rarestFinds: Buddy[];
  combinations: { total: number; discovered: number };
}> {
  const { data, error } = await supabase.from("buddies_public").select("*");
  if (error || !data) {
    return {
      totalBuddies: 0,
      speciesCounts: {},
      rarityCounts: {},
      avgStats: {},
      shinies: 0,
      statRanges: {},
      legendaries: 0,
      shinyLegendaries: 0,
      mostCommonSpecies: null,
      topThreeOverall: [],
      topPerStat: { DEBUGGING: null, PATIENCE: null, CHAOS: null, WISDOM: null, SNARK: null } as Record<StatName, Buddy | null>,
      rarestFinds: [],
      combinations: { total: 1728, discovered: 0 },
    };
  }

  const buddies = data as Buddy[];
  const statNames: StatName[] = ["DEBUGGING", "PATIENCE", "CHAOS", "WISDOM", "SNARK"];

  const speciesCounts: Record<string, number> = {};
  const rarityCounts: Record<string, number> = {};
  const statSums: Record<string, number> = { DEBUGGING: 0, PATIENCE: 0, CHAOS: 0, WISDOM: 0, SNARK: 0 };
  const statMins: Record<string, number> = { DEBUGGING: Infinity, PATIENCE: Infinity, CHAOS: Infinity, WISDOM: Infinity, SNARK: Infinity };
  const statMaxs: Record<string, number> = { DEBUGGING: -Infinity, PATIENCE: -Infinity, CHAOS: -Infinity, WISDOM: -Infinity, SNARK: -Infinity };
  let shinies = 0;
  let legendaries = 0;
  let shinyLegendaries = 0;

  for (const b of buddies) {
    speciesCounts[b.species] = (speciesCounts[b.species] || 0) + 1;
    rarityCounts[b.rarity] = (rarityCounts[b.rarity] || 0) + 1;
    if (b.shiny) shinies++;
    if (b.rarity === "legendary") {
      legendaries++;
      if (b.shiny) shinyLegendaries++;
    }
    for (const stat of statNames) {
      const val = b.stats[stat] ?? 0;
      statSums[stat] += val;
      if (val < statMins[stat]) statMins[stat] = val;
      if (val > statMaxs[stat]) statMaxs[stat] = val;
    }
  }

  const avgStats: Record<string, number> = {};
  const statRanges: Record<string, { min: number; max: number; avg: number }> = {};
  for (const stat of statNames) {
    const avg = buddies.length > 0 ? Math.round(statSums[stat] / buddies.length) : 0;
    avgStats[stat] = avg;
    statRanges[stat] = {
      min: buddies.length > 0 ? statMins[stat] : 0,
      max: buddies.length > 0 ? statMaxs[stat] : 0,
      avg,
    };
  }

  // Most common species
  let mostCommonSpecies: { species: string; count: number } | null = null;
  for (const [species, count] of Object.entries(speciesCounts)) {
    if (!mostCommonSpecies || count > mostCommonSpecies.count) {
      mostCommonSpecies = { species, count };
    }
  }

  // Top 3 overall by total_stats
  const topThreeOverall = [...buddies]
    .sort((a, b) => b.total_stats - a.total_stats)
    .slice(0, 3);

  // Top buddy per stat
  const topPerStat = {} as Record<StatName, Buddy | null>;
  for (const stat of statNames) {
    const top = buddies.reduce<Buddy | null>((best, b) => {
      if (!best) return b;
      return (b.stats[stat] ?? 0) > (best.stats[stat] ?? 0) ? b : best;
    }, null);
    topPerStat[stat] = top;
  }

  // Rarest finds: shinies + legendaries (max 10)
  const rarestFinds = buddies
    .filter((b) => b.shiny || b.rarity === "legendary")
    .sort((a, b) => b.total_stats - a.total_stats)
    .slice(0, 10);

  // Unique combos: species (18) × eye (6) × hat (8) × shiny (2) = 1728
  const TOTAL_COMBOS = 1728;
  const comboSet = new Set<string>();
  for (const b of buddies) {
    comboSet.add(`${b.species}|${b.eye}|${b.hat}|${b.shiny ? "1" : "0"}`);
  }

  return {
    totalBuddies: buddies.length,
    speciesCounts,
    rarityCounts,
    avgStats,
    shinies,
    statRanges,
    legendaries,
    shinyLegendaries,
    mostCommonSpecies,
    topThreeOverall,
    topPerStat,
    rarestFinds,
    combinations: { total: TOTAL_COMBOS, discovered: comboSet.size },
  };
}
