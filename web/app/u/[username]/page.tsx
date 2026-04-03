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
      {/* Card */}
      <BuddyCard buddy={buddy} />

      {/* Rankings */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">#{rank.overall}</div>
          <div className="text-gray-500 text-xs mt-1">Overall</div>
        </div>
        {STAT_NAMES.map((stat) => (
          <div key={stat} className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-white">#{rank.perStat[stat]}</div>
            <div className="text-gray-500 text-xs mt-1">{stat}</div>
          </div>
        ))}
      </div>

      {/* Share */}
      <div className="mt-8 space-y-4">
        <h3 className="text-gray-400 text-sm font-bold uppercase">Share</h3>
        <div className="space-y-2">
          <div className="bg-gray-900 border border-gray-800 rounded p-3">
            <label className="text-gray-500 text-xs block mb-1">Embed in README</label>
            <code className="text-green-400 text-xs break-all">
              [![buddy]({cardUrl})]({profileUrl})
            </code>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded p-3">
            <label className="text-gray-500 text-xs block mb-1">Share link</label>
            <code className="text-green-400 text-xs break-all">{profileUrl}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
