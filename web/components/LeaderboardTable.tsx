"use client";

import { useState } from "react";
import { LeaderboardRow } from "./LeaderboardRow";
import { SPECIES_LIST } from "@/lib/constants";
import type { Buddy, StatName } from "@/lib/types";

type SortField = "total_stats" | StatName | "rarity" | "hatched_at";

const RARITY_ORDER: Record<string, number> = {
  legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1,
};

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "total_stats", label: "Total Stats" },
  { value: "DEBUGGING", label: "Debugging" },
  { value: "PATIENCE", label: "Patience" },
  { value: "CHAOS", label: "Chaos" },
  { value: "WISDOM", label: "Wisdom" },
  { value: "SNARK", label: "Snark" },
  { value: "rarity", label: "Rarity" },
  { value: "hatched_at", label: "Oldest" },
];

function sortBuddies(buddies: Buddy[], sortBy: SortField): Buddy[] {
  const sorted = [...buddies];
  switch (sortBy) {
    case "total_stats":
      return sorted.sort((a, b) => b.total_stats - a.total_stats);
    case "rarity":
      return sorted.sort((a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0));
    case "hatched_at":
      return sorted.sort((a, b) => a.hatched_at - b.hatched_at);
    default:
      return sorted.sort((a, b) => (b.stats[sortBy] ?? 0) - (a.stats[sortBy] ?? 0));
  }
}

export function LeaderboardTable({ buddies }: { buddies: Buddy[] }) {
  const [sortBy, setSortBy] = useState<SortField>("total_stats");
  const [filterSpecies, setFilterSpecies] = useState("");
  const [filterRarity, setFilterRarity] = useState("");

  let filtered = buddies;
  if (filterSpecies) filtered = filtered.filter((b) => b.species === filterSpecies);
  if (filterRarity) filtered = filtered.filter((b) => b.rarity === filterRarity);
  const sorted = sortBuddies(filtered, sortBy);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortField)}
          className="bg-gray-800 text-gray-300 border border-gray-700 rounded px-3 py-1.5 text-sm font-mono"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          className="bg-gray-800 text-gray-300 border border-gray-700 rounded px-3 py-1.5 text-sm font-mono"
        >
          <option value="">All Species</option>
          {SPECIES_LIST.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value)}
          className="bg-gray-800 text-gray-300 border border-gray-700 rounded px-3 py-1.5 text-sm font-mono"
        >
          <option value="">All Rarities</option>
          {["legendary", "epic", "rare", "uncommon", "common"].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-700 text-gray-500 text-xs font-mono uppercase">
              <th className="py-2 px-4 w-12">#</th>
              <th className="py-2 px-4">User</th>
              <th className="py-2 px-4">Buddy</th>
              <th className="py-2 px-4">Species</th>
              <th className="py-2 px-4">Rarity</th>
              <th className="py-2 px-4 text-right">Total</th>
              <th className="py-2 px-4 hidden md:table-cell">DBG</th>
              <th className="py-2 px-4 hidden md:table-cell">PAT</th>
              <th className="py-2 px-4 hidden md:table-cell">CHS</th>
              <th className="py-2 px-4 hidden md:table-cell">WIS</th>
              <th className="py-2 px-4 hidden md:table-cell">SNK</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((buddy, i) => (
              <LeaderboardRow key={buddy.id} buddy={buddy} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <p className="text-gray-500 text-center py-8 font-mono">
          No buddies found. Be the first!
        </p>
      )}
    </div>
  );
}
