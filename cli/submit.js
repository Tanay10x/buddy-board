const SUPABASE_URL = process.env.BUDDY_BOARD_SUPABASE_URL || "https://YOUR_PROJECT.supabase.co";
const SUPABASE_ANON_KEY = process.env.BUDDY_BOARD_SUPABASE_KEY || "YOUR_ANON_KEY";

export async function verifyGithub(username) {
  try {
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    return res.status === 200;
  } catch {
    return false;
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
      p_github_username: buddy.github_username || null,
      p_github_verified: buddy.github_verified || false,
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
