import { notFound } from "next/navigation";
import { getTwoBuddies } from "@/lib/queries";
import { BuddyCard } from "@/components/BuddyCard";
import { StatCompareRow } from "@/components/StatCompareRow";
import { STAT_NAMES, RARITY_COLORS } from "@/lib/constants";
import type { StatName } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = { params: Promise<{ user1: string; user2: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { user1, user2 } = await params;
  return {
    title: `${user1} vs ${user2} — Buddy Board`,
    description: `Compare ${user1}'s buddy against ${user2}'s buddy on Buddy Board.`,
  };
}

export default async function ComparePage({ params }: Props) {
  const { user1, user2 } = await params;
  const [buddyA, buddyB] = await getTwoBuddies(user1, user2);

  if (!buddyA || !buddyB) notFound();

  const statNames: StatName[] = STAT_NAMES;

  const aWins = buddyA.total_stats > buddyB.total_stats;
  const tie = buddyA.total_stats === buddyB.total_stats;

  const winnerName = tie ? null : aWins ? buddyA.name : buddyB.name;
  const winnerColor = tie
    ? "#6b7280"
    : aWins
      ? RARITY_COLORS[buddyA.rarity]
      : RARITY_COLORS[buddyB.rarity];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl sm:text-3xl font-bold" style={{ color: "#e5e7eb" }}>
          Buddy Showdown
        </h1>
        <p className="font-mono text-sm mt-1" style={{ color: "#6b7280" }}>
          @{user1} vs @{user2}
        </p>
      </div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        <a href={`/u/${buddyA.username}`}>
          <BuddyCard buddy={buddyA} />
        </a>
        <a href={`/u/${buddyB.username}`}>
          <BuddyCard buddy={buddyB} />
        </a>
      </div>

      {/* Stat-by-stat comparison */}
      <div
        className="rounded-xl overflow-hidden mb-8"
        style={{ border: "1px solid #2e2e2e", backgroundColor: "#1a1a1a" }}
      >
        <div className="grid grid-cols-3 px-5 py-3" style={{ borderBottom: "1px solid #2e2e2e" }}>
          <span className="font-display font-bold text-sm truncate" style={{ color: RARITY_COLORS[buddyA.rarity] }}>
            {buddyA.name}
          </span>
          <span className="font-mono text-xs uppercase text-center self-center" style={{ color: "#6b7280" }}>
            stat
          </span>
          <span className="font-display font-bold text-sm truncate text-right" style={{ color: RARITY_COLORS[buddyB.rarity] }}>
            {buddyB.name}
          </span>
        </div>

        {statNames.map((stat) => (
          <StatCompareRow
            key={stat}
            stat={stat}
            valueA={buddyA.stats[stat]}
            valueB={buddyB.stats[stat]}
          />
        ))}

        {/* Total row */}
        <div
          className="grid grid-cols-3 px-5 py-4"
          style={{ borderTop: "1px solid #2e2e2e" }}
        >
          <span
            className="font-display font-bold text-lg"
            style={{ color: aWins ? RARITY_COLORS[buddyA.rarity] : "#6b7280" }}
          >
            {buddyA.total_stats}
          </span>
          <span
            className="font-mono text-xs uppercase text-center self-center"
            style={{ color: "#9ca3af" }}
          >
            TOTAL
          </span>
          <span
            className="font-display font-bold text-lg text-right"
            style={{ color: !aWins && !tie ? RARITY_COLORS[buddyB.rarity] : "#6b7280" }}
          >
            {buddyB.total_stats}
          </span>
        </div>
      </div>

      {/* Who would win? */}
      <div
        className="rounded-xl p-6 text-center mb-8"
        style={{ backgroundColor: "#1a1a1a", border: `1px solid ${winnerColor}44` }}
      >
        {tie ? (
          <>
            <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#6b7280" }}>
              Result
            </p>
            <p className="font-display text-xl font-bold" style={{ color: "#9ca3af" }}>
              Dead tie — it&apos;s anyone&apos;s game.
            </p>
          </>
        ) : (
          <>
            <p className="font-mono text-xs uppercase tracking-widest mb-2" style={{ color: "#6b7280" }}>
              Who would win?
            </p>
            <p className="font-display text-xl font-bold" style={{ color: winnerColor }}>
              {winnerName}
            </p>
            <p className="text-sm mt-1" style={{ color: "#6b7280" }}>
              wins by {Math.abs(buddyA.total_stats - buddyB.total_stats)} stat points
            </p>
          </>
        )}
      </div>

      {/* Share this comparison */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
      >
        <label className="block font-sans text-xs mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>
          Share this matchup
        </label>
        <code className="font-mono text-xs break-all block" style={{ color: "#4ade80" }}>
          https://buddyboard.dev/compare/{user1}/{user2}
        </code>
      </div>
    </div>
  );
}
