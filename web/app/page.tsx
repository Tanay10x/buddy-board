import { LeaderboardTable } from "@/components/LeaderboardTable";
import { CopyButton } from "@/components/CopyButton";
import { getLeaderboard } from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const buddies = await getLeaderboard();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center py-8 md:py-16">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 sm:mb-5 tracking-tight">
          <span style={{ color: "#e5e7eb" }}>See how your buddy</span>
          <br />
          <span style={{ color: "#4ade80" }}>stacks up.</span>
        </h1>

        <p className="font-sans text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto" style={{ color: "#9ca3af" }}>
          Competitive leaderboard and shareable trading cards for Claude Code companions.
        </p>

        {/* Command prompt box */}
        <div
          className="inline-flex items-center gap-3 rounded-lg px-3 sm:px-5 py-2.5 sm:py-3"
          style={{
            backgroundColor: "#1a1a1a",
            border: "1px solid #2e2e2e",
          }}
        >
          <code className="font-mono text-xs sm:text-sm" style={{ color: "#4ade80" }}>
            $ npx buddy-board --username yourname
          </code>
          <CopyButton text="npx buddy-board --username yourname" />
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────── */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-12 md:mb-16 max-w-3xl mx-auto">
        {[
          {
            num: "01",
            title: "Run the command",
            desc: "Run the npx command with your username to register your buddy.",
          },
          {
            num: "02",
            title: "Data computed",
            desc: "Your buddy's stats, rarity, and species are computed from your coding activity.",
          },
          {
            num: "03",
            title: "Card generated",
            desc: "A shareable trading card is generated — embed it in your README or share the link.",
          },
        ].map((step) => (
          <div
            key={step.num}
            className="rounded-lg p-4 sm:p-5 text-left"
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #2e2e2e",
            }}
          >
            <div className="font-mono text-xs mb-2" style={{ color: "#4ade80" }}>
              {step.num}
            </div>
            <div className="font-display text-sm font-semibold mb-1" style={{ color: "#e5e7eb" }}>
              {step.title}
            </div>
            <div className="font-sans text-xs" style={{ color: "#6b7280" }}>
              {step.desc}
            </div>
          </div>
        ))}
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
