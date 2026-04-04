import { notFound } from "next/navigation";
import { BuddyCard } from "@/components/BuddyCard";
import { ShareButton } from "@/components/ShareButton";
import { CopyButton } from "@/components/CopyButton";
import { CompareInput } from "@/components/CompareInput";
import { getBuddyByUsername, getBuddyRank } from "@/lib/queries";
import { STAT_NAMES } from "@/lib/constants";
import type { Metadata } from "next";

export const revalidate = 300;

const SITE_URL = "https://web-livid-eta-79.vercel.app";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);
  if (!buddy) return { title: "Not Found" };

  const ogImage = `${SITE_URL}/card/${username}`;

  return {
    title: `${buddy.name} — ${username}'s Buddy`,
    description: buddy.personality,
    openGraph: {
      title: `${buddy.name} — ${username}'s Buddy`,
      description: buddy.personality,
      images: [{ url: ogImage, width: 1200, height: 675 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${buddy.name} — ${username}'s Buddy`,
      images: [ogImage],
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);
  if (!buddy) notFound();

  const rank = await getBuddyRank(username);
  const profileUrl = `${SITE_URL}/u/${username}`;
  const cardUrl = `${SITE_URL}/card/${username}`;
  const badgeUrl = `${SITE_URL}/badge/${username}`;

  const cardEmbed = `[![buddy](${cardUrl})](${profileUrl})`;
  const badgeEmbed = `[![buddy](${badgeUrl})](${profileUrl})`;

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── GitHub Profile Banner ────────────────────────── */}
      {buddy.github_avatar_url && (
        <div
          className="flex items-center gap-3 rounded-lg p-3 sm:p-4 mb-5"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <img
            src={buddy.github_avatar_url}
            alt={buddy.github_username ?? buddy.username}
            className="w-10 h-10 rounded-full shrink-0"
          />
          <div className="min-w-0">
            <a
              href={buddy.github_profile_url ?? `https://github.com/${buddy.github_username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm font-bold transition-colors duration-150"
              style={{ color: "#4ade80" }}
            >
              @{buddy.github_username}
            </a>
            {buddy.github_bio && (
              <p className="font-sans text-xs mt-0.5 truncate" style={{ color: "#9ca3af" }}>
                {buddy.github_bio}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Buddy Card ───────────────────────────────────── */}
      <div className="flex justify-center">
        <BuddyCard buddy={buddy} />
      </div>

      {/* ── Share to X ───────────────────────────────────── */}
      <div className="flex justify-center mt-5">
        <ShareButton
          name={buddy.name}
          rarity={buddy.rarity}
          species={buddy.species}
          totalStats={buddy.total_stats}
          url={profileUrl}
        />
      </div>

      {/* ── Rankings ─────────────────────────────────────── */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        <div
          className="rounded-lg p-3 sm:p-4 text-center"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="font-display text-xl sm:text-2xl font-bold mb-1" style={{ color: "#4ade80" }}>
            #{rank.overall}
          </div>
          <div className="font-sans text-[10px] sm:text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
            Overall
          </div>
        </div>

        {STAT_NAMES.map((stat) => (
          <div
            key={stat}
            className="rounded-lg p-3 sm:p-4 text-center"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
          >
            <div className="font-display text-xl sm:text-2xl font-bold mb-1" style={{ color: "#e5e7eb" }}>
              #{rank.perStat[stat]}
            </div>
            <div className="font-mono text-[10px] sm:text-xs uppercase" style={{ color: "#6b7280" }}>
              {stat}
            </div>
          </div>
        ))}
      </div>

      {/* ── Share & Embed ────────────────────────────────── */}
      <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7280" }}>
          Share & Embed
        </h3>

        {/* Full card embed */}
        <div
          className="rounded-lg p-3 sm:p-4"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="font-sans text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
              Card embed (README)
            </label>
            <CopyButton text={cardEmbed} />
          </div>
          <code className="font-mono text-xs break-all leading-relaxed block" style={{ color: "#4ade80" }}>
            {cardEmbed}
          </code>
        </div>

        {/* Badge embed */}
        <div
          className="rounded-lg p-3 sm:p-4"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="font-sans text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
              Badge embed (compact)
            </label>
            <CopyButton text={badgeEmbed} />
          </div>
          <code className="font-mono text-xs break-all leading-relaxed block" style={{ color: "#4ade80" }}>
            {badgeEmbed}
          </code>
        </div>

        {/* Share link */}
        <div
          className="rounded-lg p-3 sm:p-4"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="flex items-center justify-between mb-2">
            <label className="font-sans text-xs uppercase tracking-wider" style={{ color: "#6b7280" }}>
              Share link
            </label>
            <CopyButton text={profileUrl} />
          </div>
          <code className="font-mono text-xs break-all block" style={{ color: "#4ade80" }}>
            {profileUrl}
          </code>
        </div>

        <p className="text-xs" style={{ color: "#6b7280" }}>
          The card image appears automatically when you share your link on X, Discord, Slack, or LinkedIn.
        </p>

        {/* Compare with another buddy */}
        <div
          className="rounded-lg p-3 sm:p-4"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <label className="block font-sans text-xs mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>
            Compare with another buddy
          </label>
          <CompareInput username={buddy.username} />
        </div>
      </div>
    </div>
  );
}
