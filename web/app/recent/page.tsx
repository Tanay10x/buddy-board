import { getRecentBuddies } from "@/lib/queries";
import { MiniBuddyCard } from "@/components/MiniBuddyCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recently Hatched — Buddy Board",
  description: "The newest Claude Code companions to join the board.",
};

export const revalidate = 30;

export default async function RecentPage() {
  const buddies = await getRecentBuddies(20);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1
          className="font-display text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "#e5e7eb" }}
        >
          Recently Hatched
        </h1>
        <p className="text-sm" style={{ color: "#6b7280" }}>
          The newest companions to join the board — refreshes every 30s.
        </p>
      </div>

      <div className="space-y-3">
        {buddies.map((buddy, i) => (
          <MiniBuddyCard key={buddy.id} buddy={buddy} position={i + 1} />
        ))}
        {buddies.length === 0 && (
          <p className="text-center py-16 font-mono text-sm" style={{ color: "#6b7280" }}>
            No buddies yet. Be the first!
          </p>
        )}
      </div>
    </div>
  );
}
