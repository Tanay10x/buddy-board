import Link from "next/link";
import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import type { Buddy } from "@/lib/types";

export function LeaderboardRow({ buddy, rank }: { buddy: Buddy; rank: number }) {
  const rarityColor = RARITY_COLORS[buddy.rarity];

  return (
    <tr
      className="transition-colors duration-150"
      style={{
        borderBottom: "1px solid var(--color-border-subtle)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background =
          "var(--color-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLTableRowElement).style.background = "";
      }}
    >
      {/* Rank */}
      <td
        className="py-3 px-4 w-12 text-right font-mono text-xs"
        style={{ color: "var(--color-text-muted)" }}
      >
        {rank}
      </td>

      {/* User cell: avatar circle + username + badges */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-2.5">
          {/* Avatar circle */}
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono border"
            style={{
              background: "var(--color-elevated)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-secondary)",
            }}
          >
            {buddy.username[0].toUpperCase()}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/u/${buddy.username}`}
              className="font-mono text-sm truncate transition-colors duration-150"
              style={{ color: "var(--color-text-primary)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = "#4ade80";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color =
                  "var(--color-text-primary)";
              }}
            >
              {buddy.username}
            </Link>
            {buddy.github_verified && (
              <span
                className="text-xs font-bold shrink-0"
                title="GitHub Verified"
                style={{ color: "#4ade80" }}
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

      {/* Buddy name */}
      <td
        className="py-3 px-4 font-mono text-sm"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {buddy.name}
      </td>

      {/* Species colored by rarity */}
      <td className="py-3 px-4">
        <span
          className="font-mono text-sm capitalize"
          style={{ color: rarityColor }}
        >
          {buddy.species}
        </span>
      </td>

      {/* Rarity stars colored by rarity */}
      <td className="py-3 px-4">
        <span
          className="font-mono text-xs"
          style={{ color: rarityColor }}
          title={buddy.rarity}
        >
          {RARITY_STARS[buddy.rarity]}
        </span>
      </td>

      {/* Total stat bold mono */}
      <td
        className="py-3 px-4 text-right font-mono text-sm font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        {buddy.total_stats}
      </td>

      {/* Individual stats — hidden on mobile */}
      <td
        className="py-3 px-4 font-mono text-xs text-right hidden md:table-cell"
        style={{ color: "var(--color-text-muted)" }}
      >
        {buddy.stats.DEBUGGING}
      </td>
      <td
        className="py-3 px-4 font-mono text-xs text-right hidden md:table-cell"
        style={{ color: "var(--color-text-muted)" }}
      >
        {buddy.stats.PATIENCE}
      </td>
      <td
        className="py-3 px-4 font-mono text-xs text-right hidden md:table-cell"
        style={{ color: "var(--color-text-muted)" }}
      >
        {buddy.stats.CHAOS}
      </td>
      <td
        className="py-3 px-4 font-mono text-xs text-right hidden md:table-cell"
        style={{ color: "var(--color-text-muted)" }}
      >
        {buddy.stats.WISDOM}
      </td>
      <td
        className="py-3 px-4 font-mono text-xs text-right hidden md:table-cell"
        style={{ color: "var(--color-text-muted)" }}
      >
        {buddy.stats.SNARK}
      </td>
    </tr>
  );
}
