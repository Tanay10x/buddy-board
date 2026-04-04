import { notFound } from "next/navigation";
import { getOrgBySlug, getOrgMembers } from "@/lib/queries";
import type { Buddy } from "@/lib/types";
import type { Metadata } from "next";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const org = await getOrgBySlug(slug);
  if (!org) return { title: "Not Found" };
  return {
    title: `${org.display_name} — Buddy Board`,
    description: org.description ?? `${org.display_name} on Buddy Board`,
  };
}

const RARITY_COLORS: Record<string, string> = {
  legendary: "#f59e0b",
  epic: "#a855f7",
  rare: "#3b82f6",
  uncommon: "#22c55e",
  common: "#9ca3af",
};

export default async function OrgDashboardPage({ params }: Props) {
  const { slug } = await params;
  const [org, members] = await Promise.all([
    getOrgBySlug(slug),
    getOrgBySlug(slug).then((o) => (o ? getOrgMembers(o.id) : [])),
  ]);

  if (!org) notFound();

  // Species distribution
  const speciesCounts: Record<string, number> = {};
  for (const m of members) {
    speciesCounts[m.species] = (speciesCounts[m.species] || 0) + 1;
  }
  const speciesSorted = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1]);

  // Rarity distribution
  const rarityCounts: Record<string, number> = {};
  for (const m of members) {
    rarityCounts[m.rarity] = (rarityCounts[m.rarity] || 0) + 1;
  }
  const rarityOrder = ["legendary", "epic", "rare", "uncommon", "common"];
  const raritySorted = rarityOrder
    .filter((r) => rarityCounts[r] > 0)
    .map((r) => [r, rarityCounts[r]] as [string, number]);

  // Combined total stats
  const combinedStats = members.reduce((sum, m) => sum + m.total_stats, 0);

  // Unique species count for Full Dex
  const uniqueSpecies = Object.keys(speciesCounts).length;
  const TOTAL_SPECIES = 18;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{ backgroundColor: "#1a1a1a", color: "#4ade80", border: "1px solid #2e2e2e" }}
          >
            {org.slug}
          </span>
        </div>
        <h1
          className="font-display text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "#ffffff" }}
        >
          {org.display_name}
        </h1>
        {org.description && (
          <p className="font-sans text-sm mb-3" style={{ color: "#9ca3af" }}>
            {org.description}
          </p>
        )}
        <div className="flex items-center gap-5">
          <span className="font-sans text-sm" style={{ color: "#6b7280" }}>
            <span className="font-mono font-bold" style={{ color: "#e5e7eb" }}>{org.member_count}</span>{" "}
            members
          </span>
          <span className="font-sans text-sm" style={{ color: "#6b7280" }}>
            <span className="font-mono font-bold" style={{ color: "#4ade80" }}>{org.verified_member_count}</span>{" "}
            verified
          </span>
        </div>
      </div>

      {/* Unverified disclaimer */}
      {org.verified_member_count === 0 && org.member_count > 0 && (
        <div
          className="rounded-lg p-3 sm:p-4 mb-6 flex gap-3"
          style={{ backgroundColor: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.2)" }}
        >
          <span style={{ color: "#eab308", fontSize: "14px", flexShrink: 0 }}>&#9432;</span>
          <p className="font-sans text-xs" style={{ color: "#9ca3af", lineHeight: 1.6 }}>
            All members in this org are currently <strong style={{ color: "#e5e7eb" }}>unverified</strong>.
            Org verification checks GitHub public membership — if your org membership is set to private on GitHub,
            you&apos;ll appear unverified. To verify: go to{" "}
            <span className="font-mono" style={{ color: "#4ade80" }}>github.com/orgs/{org.slug}/people</span>{" "}
            and set your membership visibility to public.
          </p>
        </div>
      )}

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {/* Species Distribution */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <h2
            className="font-sans text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#6b7280" }}
          >
            Species Distribution
          </h2>
          {speciesSorted.length === 0 ? (
            <p className="font-sans text-xs" style={{ color: "#6b7280" }}>No members yet</p>
          ) : (
            <div className="space-y-2">
              {speciesSorted.slice(0, 8).map(([species, count]) => (
                <div key={species} className="flex items-center justify-between">
                  <span className="font-mono text-xs capitalize" style={{ color: "#e5e7eb" }}>
                    {species}
                  </span>
                  <span className="font-mono text-xs" style={{ color: "#4ade80" }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rarity Distribution */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <h2
            className="font-sans text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#6b7280" }}
          >
            Rarity Distribution
          </h2>
          {raritySorted.length === 0 ? (
            <p className="font-sans text-xs" style={{ color: "#6b7280" }}>No members yet</p>
          ) : (
            <div className="space-y-2">
              {raritySorted.map(([rarity, count]) => (
                <div key={rarity} className="flex items-center justify-between">
                  <span
                    className="font-mono text-xs capitalize"
                    style={{ color: RARITY_COLORS[rarity] ?? "#9ca3af" }}
                  >
                    {rarity}
                  </span>
                  <span className="font-mono text-xs" style={{ color: "#e5e7eb" }}>
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Team Achievements */}
      <div className="mb-8">
        <h2
          className="font-sans text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#6b7280" }}
        >
          Team Achievements
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {/* Full Dex */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
          >
            <div
              className="font-mono text-xl sm:text-2xl font-bold mb-1"
              style={{ color: uniqueSpecies === TOTAL_SPECIES ? "#4ade80" : "#e5e7eb" }}
            >
              {uniqueSpecies}/{TOTAL_SPECIES}
            </div>
            <div className="font-sans text-xs font-semibold mb-0.5" style={{ color: "#e5e7eb" }}>
              Full Dex
            </div>
            <div className="font-sans text-[10px]" style={{ color: "#6b7280" }}>
              Unique species
            </div>
          </div>

          {/* Combined Power */}
          <div
            className="rounded-xl p-4"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
          >
            <div
              className="font-mono text-xl sm:text-2xl font-bold mb-1"
              style={{ color: "#a855f7" }}
            >
              {combinedStats.toLocaleString()}
            </div>
            <div className="font-sans text-xs font-semibold mb-0.5" style={{ color: "#e5e7eb" }}>
              Combined Power
            </div>
            <div className="font-sans text-[10px]" style={{ color: "#6b7280" }}>
              Sum of all total stats
            </div>
          </div>
        </div>
      </div>

      {/* Team Leaderboard */}
      <div>
        <h2
          className="font-sans text-xs font-semibold uppercase tracking-widest mb-4"
          style={{ color: "#6b7280" }}
        >
          Team Leaderboard
        </h2>

        {members.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center"
            style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
          >
            <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
              No members yet.
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid #2e2e2e" }}
          >
            {members.map((member: Buddy, idx: number) => (
              <a
                key={member.id}
                href={`/u/${member.username}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#1f1f1f]"
                style={{
                  backgroundColor: idx % 2 === 0 ? "#1a1a1a" : "#161616",
                  borderBottom: idx < members.length - 1 ? "1px solid #2e2e2e" : "none",
                  textDecoration: "none",
                }}
              >
                {/* Rank */}
                <span
                  className="font-mono text-xs w-6 text-right shrink-0"
                  style={{ color: idx < 3 ? "#4ade80" : "#6b7280" }}
                >
                  {idx + 1}
                </span>

                {/* Name + username */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-sm font-medium truncate" style={{ color: "#e5e7eb" }}>
                      {member.name}
                    </span>
                    <span
                      className="font-mono text-[10px] px-1.5 py-0.5 rounded capitalize shrink-0"
                      style={{
                        backgroundColor: "#0c0c0c",
                        color: RARITY_COLORS[member.rarity] ?? "#9ca3af",
                        border: "1px solid #2e2e2e",
                      }}
                    >
                      {member.rarity}
                    </span>
                  </div>
                  <span className="font-mono text-[10px]" style={{ color: "#6b7280" }}>
                    @{member.username} · {member.species}
                  </span>
                </div>

                {/* Total stats */}
                <span className="font-mono text-sm font-bold shrink-0" style={{ color: "#4ade80" }}>
                  {member.total_stats}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
