import { LeaderboardTable } from "@/components/LeaderboardTable";
import { getLeaderboard } from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const buddies = await getLeaderboard();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center mb-12 sm:mb-20 pt-4 sm:pt-8">
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-black leading-tight mb-4 sm:mb-5 tracking-tight">
          <span className="text-text-primary">See how your buddy</span>
          <br />
          <span className="text-terminal">stacks up.</span>
        </h1>

        <p className="font-sans text-sm sm:text-base mb-6 sm:mb-8 max-w-md mx-auto text-text-secondary">
          Competitive leaderboard and shareable trading cards for Claude Code companions.
        </p>

        {/* Command prompt box */}
        <div className="inline-block rounded-lg border border-border bg-surface px-3 sm:px-5 py-2.5 sm:py-3">
          <code className="font-mono text-xs sm:text-sm text-terminal">
            $ npx buddy-board --username yourname
          </code>
        </div>

        {/* How it works */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-2xl mx-auto text-left">
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
              className="rounded-lg border border-border bg-surface p-4 sm:p-5"
            >
              <div className="font-mono text-xs mb-2 text-terminal">
                {step.num}
              </div>
              <div className="font-display text-sm font-semibold mb-1 text-text-primary">
                {step.title}
              </div>
              <div className="font-sans text-xs text-text-muted">
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Leaderboard ──────────────────────────────────── */}
      <section>
        <div className="mb-4 sm:mb-6">
          <h2 className="font-display text-xl sm:text-2xl font-bold mb-1 text-text-primary">
            Leaderboard
          </h2>
          <p className="font-sans text-sm text-text-muted">
            {buddies.length} {buddies.length === 1 ? "buddy" : "buddies"} registered
          </p>
        </div>
        <LeaderboardTable buddies={buddies} />
      </section>
    </div>
  );
}
