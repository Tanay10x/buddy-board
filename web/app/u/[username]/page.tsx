import { notFound } from "next/navigation";
import { BuddyCard } from "@/components/BuddyCard";
import { getBuddyByUsername, getBuddyRank } from "@/lib/queries";
import { STAT_NAMES } from "@/lib/constants";
import type { Metadata } from "next";

export const revalidate = 300;

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);
  if (!buddy) return { title: "Not Found" };

  return {
    title: `${buddy.name} — ${username}'s Buddy`,
    description: buddy.personality,
    openGraph: {
      title: `${buddy.name} — ${username}'s Buddy`,
      description: buddy.personality,
      images: [`/card/${username}.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${buddy.name} — ${username}'s Buddy`,
      images: [`/card/${username}.png`],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);
  if (!buddy) notFound();

  const rank = await getBuddyRank(username);
  const cardUrl = `https://buddyboard.dev/card/${username}.png`;
  const profileUrl = `https://buddyboard.dev/u/${username}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Buddy Card ───────────────────────────────────── */}
      <div className="flex justify-center">
        <BuddyCard buddy={buddy} />
      </div>

      {/* ── Rankings ─────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Overall rank */}
        <div
          className="rounded-lg border p-4 text-center"
          style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
        >
          <div
            className="text-2xl font-bold mb-1"
            style={{ fontFamily: "Satoshi, sans-serif", color: "#4ade80" }}
          >
            #{rank.overall}
          </div>
          <div className="font-sans text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
            Overall
          </div>
        </div>

        {/* Per-stat ranks */}
        {STAT_NAMES.map((stat) => (
          <div
            key={stat}
            className="rounded-lg border p-4 text-center"
            style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "Satoshi, sans-serif", color: "#e5e7eb" }}
            >
              #{rank.perStat[stat]}
            </div>
            <div className="font-mono text-xs uppercase" style={{ color: "#6b7280" }}>
              {stat}
            </div>
          </div>
        ))}
      </div>

      {/* ── Share ────────────────────────────────────────── */}
      <div className="mt-10 space-y-4">
        <h3
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "#6b7280" }}
        >
          Share
        </h3>

        {/* Embed in README */}
        <div
          className="rounded-lg border p-4"
          style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
        >
          <label
            className="block font-sans text-xs mb-2 uppercase tracking-wider"
            style={{ color: "#6b7280" }}
          >
            Embed in README
          </label>
          <code
            className="font-mono text-xs break-all leading-relaxed block"
            style={{ color: "#4ade80" }}
          >
            [![buddy]({cardUrl})]({profileUrl})
          </code>
        </div>

        {/* Share link */}
        <div
          className="rounded-lg border p-4"
          style={{ backgroundColor: "#1a1a1a", borderColor: "#2e2e2e" }}
        >
          <label
            className="block font-sans text-xs mb-2 uppercase tracking-wider"
            style={{ color: "#6b7280" }}
          >
            Share link
          </label>
          <code
            className="font-mono text-xs break-all block"
            style={{ color: "#4ade80" }}
          >
            {profileUrl}
          </code>
        </div>
      </div>
    </div>
  );
}
