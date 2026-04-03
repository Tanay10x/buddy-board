import Link from "next/link";
import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import type { Buddy } from "@/lib/types";

export function LeaderboardRow({ buddy, rank }: { buddy: Buddy; rank: number }) {
  const color = RARITY_COLORS[buddy.rarity];

  return (
    <tr className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      <td className="py-3 px-4 text-gray-500 font-mono text-right w-12">
        {rank}
      </td>
      <td className="py-3 px-4">
        <Link
          href={`/u/${buddy.username}`}
          className="text-white hover:underline font-mono"
        >
          {buddy.username}
          {buddy.github_verified && (
            <span className="ml-1 text-green-400 text-xs">✓</span>
          )}
          {buddy.shiny && <span className="ml-1 text-yellow-300">✨</span>}
        </Link>
      </td>
      <td className="py-3 px-4 text-gray-400 font-mono text-sm">
        {buddy.name}
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-sm capitalize" style={{ color }}>
          {buddy.species}
        </span>
      </td>
      <td className="py-3 px-4">
        <span className="font-mono text-xs" style={{ color }}>
          {RARITY_STARS[buddy.rarity]}
        </span>
      </td>
      <td className="py-3 px-4 text-white font-mono text-right font-bold">
        {buddy.total_stats}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-gray-500 hidden md:table-cell">
        {buddy.stats.DEBUGGING}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-gray-500 hidden md:table-cell">
        {buddy.stats.PATIENCE}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-gray-500 hidden md:table-cell">
        {buddy.stats.CHAOS}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-gray-500 hidden md:table-cell">
        {buddy.stats.WISDOM}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-gray-500 hidden md:table-cell">
        {buddy.stats.SNARK}
      </td>
    </tr>
  );
}
