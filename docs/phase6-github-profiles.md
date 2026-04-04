# Phase 6: GitHub Profile Integration

## Overview

Fetch real GitHub profile data (avatar, bio, profile URL) during CLI submission and surface it across the web UI: leaderboard avatars, profile page avatar, OG card footer, and an upgraded verification badge.

## Implementation Order

1. SQL migration (DB schema + RPC)
2. CLI changes (`cli/submit.js`, `cli/index.js`)
3. Web type update (`web/lib/types.ts`)
4. Web UI changes (LeaderboardRow, BuddyCard, profile page, OG card route)

Each step is independently testable. Do them in order since each depends on the previous.

---

## Step 1: SQL Migration

**File:** `supabase/migrations/002_github_profile_fields.sql`

```sql
-- Add GitHub profile columns
alter table public.buddies
  add column if not exists github_avatar_url text,
  add column if not exists github_bio       text,
  add column if not exists github_profile_url text;

-- Rebuild the public view to include the new columns
create or replace view public.buddies_public as
  select
    id, username,
    github_username, github_verified,
    github_avatar_url, github_bio, github_profile_url,
    name, personality, hatched_at, species, rarity, eye, hat, shiny,
    stats, total_stats, created_at, updated_at
  from public.buddies;

-- Update the RPC to accept and persist the new fields
create or replace function public.submit_buddy(
  p_username          text,
  p_name              text,
  p_personality       text,
  p_hatched_at        bigint,
  p_species           text,
  p_rarity            text,
  p_eye               text,
  p_hat               text,
  p_stats             jsonb,
  p_token             text    default null,
  p_github_username   text    default null,
  p_github_verified   boolean default false,
  p_github_avatar_url text    default null,
  p_github_bio        text    default null,
  p_github_profile_url text   default null,
  p_shiny             boolean default false
)
returns jsonb
language plpgsql
security definer
as $$
declare
  raw_token    text;
  hashed_token text;
  existing     record;
begin
  select * into existing from public.buddies where username = p_username;

  if existing is null then
    -- New submission: generate token
    raw_token    := encode(gen_random_bytes(32), 'hex');
    hashed_token := crypt(raw_token, gen_salt('bf'));

    insert into public.buddies (
      username, secret_token,
      github_username, github_verified, github_avatar_url, github_bio, github_profile_url,
      name, personality, hatched_at, species, rarity, eye, hat, shiny, stats
    ) values (
      p_username, hashed_token,
      p_github_username, p_github_verified, p_github_avatar_url, p_github_bio, p_github_profile_url,
      p_name, p_personality, p_hatched_at, p_species, p_rarity,
      p_eye, p_hat, p_shiny, p_stats
    );

    return jsonb_build_object('token', raw_token, 'created', true);

  else
    -- Existing: verify token
    if p_token is null or existing.secret_token != crypt(p_token, existing.secret_token) then
      raise exception 'invalid_token: Token does not match';
    end if;

    update public.buddies set
      github_username    = p_github_username,
      github_verified    = p_github_verified,
      github_avatar_url  = p_github_avatar_url,
      github_bio         = p_github_bio,
      github_profile_url = p_github_profile_url,
      name               = p_name,
      personality        = p_personality,
      hatched_at         = p_hatched_at,
      species            = p_species,
      rarity             = p_rarity,
      eye                = p_eye,
      hat                = p_hat,
      shiny              = p_shiny,
      stats              = p_stats,
      updated_at         = now()
    where username = p_username;

    return jsonb_build_object('updated', true);
  end if;
end;
$$;

-- Re-grant (create or replace revokes existing grants)
grant execute on function public.submit_buddy to anon;
grant select on public.buddies_public to anon;
```

**Why `create or replace view`:** Postgres requires dropping and recreating a view to add columns. `create or replace` handles that atomically without dropping dependent grants.

**Why re-grant after RPC:** `create or replace function` on an existing function revokes prior `EXECUTE` grants in some Postgres versions; re-granting is safe and idempotent.

---

## Step 2: CLI Changes

### 2a. `cli/submit.js` — fetch profile data, send to Supabase

The `verifyGithub` function currently discards the API response body. Change it to return a profile object (or `null` on failure). Add three new fields to the RPC payload.

**Full replacement of `cli/submit.js`:**

```js
const SUPABASE_URL = process.env.BUDDY_BOARD_SUPABASE_URL || "https://szzwwuwtsmfeiuezqhvu.supabase.co";
const SUPABASE_ANON_KEY = process.env.BUDDY_BOARD_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6end3dXd0c21mZWl1ZXpxaHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTYzNTAsImV4cCI6MjA5MDc5MjM1MH0.miZIoydVgnrdM_0YZ-56181kFfTXu-8dr-fYSj-lwT0";

/**
 * Verify a GitHub username exists and return profile data.
 * Returns { verified: true, avatarUrl, bio, profileUrl } on success,
 * or { verified: false } on failure.
 */
export async function verifyGithub(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
      headers: { "User-Agent": "buddy-board-cli/1.0" },
    });
    if (res.status !== 200) return { verified: false };
    const data = await res.json();
    return {
      verified: true,
      avatarUrl: data.avatar_url || null,
      bio: data.bio || null,
      profileUrl: data.html_url || null,
    };
  } catch {
    return { verified: false };
  }
}

export async function submitBuddy({ username, token, buddy }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_buddy`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      p_username: username,
      p_token: token || null,
      p_github_username:    buddy.github_username    || null,
      p_github_verified:    buddy.github_verified    || false,
      p_github_avatar_url:  buddy.github_avatar_url  || null,
      p_github_bio:         buddy.github_bio         || null,
      p_github_profile_url: buddy.github_profile_url || null,
      p_name:       buddy.name,
      p_personality: buddy.personality,
      p_hatched_at: buddy.hatched_at,
      p_species:    buddy.species,
      p_rarity:     buddy.rarity,
      p_eye:        buddy.eye,
      p_hat:        buddy.hat,
      p_shiny:      buddy.shiny,
      p_stats:      buddy.stats,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.message?.includes("username_taken")) {
      return { error: `Username '${username}' is taken. Try another.` };
    }
    if (err.message?.includes("invalid_token")) {
      return { error: "Invalid token. You can only update from the machine that first submitted." };
    }
    return { error: err.message || `Server error: ${res.status}` };
  }

  const data = await res.json();
  return { token: data.token, success: true };
}
```

**Key changes:**
- `verifyGithub` now adds a `User-Agent` header (GitHub API requires one for unauthenticated requests, or it returns 403).
- Returns a structured object instead of a bare boolean.
- `submitBuddy` accepts `github_avatar_url`, `github_bio`, `github_profile_url` on the `buddy` arg and passes them as RPC params.

### 2b. `cli/index.js` — consume the new profile object

In the `main()` function, change the GitHub verification block and buddy object construction.

**Diff-style description of what changes:**

Replace lines 93–98 (the GitHub verification block):

```js
// BEFORE
let githubVerified = false;
if (args.github) {
  console.log(`Verifying GitHub user @${args.github}...`);
  githubVerified = await verifyGithub(args.github);
  if (!githubVerified) {
    console.warn(`Warning: GitHub user '${args.github}' not found. Continuing without verification.`);
  }
}
```

```js
// AFTER
let githubVerified = false;
let githubAvatarUrl = null;
let githubBio = null;
let githubProfileUrl = null;

if (args.github) {
  console.log(`Verifying GitHub user @${args.github}...`);
  const ghResult = await verifyGithub(args.github);
  githubVerified  = ghResult.verified;
  githubAvatarUrl  = ghResult.avatarUrl  ?? null;
  githubBio        = ghResult.bio        ?? null;
  githubProfileUrl = ghResult.profileUrl ?? null;
  if (!githubVerified) {
    console.warn(`Warning: GitHub user '${args.github}' not found. Continuing without verification.`);
  }
}
```

Replace lines 107–119 (the buddy object literal):

```js
// BEFORE
const buddy = {
  name: config.companion.name,
  personality: config.companion.personality,
  hatched_at: config.companion.hatchedAt,
  species: bones.species,
  rarity: bones.rarity,
  eye: bones.eye,
  hat: bones.hat,
  shiny: bones.shiny,
  stats: bones.stats,
  github_username: args.github || null,
  github_verified: githubVerified,
};
```

```js
// AFTER
const buddy = {
  name:        config.companion.name,
  personality: config.companion.personality,
  hatched_at:  config.companion.hatchedAt,
  species:     bones.species,
  rarity:      bones.rarity,
  eye:         bones.eye,
  hat:         bones.hat,
  shiny:       bones.shiny,
  stats:       bones.stats,
  github_username:    args.github || null,
  github_verified:    githubVerified,
  github_avatar_url:  githubAvatarUrl,
  github_bio:         githubBio,
  github_profile_url: githubProfileUrl,
};
```

**Full replacement of `cli/index.js`** (incorporating both changes above):

```js
#!/usr/bin/env node

import { readClaudeConfig, readBuddyBoardToken, saveBuddyBoardToken } from "./config.js";
import { roll } from "./roll.js";
import { submitBuddy, verifyGithub } from "./submit.js";

const SITE_URL = "https://buddyboard.dev";

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--username" && args[i + 1]) {
      result.username = args[i + 1].toLowerCase();
      i++;
    } else if (args[i] === "--github" && args[i + 1]) {
      result.github = args[i + 1];
      i++;
    } else if (args[i] === "--help" || args[i] === "-h") {
      result.help = true;
    }
  }
  return result;
}

function printHelp() {
  console.log(`
buddy-board — Submit your Claude Code buddy to the leaderboard

Usage:
  npx buddy-board --username <name>
  npx buddy-board --username <name> --github <github-user>

Options:
  --username  Your unique leaderboard username (3-20 chars, a-z, 0-9, hyphens)
  --github    Your GitHub username (optional, adds a verified badge + avatar)
  --help      Show this help message
`);
}

function validateUsername(username) {
  if (!username) return "Username is required. Use --username <name>";
  if (username.length < 3 || username.length > 20)
    return "Username must be 3-20 characters.";
  if (!/^[a-z0-9-]+$/.test(username))
    return "Username must be lowercase alphanumeric and hyphens only.";
  return null;
}

function printSuccess(username) {
  const viewUrl = `${SITE_URL}/u/${username}`;
  const cardUrl = `${SITE_URL}/card/${username}`;
  console.log(`
╭──────────────────────────────────────────────╮
│ ✓ Buddy submitted!                           │
│                                               │
│ View: ${viewUrl.padEnd(38)}│
│ Card: ${cardUrl.padEnd(38)}│
│                                               │
│ Embed in your README:                         │
│ ![buddy](${cardUrl})       │
╰──────────────────────────────────────────────╯
`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  const usernameError = validateUsername(args.username);
  if (usernameError) {
    console.error(`Error: ${usernameError}`);
    process.exit(1);
  }

  // 1. Read Claude config
  console.log("Reading Claude Code config...");
  const config = readClaudeConfig();
  if (config.error) {
    console.error(`Error: ${config.error}`);
    process.exit(1);
  }

  // 2. Compute bones
  console.log("Computing buddy data...");
  const { bones } = roll(config.userId);

  // 3. Verify GitHub (optional) — fetch avatar, bio, profile URL
  let githubVerified   = false;
  let githubAvatarUrl  = null;
  let githubBio        = null;
  let githubProfileUrl = null;

  if (args.github) {
    console.log(`Verifying GitHub user @${args.github}...`);
    const ghResult   = await verifyGithub(args.github);
    githubVerified   = ghResult.verified;
    githubAvatarUrl  = ghResult.avatarUrl  ?? null;
    githubBio        = ghResult.bio        ?? null;
    githubProfileUrl = ghResult.profileUrl ?? null;
    if (!githubVerified) {
      console.warn(`Warning: GitHub user '${args.github}' not found. Continuing without verification.`);
    }
  }

  // 4. Check for existing token
  const stored = readBuddyBoardToken();
  const token  = stored?.username === args.username ? stored.token : null;

  // 5. Submit
  console.log("Submitting to Buddy Board...");
  const buddy = {
    name:        config.companion.name,
    personality: config.companion.personality,
    hatched_at:  config.companion.hatchedAt,
    species:     bones.species,
    rarity:      bones.rarity,
    eye:         bones.eye,
    hat:         bones.hat,
    shiny:       bones.shiny,
    stats:       bones.stats,
    github_username:    args.github || null,
    github_verified:    githubVerified,
    github_avatar_url:  githubAvatarUrl,
    github_bio:         githubBio,
    github_profile_url: githubProfileUrl,
  };

  const result = await submitBuddy({ username: args.username, token, buddy });

  if (result.error) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  // 6. Save token (only on first submit)
  if (result.token) {
    saveBuddyBoardToken({
      username: args.username,
      token:    result.token,
      api:      "https://buddyboard.dev",
    });
  }

  printSuccess(args.username);
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
```

---

## Step 3: Web Type Update

**File:** `web/lib/types.ts`

Add three optional fields to the `Buddy` type. They are nullable because existing rows will have `null` until re-submitted, and users who don't use `--github` will always have `null`.

```ts
export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type Species =
  | "duck" | "goose" | "blob" | "cat" | "dragon" | "octopus" | "owl"
  | "penguin" | "turtle" | "snail" | "ghost" | "axolotl" | "capybara"
  | "cactus" | "robot" | "rabbit" | "mushroom" | "chonk";

export type Eye = "·" | "✦" | "×" | "◉" | "@" | "°";

export type Hat = "none" | "crown" | "tophat" | "propeller" | "halo" | "wizard" | "beanie" | "tinyduck";

export type StatName = "DEBUGGING" | "PATIENCE" | "CHAOS" | "WISDOM" | "SNARK";

export type Buddy = {
  id: string;
  username: string;
  github_username:    string | null;
  github_verified:    boolean;
  github_avatar_url:  string | null;   // NEW
  github_bio:         string | null;   // NEW
  github_profile_url: string | null;   // NEW
  name: string;
  personality: string;
  hatched_at: number;
  species: Species;
  rarity: Rarity;
  eye: Eye;
  hat: Hat;
  shiny: boolean;
  stats: Record<StatName, number>;
  total_stats: number;
  created_at: string;
  updated_at: string;
};
```

---

## Step 4: Web UI Changes

### 4a. `web/components/LeaderboardRow.tsx` — real avatar image

When `github_avatar_url` is present, render a circular `<img>` instead of the letter-initial `<div>`. Fall back to the existing letter circle when no avatar is available.

Use a standard `<img>` tag (not `next/image`) here because this is an OG/leaderboard row where `next/image` would require a configured remote domain and adds unnecessary complexity. The avatar is already sized correctly at 28×28px by GitHub's CDN (append `?s=56` for 2x).

```tsx
"use client";

import Link from "next/link";
import { RARITY_COLORS, RARITY_STARS } from "@/lib/constants";
import type { Buddy } from "@/lib/types";

export function LeaderboardRow({ buddy, rank }: { buddy: Buddy; rank: number }) {
  const rarityColor = RARITY_COLORS[buddy.rarity];

  return (
    <tr
      className="transition-colors duration-150"
      style={{ borderBottom: "1px solid #1f1f1f" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#2a2a2a"; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      {/* Rank */}
      <td className="py-3 px-2 sm:px-4 w-10 sm:w-12 text-right font-mono text-xs" style={{ color: "#6b7280" }}>
        {rank}
      </td>

      {/* User cell: avatar + username + badges */}
      <td className="py-3 px-2 sm:px-4">
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Avatar: real GitHub photo or letter-initial fallback */}
          {buddy.github_avatar_url ? (
            <img
              src={`${buddy.github_avatar_url}&s=56`}
              alt={buddy.github_username ?? buddy.username}
              width={28}
              height={28}
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full shrink-0 object-cover"
              style={{ border: `1px solid ${rarityColor}` }}
            />
          ) : (
            <div
              className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold font-mono"
              style={{ backgroundColor: "#242424", border: "1px solid #2e2e2e", color: "#9ca3af" }}
            >
              {buddy.username[0].toUpperCase()}
            </div>
          )}

          <div className="flex items-center gap-1.5 min-w-0">
            <Link
              href={`/u/${buddy.username}`}
              className="font-mono text-xs sm:text-sm truncate transition-colors duration-150"
              style={{ color: "#e5e7eb" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#4ade80"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#e5e7eb"; }}
            >
              {buddy.username}
            </Link>
            {buddy.github_verified && (
              <span
                className="inline-flex items-center gap-0.5 text-xs font-bold shrink-0"
                style={{ color: "#4ade80" }}
                title={`GitHub: @${buddy.github_username}`}
              >
                {/* GitHub mark SVG */}
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
                    0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
                    -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
                    2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
                    0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21
                    2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04
                    2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82
                    2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0
                    1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0
                    0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                <span>Verified</span>
              </span>
            )}
            {buddy.shiny && (
              <span className="text-xs shrink-0" title="Shiny">
                ✨
              </span>
            )}
          </div>
        </div>
      </td>

      {/* Buddy name — hidden on small mobile */}
      <td className="py-3 px-2 sm:px-4 font-mono text-sm hidden sm:table-cell" style={{ color: "#9ca3af" }}>
        {buddy.name}
      </td>

      {/* Species colored by rarity — hidden on small mobile */}
      <td className="py-3 px-2 sm:px-4 hidden sm:table-cell">
        <span
          className="font-mono text-sm capitalize"
          style={{ color: rarityColor }}
        >
          {buddy.species}
        </span>
      </td>

      {/* Rarity stars colored by rarity */}
      <td className="py-3 px-2 sm:px-4">
        <span
          className="font-mono text-xs"
          style={{ color: rarityColor }}
          title={buddy.rarity}
        >
          {RARITY_STARS[buddy.rarity]}
        </span>
      </td>

      {/* Total stat bold mono */}
      <td className="py-3 px-2 sm:px-4 text-right font-mono text-sm font-bold" style={{ color: "#e5e7eb" }}>
        {buddy.total_stats}
      </td>

      {/* Individual stats — hidden below lg */}
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell" style={{ color: "#6b7280" }}>
        {buddy.stats.DEBUGGING}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell" style={{ color: "#6b7280" }}>
        {buddy.stats.PATIENCE}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell" style={{ color: "#6b7280" }}>
        {buddy.stats.CHAOS}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell" style={{ color: "#6b7280" }}>
        {buddy.stats.WISDOM}
      </td>
      <td className="py-3 px-4 font-mono text-xs text-right hidden lg:table-cell" style={{ color: "#6b7280" }}>
        {buddy.stats.SNARK}
      </td>
    </tr>
  );
}
```

**Key changes from current:**
- Avatar cell: conditional `<img>` vs letter `<div>`. When GitHub avatar exists, border color is set to `rarityColor` to give the rarity-colored border ring.
- GitHub verified badge: old `✓` glyph replaced with the GitHub Invertocat SVG (16×16 viewBox, rendered at 11×11) + "Verified" text, matching the existing green `#4ade80` color. `title` now shows the GitHub handle.

### 4b. `web/components/BuddyCard.tsx` — upgraded GitHub badge in footer

The footer already shows `✓ GitHub`. Upgrade it to the SVG icon + "Verified" text, matching the leaderboard treatment. No avatar in the card itself (the sprite occupies that space and the card is constrained width).

Change the `github_verified` block inside the footer `<div>`:

```tsx
// BEFORE
{buddy.github_verified && (
  <span
    className="inline-flex items-center gap-0.5 text-xs font-bold"
    style={{ color: "#4ade80" }}
    title="GitHub Verified"
  >
    <span>✓</span>
    <span>GitHub</span>
  </span>
)}
```

```tsx
// AFTER
{buddy.github_verified && (
  <a
    href={buddy.github_profile_url ?? `https://github.com/${buddy.github_username}`}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-0.5 text-xs font-bold transition-opacity duration-150 hover:opacity-75"
    style={{ color: "#4ade80" }}
    title={`GitHub: @${buddy.github_username}`}
  >
    <svg
      width="11"
      height="11"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
        -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87
        2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95
        0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21
        2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04
        2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82
        2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0
        1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0
        0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
    <span>Verified</span>
  </a>
)}
```

The badge is now a link to the GitHub profile. It wraps to an `<a>` tag with `target="_blank"`. `hover:opacity-75` adds a subtle interactive cue without changing color.

### 4c. `web/app/u/[username]/page.tsx` — GitHub avatar on profile page

Add a GitHub avatar above (or beside) the buddy card when `github_avatar_url` is present. The avatar gets a rarity-colored ring border and links out to GitHub.

Insert a new block just above `<BuddyCard buddy={buddy} />`. The profile page is a Server Component (`revalidate = 300`), so no client-side state needed.

```tsx
// AFTER the existing imports, no new imports needed

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);
  if (!buddy) notFound();

  const rank = await getBuddyRank(username);
  const cardUrl    = `https://buddyboard.dev/card/${username}`;
  const profileUrl = `https://buddyboard.dev/u/${username}`;

  // Rarity border color (mirrors BuddyCard logic)
  const rarityBorderColors: Record<string, string> = {
    common:    "#9ca3af",
    uncommon:  "#22c55e",
    rare:      "#3b82f6",
    epic:      "#a855f7",
    legendary: "#eab308",
  };
  const rarityBorder = rarityBorderColors[buddy.rarity] ?? "#9ca3af";

  return (
    <div className="max-w-2xl mx-auto">
      {/* ── GitHub profile avatar (when available) ───────── */}
      {buddy.github_avatar_url && (
        <div className="flex flex-col items-center gap-2 mb-5 sm:mb-6">
          <a
            href={buddy.github_profile_url ?? `https://github.com/${buddy.github_username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-full transition-opacity duration-150 hover:opacity-80"
            style={{
              padding: "3px",
              background: rarityBorder,
            }}
          >
            <img
              src={`${buddy.github_avatar_url}&s=128`}
              alt={`@${buddy.github_username}`}
              width={64}
              height={64}
              className="rounded-full block"
              style={{ width: "64px", height: "64px", objectFit: "cover" }}
            />
          </a>
          {buddy.github_bio && (
            <p className="text-xs text-center max-w-xs italic" style={{ color: "#9ca3af" }}>
              {buddy.github_bio}
            </p>
          )}
        </div>
      )}

      {/* ── Buddy Card ───────────────────────────────────── */}
      <div className="flex justify-center">
        <BuddyCard buddy={buddy} />
      </div>

      {/* ── Rankings ─────────────────────────────────────── */}
      <div className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {/* Overall rank */}
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

        {/* Per-stat ranks */}
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

      {/* ── Share ────────────────────────────────────────── */}
      <div className="mt-8 sm:mt-10 space-y-3 sm:space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#6b7280" }}>
          Share
        </h3>

        <div
          className="rounded-lg p-3 sm:p-4"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <label className="block font-sans text-xs mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>
            Embed in README
          </label>
          <code className="font-mono text-xs break-all leading-relaxed block" style={{ color: "#4ade80" }}>
            [![buddy]({cardUrl})]({profileUrl})
          </code>
        </div>

        <div
          className="rounded-lg p-3 sm:p-4"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #2e2e2e" }}
        >
          <label className="block font-sans text-xs mb-2 uppercase tracking-wider" style={{ color: "#6b7280" }}>
            Share link
          </label>
          <code className="font-mono text-xs break-all block" style={{ color: "#4ade80" }}>
            {profileUrl}
          </code>
        </div>
      </div>
    </div>
  );
}
```

**Design notes:**
- The avatar ring uses a 3px padding `div` with `background: rarityBorder`, making the avatar appear to have a colored border that matches the buddy card's rarity border. This avoids `outline` (not rounded-full friendly) and `box-shadow` (inconsistent across browsers in OG context).
- 64×64px rendered size, requesting `?s=128` for retina displays (GitHub serves resized PNGs via CDN query param).
- Bio is shown below the avatar in italic gray, truncated naturally by the container width. No hard truncation in the plan — if bios are very long in practice, a `line-clamp-2` Tailwind class can be added.

### 4d. `web/app/card/[username]/route.tsx` — GitHub avatar in OG card footer

The OG card uses `next/og`'s `ImageResponse` with inline JSX styles. Fetching an external image URL inside `ImageResponse` requires passing it as a data URL or using `fetch` to get the bytes. The cleanest approach: fetch the avatar as an ArrayBuffer and embed it as a `src` on an `<img>` element — `ImageResponse` supports standard `img` tags with URL `src` when the runtime is `nodejs`.

Add a helper `loadGithubAvatar` and insert a small avatar circle in the OG footer.

**Full replacement of `web/app/card/[username]/route.tsx`:**

```tsx
import { ImageResponse } from "next/og";
import { getBuddyByUsername } from "@/lib/queries";
import { renderSprite } from "@/lib/sprites";
import { RARITY_COLORS, RARITY_STARS, STAT_NAMES } from "@/lib/constants";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

async function loadFont(): Promise<ArrayBuffer> {
  const fontPath = join(process.cwd(), "public", "fonts", "JetBrainsMono-Regular.ttf");
  const buffer = await readFile(fontPath);
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

/**
 * Fetch a GitHub avatar and return it as a base64 data URL so ImageResponse
 * can embed it without cross-origin issues. Returns null on any failure.
 */
async function loadGithubAvatarDataUrl(avatarUrl: string): Promise<string | null> {
  try {
    const res = await fetch(`${avatarUrl}&s=64`, {
      headers: { "User-Agent": "buddy-board/1.0" },
    });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const mime = res.headers.get("content-type") ?? "image/png";
    return `data:${mime};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const buddy = await getBuddyByUsername(username);

  if (!buddy) {
    return new Response("Not found", { status: 404 });
  }

  const [font, avatarDataUrl] = await Promise.all([
    loadFont(),
    buddy.github_avatar_url ? loadGithubAvatarDataUrl(buddy.github_avatar_url) : Promise.resolve(null),
  ]);

  const sprite      = renderSprite(buddy.species, buddy.eye, buddy.hat);
  const borderColor = RARITY_COLORS[buddy.rarity];
  const stars       = RARITY_STARS[buddy.rarity];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "600px",
          height: "340px",
          backgroundColor: "#0c0c0c",
          border: `3px solid ${borderColor}`,
          borderRadius: "12px",
          padding: "20px 24px",
          fontFamily: "JetBrains Mono",
          color: "#e5e7eb",
          boxSizing: "border-box",
        }}
      >
        {/* ── Header ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "14px",
            paddingBottom: "10px",
            borderBottom: `1px solid #1f1f1f`,
          }}
        >
          <span style={{ color: borderColor, fontSize: "13px", fontWeight: "bold", letterSpacing: "0.05em" }}>
            {stars} {buddy.rarity.toUpperCase()}
          </span>
          <span style={{ color: "#6b7280", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {buddy.species}
            {buddy.shiny ? " ✦ SHINY" : ""}
          </span>
        </div>

        {/* ── Body: sprite + name/personality ─────────────── */}
        <div style={{ display: "flex", gap: "20px", marginBottom: "14px", flex: "1 0 auto" }}>
          {/* Sprite */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#1a1a1a",
              borderRadius: "8px",
              padding: "10px 12px",
              border: `1px solid #2e2e2e`,
            }}
          >
            <pre
              style={{
                fontSize: "10.5px",
                lineHeight: "1.25",
                color: "#4ade80",
                margin: 0,
                whiteSpace: "pre",
              }}
            >
              {sprite.join("\n")}
            </pre>
          </div>

          {/* Name + personality */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#e5e7eb",
                marginBottom: "6px",
                letterSpacing: "-0.01em",
              }}
            >
              {buddy.name}
            </span>
            <span
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                fontStyle: "italic",
                lineHeight: "1.45",
                maxWidth: "280px",
              }}
            >
              &quot;{buddy.personality.slice(0, 110)}{buddy.personality.length > 110 ? "…" : ""}&quot;
            </span>
          </div>
        </div>

        {/* ── Stat bars ────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "12px" }}>
          {STAT_NAMES.map((stat) => {
            const value = buddy.stats[stat];
            const pct   = (value / 100) * 100;
            return (
              <div key={stat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
                <span style={{ width: "76px", color: "#9ca3af", fontSize: "10px", letterSpacing: "0.05em" }}>
                  {stat}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: "6px",
                    backgroundColor: "#1a1a1a",
                    borderRadius: "3px",
                    display: "flex",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      backgroundColor: borderColor,
                      borderRadius: "3px",
                    }}
                  />
                </div>
                <span style={{ width: "26px", textAlign: "right", color: "#e5e7eb", fontSize: "11px" }}>
                  {value}
                </span>
              </div>
            );
          })}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "8px",
            borderTop: "1px solid #1f1f1f",
            fontSize: "10px",
          }}
        >
          {/* Left: username + optional avatar + GitHub handle */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            {avatarDataUrl && (
              <img
                src={avatarDataUrl}
                width={20}
                height={20}
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: `1px solid ${borderColor}`,
                  objectFit: "cover",
                }}
              />
            )}
            <span style={{ color: "#9ca3af" }}>
              @{buddy.username}
              {buddy.github_verified && buddy.github_username ? (
                <span style={{ color: "#4ade80", marginLeft: "6px" }}>
                  ✓ @{buddy.github_username}
                </span>
              ) : null}
            </span>
          </div>
          <span style={{ color: "#6b7280", letterSpacing: "0.04em" }}>buddyboard.dev</span>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 340,
      fonts: [
        {
          name: "JetBrains Mono",
          data: font,
          style: "normal",
          weight: 400,
        },
      ],
      headers: {
        "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      },
    },
  );
}
```

**Key changes from current:**
- `loadGithubAvatarDataUrl`: fetches the avatar and converts to a base64 data URL. This sidesteps `ImageResponse`'s restriction on cross-origin `img` `src` values in some environments. `Buffer.from()` is available because `runtime = "nodejs"`.
- `Promise.all([loadFont(), loadGithubAvatarDataUrl(...)])`: loads font and avatar in parallel to avoid adding latency.
- Footer: avatar rendered as a 20×20 circular `<img>` with a rarity-colored border ring. Username line updated to show `✓ @github_username` when verified (shows the GitHub handle, not just "GitHub").
- When no avatar, footer is identical to current behavior.

---

## Commit Messages

Apply commits in this order:

```
feat(db): add github profile columns and update submit_buddy RPC

  - Add github_avatar_url, github_bio, github_profile_url to buddies table
  - Rebuild buddies_public view to expose new columns
  - Update submit_buddy() to accept and persist new params
  - Re-grant anon permissions after create or replace

  Migration: supabase/migrations/002_github_profile_fields.sql
```

```
feat(cli): fetch and submit GitHub avatar, bio, and profile URL

  - verifyGithub() now returns { verified, avatarUrl, bio, profileUrl }
    instead of a bare boolean; adds User-Agent header for GitHub API
  - index.js captures new fields from verifyGithub result
  - submitBuddy() payload includes p_github_avatar_url, p_github_bio,
    p_github_profile_url
```

```
feat(web): add github profile fields to Buddy type
```

```
feat(web): use real GitHub avatar in leaderboard rows

  - Shows circular avatar photo when github_avatar_url is present
  - Falls back to letter-initial circle for unverified/no-github rows
  - Avatar border uses rarity color
  - GitHub verified badge upgraded from plain ✓ glyph to GitHub SVG
    icon + "Verified" text
```

```
feat(web): upgrade GitHub verified badge in BuddyCard to SVG icon

  - Replaces "✓ GitHub" text with GitHub Invertocat SVG + "Verified"
  - Badge is now a link to the user's GitHub profile
```

```
feat(web): show GitHub avatar and bio on profile page

  - Renders 64x64 avatar with rarity-colored ring above BuddyCard
  - Links to GitHub profile
  - Shows bio text when present
```

```
feat(web): embed GitHub avatar in OG card footer

  - Fetches avatar as base64 data URL for ImageResponse compatibility
  - Renders 20x20 circular avatar with rarity-colored border
  - Shows ✓ @github_username in footer when verified
  - Font and avatar loads run in parallel
```

---

## Notes and Edge Cases

**GitHub API rate limiting:** The `verifyGithub` call is unauthenticated and subject to 60 req/hr per IP. This is fine for a CLI tool. If abuse becomes an issue, a `GITHUB_TOKEN` env var could be added to increase the limit to 5000 req/hr.

**Null safety throughout:** All three new fields are `| null` in the TypeScript type and `default null` in SQL. Every UI conditional checks for truthiness before rendering. Existing rows with `null` values degrade gracefully to the current UI (letter avatars, no avatar in OG card, etc.).

**Avatar URL format:** GitHub avatar URLs follow the pattern `https://avatars.githubusercontent.com/u/<id>?v=4`. Appending `&s=N` requests a specific pixel size. The plan uses `&s=56` (leaderboard, 2x for 28px display), `&s=128` (profile page, 2x for 64px display), and `&s=64` (OG card, converted to data URL at 32px display size — the OG card is static so exact pixel density matters less).

**OG card caching:** The OG card already sets `Cache-Control: public, max-age=3600`. Avatar fetching happens on each cache-miss render. Since avatars rarely change, this is acceptable. If a user updates their GitHub avatar, the new one will appear within an hour.

**`buddies_public` view and anon grants:** Supabase's Row Level Security is on the underlying `buddies` table, not the view. The `grant select on public.buddies_public to anon` in the migration re-confirms the view grant. The view does not expose `secret_token`.

**No data backfill needed:** Existing rows will have `null` for the three new columns. The UI handles this via fallbacks. Users who want their avatar to appear must re-run the CLI with `--github`.
