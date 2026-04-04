import { getOrgs } from "@/lib/queries";

export const revalidate = 60;

export default async function OrgsPage() {
  const orgs = await getOrgs();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1
          className="font-display text-2xl sm:text-3xl font-bold mb-2"
          style={{ color: "#ffffff" }}
        >
          Organizations
        </h1>
        <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
          {orgs.length} {orgs.length === 1 ? "organization" : "organizations"} registered on Buddy Board
        </p>
      </div>

      {/* Empty state */}
      {orgs.length === 0 && (
        <div
          className="rounded-xl p-10 text-center"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <div className="text-3xl mb-3">🏢</div>
          <p className="font-sans text-sm" style={{ color: "#6b7280" }}>
            No organizations yet. Be the first!
          </p>
        </div>
      )}

      {/* Grid of org cards */}
      {orgs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map((org) => (
            <a
              key={org.id}
              href={`/org/${org.slug}`}
              className="block rounded-xl p-5 transition-colors hover:border-[#4ade80]"
              style={{
                backgroundColor: "#1a1a1a",
                border: "1px solid #2e2e2e",
                textDecoration: "none",
              }}
            >
              {/* Org slug */}
              <div className="flex items-start justify-between mb-2">
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#0c0c0c", color: "#4ade80", border: "1px solid #2e2e2e" }}
                >
                  {org.slug}
                </span>
              </div>

              {/* Display name */}
              <h2
                className="font-display font-bold text-base mt-3 mb-1"
                style={{ color: "#e5e7eb" }}
              >
                {org.display_name}
              </h2>

              {/* Description */}
              {org.description && (
                <p
                  className="font-sans text-xs mb-3 line-clamp-2"
                  style={{ color: "#9ca3af" }}
                >
                  {org.description}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid #2e2e2e" }}>
                <div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#ffffff" }}>
                    {org.member_count}
                  </div>
                  <div className="font-sans text-[10px] uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Members
                  </div>
                </div>
                <div>
                  <div className="font-mono text-sm font-bold" style={{ color: "#4ade80" }}>
                    {org.verified_member_count}
                  </div>
                  <div className="font-sans text-[10px] uppercase tracking-wider" style={{ color: "#6b7280" }}>
                    Verified
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
