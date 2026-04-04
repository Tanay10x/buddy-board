#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { readClaudeConfig, readBuddyBoardToken, saveBuddyBoardToken } from "./config.js";
import { roll } from "./roll.js";
import { submitBuddy, verifyGithub, verifyOrgMembership, claimOrg } from "./submit.js";

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
    } else if (args[i] === "--org" && args[i + 1]) {
      result.org = args[i + 1].toLowerCase();
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
  npx buddy-board                     Interactive mode (recommended)
  npx buddy-board --username <name>   With flags

Options:
  --username  Your unique leaderboard username (3-20 chars, a-z, 0-9, hyphens)
  --github    Your GitHub username (optional, adds verified badge + avatar)
  --org       Organization slug to join (optional, links to a team dashboard)
  --help      Show this help message
`);
}

function validateUsername(username) {
  if (!username) return "Username is required.";
  if (username.length < 3 || username.length > 20)
    return "Username must be 3-20 characters.";
  if (!/^[a-z0-9-]+$/.test(username))
    return "Username must be lowercase alphanumeric and hyphens only.";
  return null;
}

function printSuccess(username, org) {
  const viewUrl = `${SITE_URL}/u/${username}`;
  const cardUrl = `${SITE_URL}/card/${username}`;
  const teamUrl = org ? `${SITE_URL}/org/${org}` : null;
  console.log(`
╭──────────────────────────────────────────────╮
│ ✓ Buddy submitted!                           │
│                                               │
│ View: ${viewUrl.padEnd(38)}│
│ Card: ${cardUrl.padEnd(38)}│${teamUrl ? `
│ Team: ${teamUrl.padEnd(38)}│` : ""}
│                                               │
│ Embed in your README:                         │
│ ![buddy](${cardUrl})       │
╰──────────────────────────────────────────────╯
`);
}

async function interactivePrompt() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(`
╭──────────────────────────────────────────────╮
│  🎮 Welcome to Buddy Board!                  │
│  Let's submit your buddy to the leaderboard. │
╰──────────────────────────────────────────────╯
`);

  // Username (required)
  let username = "";
  while (true) {
    const answer = await rl.question("  Username (3-20 chars, lowercase): ");
    username = answer.trim().toLowerCase();
    const err = validateUsername(username);
    if (err) {
      console.log(`  ⚠ ${err} Try again.`);
    } else {
      break;
    }
  }

  // GitHub (optional)
  const githubAnswer = await rl.question("  GitHub username (optional, press Enter to skip): ");
  const github = githubAnswer.trim() || null;

  // Org (optional)
  const orgAnswer = await rl.question("  Organization (optional, press Enter to skip): ");
  const org = orgAnswer.trim().toLowerCase() || null;

  rl.close();
  console.log("");

  return { username, github, org };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    process.exit(0);
  }

  // If no --username flag, run interactive mode
  if (!args.username) {
    const interactive = await interactivePrompt();
    args.username = interactive.username;
    args.github = interactive.github;
    args.org = interactive.org;
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

  // 3. Verify GitHub (optional)
  let githubVerified = false;
  let githubAvatarUrl = null;
  let githubBio = null;
  let githubProfileUrl = null;
  if (args.github) {
    console.log(`Verifying GitHub user @${args.github}...`);
    const ghResult = await verifyGithub(args.github);
    githubVerified = ghResult.verified;
    if (githubVerified) {
      githubAvatarUrl = ghResult.avatar_url;
      githubBio = ghResult.bio;
      githubProfileUrl = ghResult.profile_url;
    } else {
      console.warn(`Warning: GitHub user '${args.github}' not found. Continuing without verification.`);
    }
  }

  // 4. Check for existing token
  const stored = readBuddyBoardToken();
  const token = stored?.username === args.username ? stored.token : null;

  // 5. Submit
  console.log("Submitting to Buddy Board...");
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
    github_avatar_url: githubAvatarUrl,
    github_bio: githubBio,
    github_profile_url: githubProfileUrl,
  };

  const result = await submitBuddy({
    username: args.username,
    token,
    buddy,
  });

  if (result.error) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  // 6. Save token (only on first submit)
  const savedToken = result.token || token;
  if (result.token) {
    saveBuddyBoardToken({
      username: args.username,
      token: result.token,
      api: "https://buddyboard.dev",
    });
  }

  // 7. Claim org membership (if org was provided)
  if (args.org) {
    let orgVerified = false;

    if (args.github && githubVerified) {
      console.log(`Verifying GitHub org membership (@${args.github} in ${args.org})...`);
      const orgCheck = await verifyOrgMembership(args.github, args.org);
      orgVerified = orgCheck.verified;
      if (orgVerified) {
        console.log(`GitHub org membership verified.`);
      } else {
        console.log(`Note: Org membership unverified (${orgCheck.reason}). Joining as unverified.`);
      }
    }

    console.log(`Joining org '${args.org}'...`);
    const orgResult = await claimOrg({
      username: args.username,
      token: savedToken,
      orgSlug: args.org,
      orgVerified,
    });

    if (orgResult.error) {
      console.warn(`Warning: Could not join org: ${orgResult.error}`);
    } else {
      console.log(`Joined org '${args.org}'.`);
    }
  }

  printSuccess(args.username, args.org);
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
