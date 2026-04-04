import { LeaderboardTable } from "@/components/LeaderboardTable";
import { CopyButton } from "@/components/CopyButton";
import { getLeaderboard } from "@/lib/queries";
import { renderSprite } from "@/lib/sprites";
import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import type { Species, Eye, Hat, Rarity } from "@/lib/types";

export const revalidate = 60;

type StatMap = { DEBUGGING: number; PATIENCE: number; CHAOS: number; WISDOM: number; SNARK: number };

interface FeaturedBuddy {
  name: string;
  species: Species;
  rarity: Rarity;
  personality: string;
  stats: StatMap;
  eye: Eye;
  hat: Hat;
}

const FEATURED_EXAMPLES: FeaturedBuddy[] = [
  {
    name: "Keeper",
    species: "cactus",
    rarity: "common",
    personality: "Wise but slow to respond, will eventually point out the exact line you broke.",
    stats: { DEBUGGING: 9, PATIENCE: 36, CHAOS: 6, WISDOM: 72, SNARK: 1 },
    eye: "✦",
    hat: "none",
  },
  {
    name: "Blaze",
    species: "dragon",
    rarity: "epic",
    personality: "Chaotic but somehow always right about the failing test.",
    stats: { DEBUGGING: 78, PATIENCE: 25, CHAOS: 92, WISDOM: 51, SNARK: 38 },
    eye: "✦",
    hat: "wizard",
  },
];

function FeaturedCard({ buddy }: { buddy: FeaturedBuddy }) {
  const sprite = renderSprite(buddy.species, buddy.eye, buddy.hat);
  const rarityColor = RARITY_COLORS[buddy.rarity];
  const rarityStars = RARITY_STARS[buddy.rarity];
  const topStats = (Object.entries(buddy.stats) as [string, number][])
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div
      style={{
        backgroundColor: "#1a1a1a",
        border: "1px solid #2e2e2e",
        borderRadius: "12px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        flex: 1,
        minWidth: "220px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Rarity accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          backgroundColor: rarityColor,
          opacity: 0.85,
        }}
      />

      {/* Name + rarity badge */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          className="font-display"
          style={{ color: "#e5e7eb", fontWeight: 700, fontSize: "1rem" }}
        >
          {buddy.name}
        </span>
        <span
          className="font-mono"
          style={{
            color: rarityColor,
            fontSize: "0.65rem",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            backgroundColor: `${rarityColor}18`,
            border: `1px solid ${rarityColor}40`,
            borderRadius: "4px",
            padding: "2px 6px",
          }}
        >
          {rarityStars} {buddy.rarity}
        </span>
      </div>

      {/* ASCII sprite */}
      <pre
        className="font-mono"
        style={{
          color: rarityColor,
          fontSize: "0.6rem",
          lineHeight: 1.45,
          margin: 0,
          textAlign: "center",
          opacity: 0.9,
        }}
      >
        {sprite.join("\n")}
      </pre>

      {/* Personality blurb */}
      <p
        className="font-sans"
        style={{
          color: "#9ca3af",
          fontSize: "0.72rem",
          lineHeight: 1.5,
          margin: 0,
          fontStyle: "italic",
        }}
      >
        &ldquo;{buddy.personality}&rdquo;
      </p>

      {/* Top 3 stat bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {topStats.map(([stat, val]) => (
          <div key={stat} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              className="font-mono"
              style={{
                color: "#6b7280",
                fontSize: "0.58rem",
                width: "68px",
                flexShrink: 0,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              {stat}
            </span>
            <div
              style={{
                flex: 1,
                height: "4px",
                backgroundColor: "#2e2e2e",
                borderRadius: "2px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${val}%`,
                  backgroundColor: rarityColor,
                  borderRadius: "2px",
                  opacity: 0.8,
                }}
              />
            </div>
            <span
              className="font-mono"
              style={{ color: "#6b7280", fontSize: "0.58rem", width: "18px", textAlign: "right" }}
            >
              {val}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function HomePage() {
  const buddies = await getLeaderboard();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center py-8 md:py-16">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 sm:mb-5 tracking-tight">
          <span style={{ color: "#e5e7eb" }}>See how your buddy</span>
          <br />
          <span style={{ color: "#E07A5F" }}>stacks up.</span>
        </h1>

        <p className="font-sans text-sm sm:text-base max-w-md mx-auto" style={{ color: "#9ca3af" }}>
          Competitive leaderboard and shareable trading cards for Claude Code companions.
        </p>
      </section>

      {/* ── Featured Buddy Showcase ───────────────────────── */}
      <section className="mb-10 md:mb-14 max-w-2xl mx-auto">
        <p
          className="font-mono text-xs mb-4 text-center"
          style={{ color: "#6b7280", letterSpacing: "0.1em", textTransform: "uppercase" }}
        >
          Example buddies
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {FEATURED_EXAMPLES.map((buddy) => (
            <FeaturedCard key={buddy.name} buddy={buddy} />
          ))}
        </div>
      </section>

      {/* ── How to Join ──────────────────────────────────── */}
      <section className="mb-12 md:mb-16 max-w-2xl mx-auto">
        <p className="font-sans text-sm mb-4" style={{ color: "#9ca3af" }}>
          Run one of these commands to submit your buddy and join the leaderboard.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Basic command */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #2e2e2e",
              borderRadius: "8px",
              padding: "10px 16px",
            }}
          >
            <code
              className="font-mono text-xs sm:text-sm"
              style={{ color: "#E07A5F", flex: 1, minWidth: 0, wordBreak: "break-all" }}
            >
              $ npx buddy-board --username yourname
            </code>
            <CopyButton text="npx buddy-board --username yourname" />
          </div>

          {/* GitHub command */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              backgroundColor: "#1a1a1a",
              border: "1px solid #2e2e2e",
              borderRadius: "8px",
              padding: "10px 16px",
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <code
                className="font-mono text-xs sm:text-sm"
                style={{ color: "#E07A5F", wordBreak: "break-all", display: "block" }}
              >
                $ npx buddy-board --username yourname --github yourgithub
              </code>
              <span
                className="font-mono text-xs"
                style={{ color: "#6b7280", display: "block", marginTop: "4px" }}
              >
                # adds verified badge
              </span>
            </div>
            <CopyButton text="npx buddy-board --username yourname --github yourgithub" />
          </div>
        </div>
      </section>

      {/* ── Leaderboard ──────────────────────────────────── */}
      <section>
        <div className="mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-1" style={{ color: "#e5e7eb" }}>
            Leaderboard
          </h2>
          <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
            {buddies.length} {buddies.length === 1 ? "buddy" : "buddies"} registered
          </p>
        </div>
        <LeaderboardTable buddies={buddies} />
      </section>
    </div>
  );
}
