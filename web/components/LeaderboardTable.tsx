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
      return sorted.sort(
        (a, b) => (RARITY_ORDER[b.rarity] ?? 0) - (RARITY_ORDER[a.rarity] ?? 0)
      );
    case "hatched_at":
      return sorted.sort((a, b) => a.hatched_at - b.hatched_at);
    default:
      return sorted.sort((a, b) => (b.stats[sortBy] ?? 0) - (a.stats[sortBy] ?? 0));
  }
}

const selectClasses =
  "rounded-md px-3 py-1.5 text-xs font-mono outline-none cursor-pointer appearance-none";

interface LeaderboardTableProps {
  buddies: Buddy[];
  orgSlugs?: string[];
  orgMembers?: Record<string, string[]>;
}

export function LeaderboardTable({ buddies, orgSlugs = [], orgMembers = {} }: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<SortField>("total_stats");
  const [filterSpecies, setFilterSpecies] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
  const [filterOrg, setFilterOrg] = useState("");
  const [search, setSearch] = useState("");

  let filtered = buddies;
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    filtered = filtered.filter(
      (b) =>
        b.username.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q)
    );
  }
  if (filterSpecies) filtered = filtered.filter((b) => b.species === filterSpecies);
  if (filterRarity) filtered = filtered.filter((b) => b.rarity === filterRarity);
  if (filterOrg) {
    const members = orgMembers[filterOrg] ?? [];
    filtered = filtered.filter((b) => members.includes(b.username));
  }
  const sorted = sortBuddies(filtered, sortBy);

  return (
    <div>
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search username or buddy..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${selectClasses} w-full sm:w-auto sm:min-w-[200px]`}
          style={{ backgroundColor: "#242424", color: "#e5e7eb", border: "1px solid #2e2e2e" }}
        />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortField)}
          className={selectClasses}
          style={{ backgroundColor: "#242424", color: "#9ca3af", border: "1px solid #2e2e2e" }}
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        {/* Species filter */}
        <select
          value={filterSpecies}
          onChange={(e) => setFilterSpecies(e.target.value)}
          className={selectClasses}
          style={{ backgroundColor: "#242424", color: "#9ca3af", border: "1px solid #2e2e2e" }}
        >
          <option value="">All Species</option>
          {SPECIES_LIST.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Rarity filter */}
        <select
          value={filterRarity}
          onChange={(e) => setFilterRarity(e.target.value)}
          className={selectClasses}
          style={{ backgroundColor: "#242424", color: "#9ca3af", border: "1px solid #2e2e2e" }}
        >
          <option value="">All Rarities</option>
          {["legendary", "epic", "rare", "uncommon", "common"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        {/* Org filter */}
        {orgSlugs.length > 0 && (
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            className={selectClasses}
            style={{ backgroundColor: "#242424", color: "#9ca3af", border: "1px solid #2e2e2e" }}
          >
            <option value="">All Orgs</option>
            {orgSlugs.map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid #2e2e2e" }}>
        <table className="leaderboard-table min-w-full text-left">
          <thead>
            <tr style={{ borderBottom: "1px solid #2e2e2e" }}>
              {[
                { label: "#", cls: "w-10 sm:w-12 text-right" },
                { label: "User", cls: "" },
                { label: "Buddy", cls: "hidden sm:table-cell" },
                { label: "Species", cls: "hidden sm:table-cell" },
                { label: "Rarity", cls: "" },
                { label: "Total", cls: "text-right" },
                { label: "DBG", cls: "text-right hidden lg:table-cell" },
                { label: "PAT", cls: "text-right hidden lg:table-cell" },
                { label: "CHS", cls: "text-right hidden lg:table-cell" },
                { label: "WIS", cls: "text-right hidden lg:table-cell" },
                { label: "SNK", cls: "text-right hidden lg:table-cell" },
              ].map(({ label, cls }) => (
                <th
                  key={label}
                  className={`py-2.5 px-2 sm:px-4 font-mono text-xs font-semibold uppercase tracking-widest ${cls}`}
                  style={{ color: "#6b7280" }}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((buddy, i) => (
              <LeaderboardRow key={buddy.id} buddy={buddy} rank={i + 1} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="py-16 text-center">
          <p className="font-mono text-sm" style={{ color: "#6b7280" }}>
            No buddies found. Be the first!
          </p>
        </div>
      )}
    </div>
  );
}
