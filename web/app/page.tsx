import { LeaderboardTable } from "@/components/LeaderboardTable";
import { getLeaderboard } from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const buddies = await getLeaderboard();

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="text-center mb-20 pt-8">
        <h1
          className="text-5xl font-black leading-tight mb-5 tracking-tight"
          style={{ fontFamily: "Satoshi, sans-serif" }}
        >
          <span style={{ color: "#e5e7eb" }}>See how your buddy</span>
          <br />
          <span style={{ color: "#4ade80" }}>stacks up.</span>
        </h1>

        <p className="font-sans text-base mb-8 max-w-md mx-auto" style={{ color: "#9ca3af" }}>
          Competitive leaderboard and shareable trading cards for Claude Code companions.
        </p>

        {/* Command prompt box */}
        <div
          className="inline-block rounded-lg border px-5 py-3"
          style={{
            backgroundColor: "#1a1a1a",
            borderColor: "#2e2e2e",
          }}
        >
          <code className="font-mono text-sm" style={{ color: "#4ade80" }}>
            $ npx buddy-board --username yourname
          </code>
        </div>

        {/* How it works */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
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
              className="rounded-lg border p-5"
              style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
            >
              <div
                className="font-mono text-xs mb-2"
                style={{ color: "#4ade80" }}
              >
                {step.num}
              </div>
              <div
                className="font-sans text-sm font-semibold mb-1"
                style={{ color: "#e5e7eb", fontFamily: "Satoshi, sans-serif" }}
              >
                {step.title}
              </div>
              <div className="font-sans text-xs" style={{ color: "#6b7280" }}>
                {step.desc}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Leaderboard ──────────────────────────────────── */}
      <section>
        <div className="mb-6">
          <h2
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "Satoshi, sans-serif", color: "#e5e7eb" }}
          >
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
