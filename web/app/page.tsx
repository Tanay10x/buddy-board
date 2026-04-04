import { LeaderboardTable } from "@/components/LeaderboardTable";
import { CopyButton } from "@/components/CopyButton";
import { getLeaderboard, getOrgSlugs, getAllOrgMemberships } from "@/lib/queries";
import { renderSprite } from "@/lib/sprites";
import { RARITY_COLORS, RARITY_STARS, STAT_NAMES } from "@/lib/constants";
import type { Species, Eye, Hat, Rarity, StatName } from "@/lib/types";

export const revalidate = 60;

/* ── Mock featured buddies ────────────────────────────────────────────── */
const FEATURED = [
  {
    name: "Keeper",
    species: "cactus" as Species,
    rarity: "common" as Rarity,
    personality: "Wise but slow to respond, will eventually point out the exact line you broke.",
    stats: { DEBUGGING: 9, PATIENCE: 36, CHAOS: 6, WISDOM: 72, SNARK: 1 } as Record<StatName, number>,
    eye: "✦" as Eye,
    hat: "none" as Hat,
    total: 124,
  },
  {
    name: "Inferno",
    species: "dragon" as Species,
    rarity: "legendary" as Rarity,
    personality: "Burns through code reviews with terrifying accuracy. Never sleeps.",
    stats: { DEBUGGING: 92, PATIENCE: 55, CHAOS: 88, WISDOM: 78, SNARK: 65 } as Record<StatName, number>,
    eye: "✦" as Eye,
    hat: "crown" as Hat,
    total: 378,
  },
];

export default async function HomePage() {
  const [buddies, orgSlugs, orgMembers] = await Promise.all([
    getLeaderboard(),
    getOrgSlugs(),
    getAllOrgMemberships(),
  ]);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center pt-8 pb-4 md:pt-14 md:pb-6">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-3 tracking-tight">
          <span style={{ color: "#e5e7eb" }}>See how your buddy</span>
          <br />
          <span style={{ color: "#4ade80" }}>stacks up.</span>
        </h1>
        <p className="font-sans text-sm sm:text-base max-w-md mx-auto" style={{ color: "#9ca3af" }}>
          Competitive leaderboard and shareable trading cards for Claude Code companions.
        </p>
      </section>

      {/* ── Featured Cards ───────────────────────────────── */}
      <section className="max-w-3xl mx-auto mb-10 md:mb-14">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {FEATURED.map((buddy) => {
            const sprite = renderSprite(buddy.species, buddy.eye, buddy.hat);
            const color = RARITY_COLORS[buddy.rarity];
            const stars = RARITY_STARS[buddy.rarity];
            const isLegendary = buddy.rarity === "legendary";

            return (
              <div
                key={buddy.name}
                className="relative overflow-hidden rounded-xl"
                style={{
                  backgroundColor: "#1a1a1a",
                  border: `2px solid ${color}`,
                  boxShadow: isLegendary
                    ? `0 0 24px ${color}30, inset 0 0 20px ${color}08`
                    : undefined,
                  animation: isLegendary ? "legendary-pulse 3s ease-in-out infinite" : undefined,
                }}
              >
                {/* Scanlines */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "repeating-linear-gradient(to bottom, transparent 0px, transparent 3px, rgba(0,0,0,0.03) 3px, rgba(0,0,0,0.03) 4px)",
                    pointerEvents: "none",
                    zIndex: 1,
                  }}
                />

                {/* Holographic shimmer for legendary */}
                {isLegendary && (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "linear-gradient(105deg, transparent 20%, rgba(255,255,255,0.04) 30%, rgba(147,197,253,0.08) 40%, rgba(196,181,253,0.1) 50%, rgba(134,239,172,0.08) 60%, rgba(255,255,255,0.04) 70%, transparent 80%)",
                      backgroundSize: "200% 100%",
                      animation: "holo-shimmer 4s ease-in-out infinite",
                      pointerEvents: "none",
                      zIndex: 2,
                    }}
                  />
                )}

                <div className="relative z-10 p-5 sm:p-6">
                  {/* Header: rarity + species */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className="font-mono text-xs font-bold uppercase"
                      style={{ color, letterSpacing: "0.1em" }}
                    >
                      {stars} {buddy.rarity}
                    </span>
                    <span className="font-mono text-xs uppercase" style={{ color: "#6b7280" }}>
                      {buddy.species}
                    </span>
                  </div>

                  {/* Sprite + info */}
                  <div className="flex gap-4 mb-4">
                    <pre
                      className="font-mono text-xs leading-tight shrink-0 select-none"
                      style={{ color: "#4ade80", whiteSpace: "pre" }}
                    >
                      {sprite.join("\n")}
                    </pre>
                    <div className="flex flex-col justify-center min-w-0">
                      <div className="font-display text-lg font-bold" style={{ color: "#e5e7eb" }}>
                        {buddy.name}
                      </div>
                      <p className="text-xs italic mt-1 leading-snug" style={{ color: "#9ca3af" }}>
                        &quot;{buddy.personality}&quot;
                      </p>
                    </div>
                  </div>

                  {/* All 5 stat bars */}
                  <div className="flex flex-col gap-1.5">
                    {STAT_NAMES.map((stat) => {
                      const val = buddy.stats[stat];
                      return (
                        <div key={stat} className="flex items-center gap-2">
                          <span
                            className="font-mono uppercase shrink-0"
                            style={{ color: "#6b7280", fontSize: "10px", width: "72px", letterSpacing: "0.04em" }}
                          >
                            {stat}
                          </span>
                          <div
                            className="flex-1 rounded-full overflow-hidden"
                            style={{ height: "5px", backgroundColor: "#242424" }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${val}%`,
                                backgroundColor: color,
                                borderRadius: "9999px",
                                opacity: 0.85,
                              }}
                            />
                          </div>
                          <span
                            className="font-mono font-bold shrink-0"
                            style={{ color: "#e5e7eb", fontSize: "11px", width: "24px", textAlign: "right" }}
                          >
                            {val}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total */}
                  <div
                    className="flex items-center justify-between mt-4 pt-3"
                    style={{ borderTop: "1px solid #2e2e2e" }}
                  >
                    <span className="font-mono text-xs" style={{ color: "#6b7280" }}>
                      Total Stats
                    </span>
                    <span className="font-mono text-sm font-bold" style={{ color }}>
                      {buddy.total}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Get Started (compact) ────────────────────────── */}
      <section className="max-w-2xl mx-auto mb-12 md:mb-16">
        <div
          className="rounded-lg p-5 sm:p-6"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="font-display text-sm font-semibold mb-3" style={{ color: "#e5e7eb" }}>
            Get started in seconds
          </div>

          {/* Steps as inline text */}
          <p className="font-sans text-xs mb-4" style={{ color: "#6b7280", lineHeight: 1.7 }}>
            Run the command below to register your buddy.
            Your stats, species, and rarity are computed automatically from your Claude Code account.
            A shareable trading card is generated — embed it in your README or share the link.
          </p>

          {/* Commands */}
          <div className="flex flex-col gap-2">
            <div
              className="flex items-center gap-3 rounded-md px-3 py-2"
              style={{ backgroundColor: "#242424", border: "1px solid #2e2e2e" }}
            >
              <code className="font-mono text-xs flex-1" style={{ color: "#4ade80" }}>
                $ npx buddy-board --username yourname
              </code>
              <CopyButton text="npx buddy-board --username yourname" />
            </div>
            <div
              className="flex items-center gap-3 rounded-md px-3 py-2"
              style={{ backgroundColor: "#242424", border: "1px solid #2e2e2e" }}
            >
              <code className="font-mono text-xs flex-1" style={{ color: "#4ade80" }}>
                $ npx buddy-board --username yourname --github yourgithub
              </code>
              <CopyButton text="npx buddy-board --username yourname --github yourgithub" />
            </div>
            <div
              className="flex items-center gap-3 rounded-md px-3 py-2"
              style={{ backgroundColor: "#242424", border: "1px solid #2e2e2e" }}
            >
              <code className="font-mono text-xs flex-1" style={{ color: "#4ade80" }}>
                $ npx buddy-board --username yourname --github yourgithub --org your-org
              </code>
              <CopyButton text="npx buddy-board --username yourname --github yourgithub --org your-org" />
            </div>
            <p className="font-sans text-xs mt-2" style={{ color: "#6b7280", lineHeight: 1.6 }}>
              <span className="font-mono" style={{ color: "#9ca3af" }}>--github</span> links your GitHub profile and adds a verified badge.
              {" "}
              <span className="font-mono" style={{ color: "#9ca3af" }}>--org</span> joins your team&apos;s dashboard at{" "}
              <span className="font-mono" style={{ color: "#4ade80" }}>/org/your-org</span>.
              Org verification uses GitHub public membership — unverified members still appear on the team board.
            </p>
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
        <LeaderboardTable buddies={buddies} orgSlugs={orgSlugs} orgMembers={orgMembers} />
      </section>
    </div>
  );
}
