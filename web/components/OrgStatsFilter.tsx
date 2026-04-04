"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function OrgStatsFilter({ orgSlugs }: { orgSlugs: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrg = searchParams.get("org") ?? "";

  function handleChange(value: string) {
    if (value) {
      router.push(`/stats?org=${encodeURIComponent(value)}`);
    } else {
      router.push("/stats");
    }
  }

  if (orgSlugs.length === 0) return null;

  return (
    <select
      value={currentOrg}
      onChange={(e) => handleChange(e.target.value)}
      className="font-mono text-xs rounded-md px-3 py-1.5 cursor-pointer appearance-none"
      style={{
        backgroundColor: "#242424",
        border: `1px solid ${currentOrg ? "#4ade80" : "#2e2e2e"}`,
        color: currentOrg ? "#4ade80" : "#9ca3af",
      }}
    >
      <option value="">Global (all orgs)</option>
      {orgSlugs.map((slug) => (
        <option key={slug} value={slug}>{slug}</option>
      ))}
    </select>
  );
}
