"use client";

import Link from "next/link";
import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import type { Buddy } from "@/lib/types";

export function LeaderboardRow({ buddy, rank }: { buddy: Buddy; rank: number }) {
  const rarityColor = RARITY_COLORS[buddy.rarity];

  return (
    <tr
      className="border-b border-border-subtle transition-colors duration-150 hover:bg-hover"
    >
      {/* Rank */}
      <td className="py-3 px-2 sm:px-4 w-10 sm:w-12 text-right font-mono text-xs text-text-muted">
        {rank}
      </td>

      {/* User cell: avatar circle + username + badges */}
      <td className="py-3 px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Avatar circle */}
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono border bg-elevated border-border text-text-secondary">
            {buddy.username[0].toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/u/${buddy.username}`}
              className="font-mono text-xs sm:text-sm truncate text-text-primary hover:text-terminal transition-colors duration-150"
            >
              {buddy.username}
            </Link>
            {buddy.github_verified && (
              <span
                className="text-xs font-bold shrink-0 text-terminal"
                title="GitHub Verified"
              >
                ✓
              </span>
            )}
            {buddy.shiny && (
              <span className="text-xs shrink-0" title="Shiny">
                ✨
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Buddy name — hidden on small mobile */}
      <td className="py-3 px-2 sm:px-4 font-mono text-sm text-text-secondary hidden sm:table-cell">
        {buddy.name}
      </td>

      {/* Species colored by rarity — hidden on small mobile */}
      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
        <span
          className="font-mono text-sm capitalize"
          style={{ color: rarityColor }}
        >
          {buddy.species}
        </span>
      </td>

      {/* Rarity stars colored by rarity */}
      <td className="py-3 px-2 sm:px-4">
        <span
          className="font-mono text-xs"
          style={{ color: rarityColor }}
          title={buddy.rarity}
        >
          {RARITY_STARS[buddy.rarity]}
        </span>
      </td>

      {/* Total stat bold mono */}
      <td className="py-3 px-2 sm:px-4 text-right font-mono text-sm font-bold text-text-primary">
        {buddy.total_stats}
      </td>

      {/* Individual stats — hidden below lg */}
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell text-text-muted">
        {buddy.stats.DEBUGGING}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell text-text-muted">
        {buddy.stats.PATIENCE}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell text-text-muted">
        {buddy.stats.CHAOS}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell text-text-muted">
        {buddy.stats.WISDOM}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell text-text-muted">
        {buddy.stats.SNARK}
      </td>
    </tr>
  );
}
