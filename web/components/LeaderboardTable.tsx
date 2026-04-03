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

const selectStyle: React.CSSProperties = {
  background: "var(--color-elevated)",
  color: "var(--color-text-secondary)",
  border: "1px solid var(--color-border)",
  borderRadius: "var(--radius-md)",
  padding: "6px 12px",
  fontSize: "12px",
  fontFamily: "var(--font-mono), ui-monospace, monospace",
  outline: "none",
  cursor: "pointer",
};

export function LeaderboardTable({ buddies }: { buddies: Buddy[] }) {
  const [sortBy, setSortBy] = useState<SortField>("total_stats");
  const [filterSpecies, setFilterSpecies] = useState("");
  const [filterRarity, setFilterRarity] = useState("");
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
  const sorted = sortBuddies(filtered, sortBy);

  return (
    <div>
      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search username or buddy…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            ...selectStyle,
            padding: "6px 12px",
            minWidth: "200px",
            color: "var(--color-text-primary)",
          }}
        />

        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortField)}
          style={selectStyle}
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
          style={selectStyle}
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
          style={selectStyle}
        >
          <option value="">All Rarities</option>
          {["legendary", "epic", "rare", "uncommon", "common"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg" style={{ border: "1px solid var(--color-border)" }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
              {[
                { label: "#", cls: "w-12 text-right" },
                { label: "User", cls: "" },
                { label: "Buddy", cls: "" },
                { label: "Species", cls: "" },
                { label: "Rarity", cls: "" },
                { label: "Total", cls: "text-right" },
                { label: "DBG", cls: "text-right hidden md:table-cell" },
                { label: "PAT", cls: "text-right hidden md:table-cell" },
                { label: "CHS", cls: "text-right hidden md:table-cell" },
                { label: "WIS", cls: "text-right hidden md:table-cell" },
                { label: "SNK", cls: "text-right hidden md:table-cell" },
              ].map(({ label, cls }) => (
                <th
                  key={label}
                  className={`py-2.5 px-4 font-mono text-xs font-semibold uppercase tracking-widest ${cls}`}
                  style={{ color: "var(--color-text-muted)" }}
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
          <p
            className="font-mono text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            No buddies found. Be the first!
          </p>
        </div>
      )}
    </div>
  );
}
