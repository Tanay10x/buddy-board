import { LeaderboardTable } from "@/components/LeaderboardTable";
import { getLeaderboard } from "@/lib/queries";

export const revalidate = 60;

export default async function HomePage() {
  const buddies = await getLeaderboard();

  return (
    <div>
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-3">
          Claude Code Buddy Board
        </h1>
        <p className="text-gray-400 text-lg mb-6">
          See how your buddy stacks up against the rest.
        </p>
        <div className="inline-block bg-gray-900 border border-gray-700 rounded-lg px-6 py-3">
          <code className="text-green-400 text-sm">
            npx buddy-board --username yourname
          </code>
        </div>
      </div>

      {/* Leaderboard */}
      <LeaderboardTable buddies={buddies} />
    </div>
  );
}
