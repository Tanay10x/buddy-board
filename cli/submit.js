const SUPABASE_URL = process.env.BUDDY_BOARD_SUPABASE_URL || "https://szzwwuwtsmfeiuezqhvu.supabase.co";
const SUPABASE_ANON_KEY = process.env.BUDDY_BOARD_SUPABASE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6end3dXd0c21mZWl1ZXpxaHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTYzNTAsImV4cCI6MjA5MDc5MjM1MH0.miZIoydVgnrdM_0YZ-56181kFfTXu-8dr-fYSj-lwT0";

export async function verifyGithub(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (res.status !== 200) return { verified: false };
    const data = await res.json();
    return {
      verified: true,
      avatar_url: data.avatar_url || null,
      bio: data.bio || null,
      profile_url: data.html_url || null,
    };
  } catch {
    return { verified: false };
  }
}

export async function verifyOrgMembership(githubUsername, orgSlug) {
  if (!githubUsername) return { verified: false, reason: "no_github" };
  try {
    const res = await fetch(
      `https://api.github.com/orgs/${encodeURIComponent(orgSlug)}/public_members/${encodeURIComponent(githubUsername)}`,
      { headers: { "Accept": "application/vnd.github+json", "User-Agent": "buddy-board-cli" } }
    );
    if (res.status === 204) return { verified: true, reason: "public_member" };
    return { verified: false, reason: "not_public_member" };
  } catch {
    return { verified: false, reason: "network_error" };
  }
}

export async function claimOrg({ username, token, orgSlug, orgVerified }) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/claim_org`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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
      p_github_username: buddy.github_username || null,
      p_github_verified: buddy.github_verified || false,
      p_github_avatar_url: buddy.github_avatar_url || null,
      p_github_bio: buddy.github_bio || null,
      p_github_profile_url: buddy.github_profile_url || null,
      p_name: buddy.name,
      p_personality: buddy.personality,
      p_hatched_at: buddy.hatched_at,
      p_species: buddy.species,
      p_rarity: buddy.rarity,
      p_eye: buddy.eye,
      p_hat: buddy.hat,
      p_shiny: buddy.shiny,
      p_stats: buddy.stats,
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
