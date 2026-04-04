# Phase Orgs — Organization & Team Support

**Status:** Planning
**Last Updated:** 2026-04-03
**DO NOT COMMIT** — internal planning document

---

## Research Summary

### GitHub Org Membership API

The GitHub REST API exposes two relevant endpoints for org membership:

```
GET /orgs/{org}/members/{username}
  → 204 if the user is a member (public OR private if requester is also an org member)
  → 302 redirect to /orgs/{org}/public_members/{username} if requester is not authenticated
  → 404 if not a member (or membership is private and requester is unauthenticated)

GET /orgs/{org}/public_members/{username}
  → 204 if the user has explicitly publicized their membership
  → 404 if membership is private or user is not a member
```

**Critical limitation:** Without authentication, only *public* memberships are visible. A user who has set their org membership to "private" (GitHub's default) will return 404 even if they are a real member. This is the fundamental constraint that shapes the entire verification strategy.

**Token requirement:** Verifying private membership requires a fine-grained PAT or GitHub App token with `Members` (read) org permission — scoped to that specific org. We cannot ask users to provide tokens for arbitrary orgs.

**Practical implication:** Org verification in the CLI must be treated as best-effort. Many real members will receive `unverified` status simply because their GitHub org membership is set to private.

### How Similar Platforms Handle Teams/Orgs

- **devActivity / GitHub Leaderboard tools** typically require OAuth login to verify org membership properly, since they need a user token scoped to the org. Without OAuth, they fall back to self-declaration.
- **Oasis (gamification engine)** supports explicit team membership stored in the platform's own DB — not derived from an external source. Teams are first-class entities users join explicitly.
- **github-leaderboard (techx)** works by fetching all contributors to an org's repos via the GitHub API, not by checking membership — sidesteps the membership privacy problem entirely.
- **shields.io** does not have org-level badges. It generates per-repo or per-user badges. Org-level badges are custom dynamic badges using the `?label=&message=&color=` query param pattern.

**Key insight:** The cleanest approach for Buddy Board is a **hybrid model**: orgs exist in our own DB (not derived from GitHub), GitHub membership check is a one-shot verification attempt at submit time, and the result is stored as a boolean. If verification fails (private membership), users can still claim an org — it just won't show a verified badge.

### Team Dashboard Best Practices

- Group related metrics together — don't dump everything on one page
- Make leaderboards team-oriented to reduce toxic competition: show team rank vs global, not just individual rank
- Allow filtering the global leaderboard by org — this is the most-used path, not the org-specific page
- "Team achievements" (e.g., "all 18 species represented") shift competition from individual to collective, which increases retention
- Member count + verified member count gives social proof without exposing private membership details

---

## Design Decisions

### Should org be a column on `buddies` or a separate `orgs` table?

**Recommendation: Separate `orgs` table + `buddy_orgs` join table.**

Rationale:
- A column on `buddies` (`org text, org_verified boolean`) is simpler but forces single-org membership. This is fine for v1 but becomes a painful migration if multi-org is added later.
- A separate `orgs` table lets us store org metadata (display name, description, avatar, created_at, member count) independently of any individual buddy.
- A `buddy_orgs` join table supports multi-org from day one with no future migration cost.
- The complexity overhead of two extra tables is low — both tables are tiny and rarely updated.

**Verdict:** Build with the `orgs` + `buddy_orgs` structure from the start. Multi-org is not a v1 UI feature, but the data model should support it. The CLI will only accept one `--org` at a time, and the profile page will display only the primary org (most recently claimed), but the data layer is future-proof.

### Should one user be in multiple orgs?

**Yes, at the data layer. No, in the CLI v1.**

- Data model: `buddy_orgs` join table — a user can belong to N orgs.
- CLI v1: `--org` sets a single org. Subsequent `--org` calls add to the list (not replace). A future `--remove-org` flag can handle removal.
- Web UI: Profile page shows all orgs the user belongs to (as small chips). The "primary" org (most recently joined) is shown first.
- Leaderboard filter: filtering by org shows all buddies who belong to that org, regardless of whether it's their primary.

### Should orgs be public by default?

**Yes, with an `unlisted` opt-in.**

- Default: org appears on `/org` list page and is filterable on the global leaderboard.
- Unlisted: org is accessible via `/org/[orgname]` but does not appear on `/org` list. Useful for private teams who want an internal dashboard without public visibility.
- No fully private orgs in v1 (too complex to enforce with anon key access and no auth system).

---

## Phase O-1: Data Model

### New Tables

```sql
-- Migration: 003_add_orgs.sql

-- Orgs table: one row per org
CREATE TABLE public.orgs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text UNIQUE NOT NULL CHECK (
                length(slug) BETWEEN 2 AND 39
                AND slug ~ '^[a-z0-9-]+$'
              ),
  -- Display name — defaults to slug, can be overridden
  display_name text NOT NULL,
  -- Optional GitHub org name to attempt membership verification against
  github_org  text,
  description text,
  unlisted    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orgs_slug ON public.orgs (slug);

-- Join table: buddy ↔ org membership
CREATE TABLE public.buddy_orgs (
  buddy_id     uuid NOT NULL REFERENCES public.buddies(id) ON DELETE CASCADE,
  org_id       uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  org_verified boolean NOT NULL DEFAULT false,
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (buddy_id, org_id)
);

CREATE INDEX idx_buddy_orgs_org_id ON public.buddy_orgs (org_id);
CREATE INDEX idx_buddy_orgs_buddy_id ON public.buddy_orgs (buddy_id);

-- RLS
ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buddy_orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read orgs"
  ON public.orgs FOR SELECT USING (true);

CREATE POLICY "Anyone can read buddy_orgs"
  ON public.buddy_orgs FOR SELECT USING (true);

CREATE POLICY "No direct inserts on orgs"
  ON public.orgs FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct inserts on buddy_orgs"
  ON public.buddy_orgs FOR INSERT WITH CHECK (false);

CREATE POLICY "No direct updates on orgs"
  ON public.orgs FOR UPDATE USING (false);

CREATE POLICY "No direct updates on buddy_orgs"
  ON public.buddy_orgs FOR UPDATE USING (false);

-- Public views
CREATE VIEW public.orgs_public AS
  SELECT
    o.id,
    o.slug,
    o.display_name,
    o.github_org,
    o.description,
    o.unlisted,
    o.created_at,
    COUNT(bo.buddy_id) AS member_count,
    COUNT(bo.buddy_id) FILTER (WHERE bo.org_verified) AS verified_member_count
  FROM public.orgs o
  LEFT JOIN public.buddy_orgs bo ON bo.org_id = o.id
  GROUP BY o.id;

GRANT SELECT ON public.orgs_public TO anon;
GRANT SELECT ON public.buddy_orgs TO anon;
```

### Updated `buddies_public` View

The existing `buddies_public` view stays as-is. Org membership is fetched via join when needed (org dashboard page), not embedded in the buddies view to avoid a fan-out.

### New RPC: `submit_buddy_org`

```sql
-- Migration: 003_add_orgs.sql (continued)

-- RPC to claim org membership (called separately from submit_buddy)
-- Called by CLI after the main submit succeeds.
CREATE OR REPLACE FUNCTION public.claim_org(
  p_username    text,
  p_token       text,
  p_org_slug    text,
  p_org_verified boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buddy   record;
  v_org     record;
BEGIN
  -- Verify buddy + token
  SELECT * INTO v_buddy FROM public.buddies WHERE username = p_username;
  IF v_buddy IS NULL THEN
    RAISE EXCEPTION 'buddy_not_found: No buddy with username %', p_username;
  END IF;
  IF p_token IS NULL OR v_buddy.secret_token != crypt(p_token, v_buddy.secret_token) THEN
    RAISE EXCEPTION 'invalid_token: Token does not match';
  END IF;

  -- Upsert org (create if it doesn't exist yet — orgs are created on first claim)
  INSERT INTO public.orgs (slug, display_name, github_org)
  VALUES (p_org_slug, p_org_slug, p_org_slug)
  ON CONFLICT (slug) DO NOTHING;

  SELECT * INTO v_org FROM public.orgs WHERE slug = p_org_slug;

  -- Upsert membership
  INSERT INTO public.buddy_orgs (buddy_id, org_id, org_verified, joined_at)
  VALUES (v_buddy.id, v_org.id, p_org_verified, now())
  ON CONFLICT (buddy_id, org_id)
  DO UPDATE SET
    org_verified = EXCLUDED.org_verified,
    joined_at = now();

  RETURN jsonb_build_object('org_slug', p_org_slug, 'org_verified', p_org_verified);
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_org TO anon;
```

**Design note on auto-creation:** Orgs are created automatically when first claimed. There is no separate "register an org" step. This mirrors how GitHub handles org creation — orgs spring into existence when referenced. Squatting risk is addressed in the edge cases section.

### TypeScript Types (web/lib/types.ts additions)

```typescript
export type Org = {
  id: string;
  slug: string;
  display_name: string;
  github_org: string | null;
  description: string | null;
  unlisted: boolean;
  created_at: string;
  member_count: number;
  verified_member_count: number;
};

export type BuddyOrg = {
  buddy_id: string;
  org_id: string;
  org_verified: boolean;
  joined_at: string;
};

// Extended Buddy type with org memberships (used on org pages)
export type BuddyWithOrgs = Buddy & {
  orgs: Array<{ slug: string; display_name: string; org_verified: boolean }>;
};
```

---

## Phase O-2: CLI Changes

### New Flag: `--org`

```
npx buddy-board --username tanay --org anthropic
npx buddy-board --username tanay --org anthropic --github tanayk07
```

The `--org` flag is independent of `--github`. A user can claim an org without GitHub verification, and vice versa. Both can be combined in a single run.

### Verification Logic

```javascript
// cli/submit.js — new function

export async function verifyOrgMembership(githubUsername, orgSlug) {
  // Only attempt if GitHub username is known
  if (!githubUsername) {
    return { verified: false, reason: 'no_github' };
  }

  try {
    // Attempt public membership check (no auth required)
    // GET /orgs/{org}/public_members/{username}
    // Returns 204 if public member, 404 otherwise
    const res = await fetch(
      `https://api.github.com/orgs/${encodeURIComponent(orgSlug)}/public_members/${encodeURIComponent(githubUsername)}`,
      {
        headers: {
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          // No auth token — we only check public membership
        },
      }
    );

    if (res.status === 204) {
      return { verified: true, reason: 'public_member' };
    }

    if (res.status === 404) {
      // Could be: private membership, not a member, or org doesn't exist on GitHub
      return { verified: false, reason: 'not_public_member' };
    }

    // 302 means we'd need auth — treat as unverified
    if (res.status === 302) {
      return { verified: false, reason: 'auth_required' };
    }

    return { verified: false, reason: `unexpected_status_${res.status}` };
  } catch {
    return { verified: false, reason: 'network_error' };
  }
}

export async function claimOrg({ username, token, orgSlug, orgVerified }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_org`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_username: username,
      p_token: token,
      p_org_slug: orgSlug.toLowerCase(),
      p_org_verified: orgVerified,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.message || `Server error: ${res.status}` };
  }

  return { success: true };
}
```

### Updated `index.js` Flow

```javascript
// cli/index.js — updated parseArgs and main()

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--username' && args[i + 1]) { result.username = args[i + 1].toLowerCase(); i++; }
    else if (args[i] === '--github' && args[i + 1]) { result.github = args[i + 1]; i++; }
    else if (args[i] === '--org' && args[i + 1]) { result.org = args[i + 1].toLowerCase(); i++; }
    else if (args[i] === '--help' || args[i] === '-h') { result.help = true; }
  }
  return result;
}

function printHelp() {
  console.log(`
buddy-board — Submit your Claude Code buddy to the leaderboard

Usage:
  npx buddy-board --username <name>
  npx buddy-board --username <name> --github <github-user>
  npx buddy-board --username <name> --github <github-user> --org <org-slug>

Options:
  --username  Your unique leaderboard username (3-20 chars, a-z, 0-9, hyphens)
  --github    Your GitHub username (optional, adds a verified badge)
  --org       GitHub org or team slug to join (e.g. anthropic, my-startup)
  --help      Show this help message

Notes:
  Org membership is verified against GitHub public_members API.
  If your GitHub org membership is set to private, you'll appear as
  unverified but will still be listed on the org's team dashboard.
`);
}

// In main(), after step 5 (submit):
async function handleOrg(args, result) {
  if (!args.org) return;

  console.log(`Claiming org membership: ${args.org}...`);

  // Attempt verification only if GitHub username was provided and verified
  let orgVerified = false;
  if (args.github && githubVerified) {
    console.log(`Checking public GitHub org membership (@${args.github} in ${args.org})...`);
    const verifyResult = await verifyOrgMembership(args.github, args.org);
    orgVerified = verifyResult.verified;

    if (orgVerified) {
      console.log(`✓ GitHub org membership verified (public member)`);
    } else {
      console.warn(`  Membership unverified (${verifyResult.reason}) — you'll appear unverified on the org dashboard.`);
      console.warn(`  To get verified: go to github.com/orgs/${args.org}/people and set your membership to public.`);
    }
  } else {
    console.warn(`  Org membership not verified (no --github provided). Use --github to enable verification.`);
  }

  const orgResult = await claimOrg({
    username: args.username,
    token: result.token || stored?.token,
    orgSlug: args.org,
    orgVerified,
  });

  if (orgResult.error) {
    console.warn(`  Warning: Could not claim org — ${orgResult.error}`);
  } else {
    const badge = orgVerified ? '✓ verified' : '(unverified)';
    console.log(`✓ Joined org: ${args.org} ${badge}`);
    console.log(`  Team dashboard: https://buddyboard.dev/org/${args.org}`);
  }
}
```

### Updated `printSuccess`

```javascript
function printSuccess(username, org) {
  const viewUrl = `https://buddyboard.dev/u/${username}`;
  const cardUrl = `https://buddyboard.dev/card/${username}`;
  const orgUrl  = org ? `https://buddyboard.dev/org/${org}` : null;

  console.log(`
╭──────────────────────────────────────────────╮
│ ✓ Buddy submitted!                           │
│                                               │
│ View: ${viewUrl.padEnd(38)}│
│ Card: ${cardUrl.padEnd(38)}│${orgUrl ? `
│ Team: ${orgUrl.padEnd(38)}│` : ''}
│                                               │
│ Embed in your README:                         │
│ ![buddy](${cardUrl})       │
╰──────────────────────────────────────────────╯
`);
}
```

### Validation

```javascript
function validateOrgSlug(org) {
  if (!org) return null; // --org is optional
  if (org.length < 2 || org.length > 39) return 'Org slug must be 2-39 characters.';
  if (!/^[a-z0-9-]+$/.test(org)) return 'Org slug must be lowercase alphanumeric and hyphens only.';
  return null;
}
```

---

## Phase O-3: Web Routes

### New Pages

```
/org                        — list all non-unlisted orgs
/org/[orgname]              — org dashboard (team leaderboard, stats, achievements)
/compare-orgs/[org1]/[org2] — side-by-side org comparison
```

### Changes to Existing Pages

- `/` (home leaderboard) — add "Org" column showing org chip(s) for each buddy. Add org filter dropdown alongside existing species/rarity filters.
- `/u/[username]` (profile) — show org membership chips below buddy card. Each chip links to `/org/[orgname]`. Verified chip has a checkmark; unverified has a hollow dot.

### New Queries (`web/lib/queries.ts` additions)

```typescript
// Fetch all public orgs with member counts, sorted by member count desc
export async function getAllOrgs(): Promise<Org[]> {
  const { data, error } = await supabase
    .from('orgs_public')
    .select('*')
    .eq('unlisted', false)
    .order('member_count', { ascending: false });

  if (error || !data) return [];
  return data as Org[];
}

// Fetch a single org by slug
export async function getOrgBySlug(slug: string): Promise<Org | null> {
  const { data, error } = await supabase
    .from('orgs_public')
    .select('*')
    .eq('slug', slug.toLowerCase())
    .single();

  if (error || !data) return null;
  return data as Org;
}

// Fetch all buddies in an org, sorted by total_stats desc
export async function getOrgBuddies(orgSlug: string): Promise<(Buddy & { org_verified: boolean })[]> {
  // Join via buddy_orgs → buddies_public
  const { data, error } = await supabase
    .from('buddy_orgs')
    .select(`
      org_verified,
      joined_at,
      buddies_public (*)
    `)
    .eq('orgs.slug', orgSlug)  // requires a join through orgs table
    .order('total_stats', { foreignTable: 'buddies_public', ascending: false });

  // Note: this query may need to be written as an RPC or view for cleanliness.
  // See the "org_members" view below.
  if (error || !data) return [];
  return data.map((row: any) => ({ ...row.buddies_public, org_verified: row.org_verified }));
}

// Fetch orgs for a specific buddy (used on profile page)
export async function getBuddyOrgs(buddyId: string): Promise<Array<{ slug: string; display_name: string; org_verified: boolean }>> {
  const { data, error } = await supabase
    .from('buddy_orgs')
    .select('org_verified, orgs(slug, display_name)')
    .eq('buddy_id', buddyId)
    .order('joined_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => ({
    slug: row.orgs.slug,
    display_name: row.orgs.display_name,
    org_verified: row.org_verified,
  }));
}
```

### Recommended: `org_members` View

Because Supabase's PostgREST has limitations on multi-hop joins, create a view to simplify the org members query:

```sql
-- Migration: 003_add_orgs.sql (continued)

CREATE VIEW public.org_members AS
  SELECT
    o.slug        AS org_slug,
    bo.org_verified,
    bo.joined_at,
    bp.*
  FROM public.buddy_orgs bo
  JOIN public.orgs o ON o.id = bo.org_id
  JOIN public.buddies_public bp ON bp.id = bo.buddy_id;

GRANT SELECT ON public.org_members TO anon;
```

Then `getOrgBuddies` becomes:

```typescript
export async function getOrgBuddies(orgSlug: string): Promise<(Buddy & { org_verified: boolean })[]> {
  const { data, error } = await supabase
    .from('org_members')
    .select('*')
    .eq('org_slug', orgSlug.toLowerCase())
    .order('total_stats', { ascending: false });

  if (error || !data) return [];
  return data as (Buddy & { org_verified: boolean })[];
}
```

---

## Phase O-4: Org Dashboard Features (`/org/[orgname]`)

### Page Structure

```
/org/[orgname]
├── Header
│   ├── Org display name + slug (@anthropic)
│   ├── GitHub org link (if github_org is set)
│   ├── Description (if set)
│   └── Meta: X members · Y verified · joined [first_member_date]
│
├── Team Stats Bar (horizontal summary)
│   ├── Total members
│   ├── Combined power (sum of all total_stats)
│   ├── Average total stats
│   ├── Shiny count
│   └── Legendary count
│
├── Species Distribution
│   └── Grid showing which of the 18 species are represented
│       Each species shows count. Missing species shown dimmed.
│       "X / 18 species represented"
│
├── Rarity Distribution
│   └── Bar chart breakdown: common / uncommon / rare / epic / legendary
│
├── Team Leaderboard
│   └── All members sorted by total_stats desc
│       Columns: rank | buddy card (mini) | username | rarity | species | total stats | org_verified badge
│
└── Team Achievements (see below)
```

### Team Stats Computation

All computed client-side from the `org_members` result:

```typescript
function computeOrgStats(members: (Buddy & { org_verified: boolean })[]) {
  const speciesCounts = {} as Record<string, number>;
  const rarityCounts = {} as Record<string, number>;
  let combinedPower = 0;
  let shinies = 0;
  let legendaries = 0;
  let verifiedCount = 0;

  for (const m of members) {
    speciesCounts[m.species] = (speciesCounts[m.species] || 0) + 1;
    rarityCounts[m.rarity] = (rarityCounts[m.rarity] || 0) + 1;
    combinedPower += m.total_stats;
    if (m.shiny) shinies++;
    if (m.rarity === 'legendary') legendaries++;
    if (m.org_verified) verifiedCount++;
  }

  const avgPower = members.length > 0 ? Math.round(combinedPower / members.length) : 0;
  const speciesDiscovered = Object.keys(speciesCounts).length;

  return {
    memberCount: members.length,
    verifiedCount,
    combinedPower,
    avgPower,
    shinies,
    legendaries,
    speciesCounts,
    rarityCounts,
    speciesDiscovered,
    allSpeciesCovered: speciesDiscovered === 18,
  };
}
```

### Team Achievements

Achievements are computed from the org stats. Displayed as a horizontal chip row below the stats bar.

| Achievement | Condition |
|---|---|
| **Full Dex** | All 18 species represented |
| **Shiny Team** | At least 1 shiny member |
| **Legendary Guild** | At least 1 legendary member |
| **Power House** | Combined power > 1000 |
| **Verified Squad** | All members are GitHub-verified |
| **Century Club** | 100+ members |
| **Diverse Roster** | At least 12 different species |

Achievements are purely display-layer — no DB storage needed. They recompute on every page load from the member list.

### Caching / ISR

The org page should use Next.js ISR with `revalidate: 60` (1 minute). Org data changes rarely (only on new `npx buddy-board --org` runs), so aggressive caching is fine.

```typescript
// app/org/[orgname]/page.tsx
export const revalidate = 60;
```

---

## Phase O-5: Org vs Org Comparison (`/compare-orgs/[org1]/[org2]`)

### Page Structure

```
/compare-orgs/[org1]/[org2]

Two-column layout mirroring the existing /compare/[user1]/[user2] page.

Left column: org1 dashboard summary
Right column: org2 dashboard summary

Comparison points (side-by-side rows):
- Member count
- Verified member count
- Combined power
- Average power per member
- Shiny count
- Legendary count
- Species coverage (X/18 vs Y/18)
- Most common species
- Rarest buddy (highest rarity + total_stats)
- "Who would win?" — determined by combined power, with a fun summary line

Species overlap section:
- Species present in both orgs (shown as shared)
- Species unique to each org (shown in respective columns)

Shareable URL: the route itself is the share link.
```

### Query

```typescript
export async function getTwoOrgsDashboard(slug1: string, slug2: string) {
  const [org1, org2, members1, members2] = await Promise.all([
    getOrgBySlug(slug1),
    getOrgBySlug(slug2),
    getOrgBuddies(slug1),
    getOrgBuddies(slug2),
  ]);
  return { org1, org2, members1, members2 };
}
```

---

## Phase O-6: Global Leaderboard Changes

### Org Column

Add an `org` column to the leaderboard table. Each buddy row shows their org chip(s) (up to 2, then "+ N more" if they have more). Clicking an org chip navigates to `/org/[slug]`.

The column is hidden on mobile (< 768px) to avoid clutter.

### Org Filter

Add a new `filterOrg` parameter to `getLeaderboard`:

```typescript
export async function getLeaderboard(
  sortBy: SortField = 'total_stats',
  filterSpecies?: string,
  filterRarity?: string,
  filterOrg?: string,    // NEW
): Promise<Buddy[]> {
  if (filterOrg) {
    // Use org_members view — already filtered by org, just sort
    const { data, error } = await supabase
      .from('org_members')
      .select('*')
      .eq('org_slug', filterOrg.toLowerCase())
      .order('total_stats', { ascending: false })
      .limit(100);
    // ... apply species/rarity filters on top
  }
  // ... existing logic
}
```

The filter UI gets a new "Org" dropdown. Populated by a lightweight query for all non-unlisted org slugs.

---

## Phase O-7: Profile Page Changes (`/u/[username]`)

### Org Chips

Below the buddy card (and above the stats section), show a horizontal row of org chips:

```
Member of:  [✓ anthropic]  [· my-team]
```

- Verified chip: filled badge with checkmark (`✓ anthropic`)
- Unverified chip: outlined badge with hollow dot (`· my-team`)
- Each chip links to `/org/[slug]`
- If no orgs, section is hidden

### Query Change

`getBuddyByUsername` returns a `Buddy`. The profile page makes a second call to `getBuddyOrgs(buddy.id)` to get org membership. These can run in parallel.

---

## Phase O-8: Privacy Model

### Org Visibility Levels

| Level | Appears on `/org` list | Accessible via URL | Filterable on leaderboard |
|---|---|---|---|
| **public** (default) | Yes | Yes | Yes |
| **unlisted** | No | Yes | No |

No "fully private" orgs in v1. The anon Supabase key provides read access to all rows, so truly private orgs would require RLS changes and an auth system — out of scope.

### Member Privacy

- The `buddies_public` view excludes `secret_token`. There is no personally identifying information beyond what the user chose to submit (`username`, `github_username`, `github_bio`).
- Org membership is public knowledge by design — if you ran `npx buddy-board --org acme`, you chose to be listed.
- No way to remove org membership in v1 CLI (out of scope). Users can re-submit without `--org` but their existing `buddy_orgs` row persists. A `--remove-org` flag is a Phase O-9 future enhancement.

### `org_verified` vs User Privacy

`org_verified = false` does NOT mean the user is not a real member of the org. It only means the GitHub public membership API returned non-204 at submit time. This should be communicated clearly in the UI:

> "Unverified members may still be real org members — verification requires a public GitHub org membership."

---

## Edge Cases

### 1. User Changes Org

Re-running `npx buddy-board --username tanay --org new-org` adds `new-org` to the user's membership list. It does NOT remove the old org. This is intentional — leaving an org is a deliberate action, not an accidental one.

**Future:** `--remove-org acme` flag + `leave_org(p_username, p_token, p_org_slug)` RPC that deletes the `buddy_orgs` row.

### 2. User in Multiple Orgs

Supported at the data layer from day one. The CLI accepts one `--org` per invocation; users who want to join multiple orgs run the CLI multiple times:

```
npx buddy-board --username tanay --org anthropic
npx buddy-board --username tanay --org my-team
```

The profile page shows all orgs. The global leaderboard org filter is an OR query (shows buddy if they belong to the selected org, regardless of other orgs).

### 3. Org Name Squatting

**Risk:** A user claims `--org google` or `--org anthropic` as a fake/joke org before any real members join.

**Mitigation strategy:**
- Org slugs are not "registered" — they exist only if at least one buddy belongs to them. An empty org (no members) does not appear anywhere.
- GitHub verification provides weak protection: if a user claims `--org anthropic` but their GitHub membership check returns unverified, the org will appear with `0 verified members`. This is a visible signal of inauthenticity.
- The org leaderboard sorts by member count — small fake orgs naturally appear at the bottom of `/org`.
- No admin moderation system in v1. If squatting becomes a real problem, add a `blocked_slugs` table and a `claim_org` check against it.
- Future: require at least 2 verified members before an org appears on the public list.

### 4. Empty Orgs

An org with 0 members cannot exist — orgs are created in `claim_org` only when a user joins them. If all members leave (future `--remove-org`), the org row persists but `member_count = 0`. 

Options:
- Filter out orgs with `member_count = 0` in `orgs_public` view (simplest)
- Add a cleanup job (too complex for v1)

**Recommendation:** Add `WHERE member_count > 0` to the `orgs_public` view definition, or filter in `getAllOrgs()`.

### 5. Org Slug Collision with Existing Routes

The routes `/org/[orgname]` must not collide with any current or planned routes under `/org/`. Currently no conflicts. Reserved slugs to block in validation:

```javascript
const RESERVED_ORG_SLUGS = ['new', 'admin', 'api', 'compare', 'list', 'search'];
```

Add to `validateOrgSlug`:

```javascript
if (RESERVED_ORG_SLUGS.includes(org)) {
  return `Org slug '${org}' is reserved.`;
}
```

### 6. GitHub Org Does Not Exist on GitHub

If the user passes `--org my-fake-org` and we call the GitHub API, we get a 404 (org not found) which looks the same as "member not found." We can check if the org itself exists with `GET /orgs/{org}` (200 = exists, 404 = doesn't exist on GitHub) before checking membership:

```javascript
// Optional pre-check: does this org exist on GitHub?
const orgCheckRes = await fetch(`https://api.github.com/orgs/${encodeURIComponent(orgSlug)}`);
if (orgCheckRes.status === 404) {
  // Org doesn't exist on GitHub — skip membership check entirely
  return { verified: false, reason: 'org_not_on_github' };
}
```

This is informative but not blocking — users should be able to claim non-GitHub orgs (e.g., internal team names, fictional orgs).

### 7. Rate Limiting

The GitHub API unauthenticated rate limit is 60 requests/hour per IP. The CLI runs on a user's machine, so each user consumes from their own IP's limit. Two GitHub API calls per `npx buddy-board --org` run (org check + member check). Not a practical concern.

---

## Implementation Order

### O-1: Database (prerequisite for everything)
1. Write migration `003_add_orgs.sql`
2. Apply to Supabase (via dashboard SQL editor or CLI)
3. Verify `orgs_public`, `org_members` views work with test data

### O-2: CLI Changes
1. Add `verifyOrgMembership()` and `claimOrg()` to `submit.js`
2. Update `parseArgs`, `validateOrgSlug`, `printHelp`, `printSuccess` in `index.js`
3. Add org flow to `main()` after successful buddy submit
4. Test: `npx buddy-board --username test --org anthropic` end-to-end

### O-3: Profile Page (`/u/[username]`)
1. Add `getBuddyOrgs()` query
2. Render org chips on profile page
3. Lowest risk change — no new route, no layout changes

### O-4: Global Leaderboard Org Column + Filter
1. Update `getLeaderboard` to accept `filterOrg`
2. Add org chips to leaderboard rows
3. Add org dropdown to filter UI
4. Test filter interactions with existing species/rarity filters

### O-5: Org Dashboard (`/org/[orgname]`)
1. Scaffold `app/org/[orgname]/page.tsx`
2. Implement `getOrgBuddies()` using `org_members` view
3. Build stats computation (`computeOrgStats`)
4. Build achievement chips
5. Build species + rarity distribution grids
6. Build team leaderboard table (reuse leaderboard row component)

### O-6: Org List (`/org`)
1. Scaffold `app/org/page.tsx`
2. Implement `getAllOrgs()` query
3. Render org cards: display name, member count, verified count, species chips

### O-7: Org vs Org Comparison (`/compare-orgs/[org1]/[org2]`)
1. Scaffold `app/compare-orgs/[org1]/[org2]/page.tsx`
2. Implement `getTwoOrgsDashboard()` query
3. Build two-column comparison layout
4. Build species overlap section

---

## Files to Create / Modify

### New Files
- `/home/tanay/personal/buddy-board/supabase/migrations/003_add_orgs.sql`
- `/home/tanay/personal/buddy-board/web/app/org/page.tsx`
- `/home/tanay/personal/buddy-board/web/app/org/[orgname]/page.tsx`
- `/home/tanay/personal/buddy-board/web/app/compare-orgs/[org1]/[org2]/page.tsx`

### Modified Files
- `/home/tanay/personal/buddy-board/cli/submit.js` — add `verifyOrgMembership`, `claimOrg`
- `/home/tanay/personal/buddy-board/cli/index.js` — add `--org` flag, `handleOrg()`, updated help/success
- `/home/tanay/personal/buddy-board/web/lib/types.ts` — add `Org`, `BuddyOrg`, `BuddyWithOrgs`
- `/home/tanay/personal/buddy-board/web/lib/queries.ts` — add org queries
- `/home/tanay/personal/buddy-board/web/app/page.tsx` — org column + filter on leaderboard
- `/home/tanay/personal/buddy-board/web/app/u/[username]/page.tsx` — org chips on profile

---

## Open Questions

1. **Org display names:** Auto-created orgs use the slug as display name (e.g., `anthropic` → `Anthropic`?). Should we auto-titlecase the slug? Simple `slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())` would turn `my-team` → `My Team`. Probably fine.

2. **Should unlisted orgs be filterable on the global leaderboard?** Current recommendation: no. If unlisted, it's invisible everywhere except direct URL. This keeps the filter dropdown clean.

3. **Org avatars:** GitHub orgs have avatars. Should we fetch and store `github_org_avatar_url` in the `orgs` table? This would make the org list page visually richer. Requires an extra GitHub API call during `claim_org` RPC (or in the CLI before calling the RPC). Deferred to a later pass.

4. **`--remove-org` flag:** Intentionally out of scope for v1. Without it, org membership is permanent (until manually deleted from Supabase). This is acceptable for a first release.

5. **Org achievements in DB vs computed:** Currently all computed in-memory. If achievement state needs to trigger notifications or badges on profile pages, they'd need to be persisted. For v1, in-memory computation is fine.

---

## Sources Consulted

- [REST API endpoints for organization members — GitHub Docs](https://docs.github.com/en/rest/orgs/members)
- [REST API endpoints for organizations — GitHub Docs](https://docs.github.com/en/rest/orgs/orgs)
- [How GitHub Leverages Gamification to Boost Retention — Trophy](https://trophy.so/blog/github-gamification-case-study)
- [Unlocking Developer Motivation: GitHub gamification & devActivity](https://devactivity.com/pages/github-gamification/)
- [GitHub Leaderboard for projects and contributors (eugef)](https://github.com/eugef/github-leaderboard)
- [GitHub Leaderboard — rank people by org contributions (techx)](https://github.com/techx/github-leaderboard)
- [Oasis — PBML Gamification Platform](https://github.com/isuru89/oasis)
- [Shields.io](https://shields.io/)
- [How to build the ideal dev team dashboard — SquaredUp](https://squaredup.com/blog/how-to-build-engineering-dashboard/)
- [The Best Performance Dashboard for Teams — Spinify](https://spinify.com/blog/the-best-performance-dashboard-for-teams-boost-efficiency-and-results/)
