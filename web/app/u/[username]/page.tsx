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
      images: [`/card/${username}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${buddy.name} — ${username}'s Buddy`,
      images: [`/card/${username}`],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);
  if (!buddy) notFound();

  const rank = await getBuddyRank(username);
  const cardUrl = `https://buddyboard.dev/card/${username}`;
  const profileUrl = `https://buddyboard.dev/u/${username}`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── Buddy Card ───────────────────────────────────── */}
      <div className="flex justify-center">
        <BuddyCard buddy={buddy} />
      </div>

      {/* ── Rankings ─────────────────────────────────────── */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {/* Overall rank */}
        <div className="rounded-lg border border-border bg-surface p-3 sm:p-4 text-center">
          <div className="font-display text-xl sm:text-2xl font-bold mb-1 text-terminal">
            #{rank.overall}
          </div>
          <div className="font-sans text-[10px] sm:text-xs uppercase tracking-wider text-text-muted">
            Overall
          </div>
        </div>

        {/* Per-stat ranks */}
        {STAT_NAMES.map((stat) => (
          <div
            key={stat}
            className="rounded-lg border border-border bg-surface p-3 sm:p-4 text-center"
          >
            <div className="font-display text-xl sm:text-2xl font-bold mb-1 text-text-primary">
              #{rank.perStat[stat]}
            </div>
            <div className="font-mono text-[10px] sm:text-xs uppercase text-text-muted">
              {stat}
            </div>
          </div>
        ))}
      </div>

      {/* ── Share ────────────────────────────────────────── */}
      <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Share
        </h3>

        {/* Embed in README */}
        <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
          <label className="block font-sans text-xs mb-2 uppercase tracking-wider text-text-muted">
            Embed in README
          </label>
          <code className="font-mono text-xs break-all leading-relaxed block text-terminal">
            [![buddy]({cardUrl})]({profileUrl})
          </code>
        </div>

        {/* Share link */}
        <div className="rounded-lg border border-border bg-surface p-3 sm:p-4">
          <label className="block font-sans text-xs mb-2 uppercase tracking-wider text-text-muted">
            Share link
          </label>
          <code className="font-mono text-xs break-all block text-terminal">
            {profileUrl}
          </code>
        </div>
      </div>
    </div>
  );
}
