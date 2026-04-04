#!/usr/bin/env node

import { createInterface } from "node:readline/promises";
import { readClaudeConfig, readBuddyBoardToken, saveBuddyBoardToken } from "./config.js";
import { roll } from "./roll.js";
import { submitBuddy, verifyGithub, verifyOrgMembership, claimOrg } from "./submit.js";
import { STAT_NAMES } from "./types.js";

const SITE_URL = "https://buddyboard.xyz";

// ── ANSI colors ──────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
};

const g = (s) => `${c.green}${s}${c.reset}`;
const d = (s) => `${c.dim}${s}${c.reset}`;
const w = (s) => `${c.bold}${c.white}${s}${c.reset}`;
const y = (s) => `${c.yellow}${s}${c.reset}`;

// ── Sprite rendering (subset, matching Claude Code's sprites.ts) ─────────────
const SPRITES = {
  duck:     ["    __      ", "  <({E} )___  ", "   (  ._>   ", "    `--'    "],
  cat:      ["   /\\_/\\    ", "  ( {E}   {E})  ", "  (  w  )   ", '  (")_(")   '],
  dragon:   ["  /^\\  /^\\  ", " <  {E}  {E}  > ", " (   ~~   ) ", "  `-vvvv-'  "],
  snail:    [" {E}    .--.  ", "  \\  ( @ )  ", "   \\_`--'   ", "  ~~~~~~~   "],
  ghost:    ["   .----.   ", "  / {E}  {E} \\  ", "  |      |  ", "  ~`~``~`~  "],
  cactus:   [" n  ____  n ", " | |{E}  {E}| | ", " |_|    |_| ", "   |    |   "],
  robot:    ["   .[||].   ", "  [ {E}  {E} ]  ", "  [ ==== ]  ", "  `------'  "],
  octopus:  ["   .----.   ", "  ( {E}  {E} )  ", "  (______)  ", "  /\\/\\/\\/\\  "],
  owl:      ["   /\\  /\\   ", "  (({E})({E}))  ", "  (  ><  )  ", "   `----'   "],
  penguin:  ["  .---.     ", "  ({E}>{E})     ", " /(   )\\    ", "  `---'     "],
  blob:     ["   .----.   ", "  ( {E}  {E} )  ", "  (      )  ", "   `----'   "],
  turtle:   ["   _,--._   ", "  ( {E}  {E} )  ", " /[______]\\ ", "  ``    ``  "],
  axolotl:  ["}~(______)~{", "}~({E} .. {E})~{", "  ( .--. )  ", "  (_/  \\_)  "],
  capybara: ["  n______n  ", " ( {E}    {E} ) ", " (   oo   ) ", "  `------'  "],
  goose:    ["     ({E}>    ", "     ||     ", "   _(__)_   ", "    ^^^^    "],
  rabbit:   ["   (\\__/)   ", "  ( {E}  {E} )  ", " =(  ..  )= ", '  (")__(")  '],
  mushroom: [" .-o-OO-o-. ", "(__________)", "   |{E}  {E}|   ", "   |____|   "],
  chonk:    ["  /\\    /\\  ", " ( {E}    {E} ) ", " (   ..   ) ", "  `------'  "],
};

function renderSprite(species, eye) {
  const frames = SPRITES[species];
  if (!frames) return [];
  return frames.map((line) => line.replaceAll("{E}", eye));
}

function renderStatBar(value, maxWidth = 20) {
  const filled = Math.round((value / 100) * maxWidth);
  const empty = maxWidth - filled;
  return g("█".repeat(filled)) + d("░".repeat(empty));
}

// ── Rarity colors ────────────────────────────────────────────────────────────
const RARITY_COLOR = {
  common: c.gray,
  uncommon: c.green,
  rare: c.cyan,
  epic: c.magenta,
  legendary: c.yellow,
};

const RARITY_STARS = {
  common: "*",
  uncommon: "**",
  rare: "***",
  epic: "****",
  legendary: "*****",
};

// ── Arg parsing ──────────────────────────────────────────────────────────────
function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--username" && args[i + 1]) { result.username = args[i + 1].toLowerCase(); i++; }
    else if (args[i] === "--github" && args[i + 1]) { result.github = args[i + 1]; i++; }
    else if (args[i] === "--org" && args[i + 1]) { result.org = args[i + 1].toLowerCase(); i++; }
    else if (args[i] === "--help" || args[i] === "-h") { result.help = true; }
  }
  return result;
}

function printHelp() {
  console.log(`
  ${w("buddy-board")} ${d("— Submit your Claude Code buddy to the leaderboard")}

  ${w("Usage:")}
    ${g("npx buddy-board")}                     ${d("Interactive mode (recommended)")}
    ${g("npx buddy-board")} --username <name>   ${d("With flags")}

  ${w("Options:")}
    --username  ${d("Unique leaderboard name (3-20 chars, a-z, 0-9, hyphens)")}
    --github    ${d("GitHub username (optional, adds verified badge + avatar)")}
    --org       ${d("Organization slug (optional, joins a team dashboard)")}
    --help      ${d("Show this help")}
`);
}

function validateUsername(username) {
  if (!username) return "Username is required.";
  if (username.length < 3 || username.length > 20) return "Must be 3-20 characters.";
  if (!/^[a-z0-9-]+$/.test(username)) return "Lowercase alphanumeric and hyphens only.";
  return null;
}

// ── Interactive prompt ───────────────────────────────────────────────────────
async function interactivePrompt() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });

  console.log(`
  ${w("buddy-board")}
  ${d("Submit your Claude Code companion to the leaderboard.")}
  `);

  let username = "";
  while (true) {
    const answer = await rl.question(`  ${w("Username")} ${d("(3-20 chars, lowercase)")}: `);
    username = answer.trim().toLowerCase();
    const err = validateUsername(username);
    if (err) {
      console.log(`  ${c.red}${err}${c.reset}`);
    } else {
      break;
    }
  }

  const githubAnswer = await rl.question(`  ${w("GitHub")} ${d("(optional, Enter to skip)")}: `);
  const github = githubAnswer.trim() || null;

  const orgAnswer = await rl.question(`  ${w("Org")} ${d("(optional, Enter to skip)")}: `);
  const org = orgAnswer.trim().toLowerCase() || null;

  rl.close();
  console.log("");
  return { username, github, org };
}

// ── Card renderer ────────────────────────────────────────────────────────────
function printBuddyCard(buddy, bones, username, rarity) {
  const rc = RARITY_COLOR[rarity] || c.gray;
  const stars = RARITY_STARS[rarity] || "*";
  const sprite = renderSprite(bones.species, bones.eye);
  const total = Object.values(bones.stats).reduce((a, b) => a + b, 0);

  const border = `${rc}${"─".repeat(46)}${c.reset}`;

  console.log("");
  console.log(`  ${rc}┌${border}${rc}┐${c.reset}`);
  console.log(`  ${rc}│${c.reset} ${rc}${stars} ${rarity.toUpperCase().padEnd(12)}${c.reset}${d(bones.species.toUpperCase().padStart(30))} ${rc}│${c.reset}`);
  console.log(`  ${rc}│${c.reset}${" ".repeat(46)}${rc}│${c.reset}`);

  // Sprite lines
  for (const line of sprite) {
    const colored = `${c.green}${line}${c.reset}`;
    console.log(`  ${rc}│${c.reset}  ${colored}  ${w(sprite.indexOf(line) === 0 ? buddy.name : "")}${"".padEnd(46 - line.length - 4 - (sprite.indexOf(line) === 0 ? buddy.name.length : 0))}${rc}│${c.reset}`);
  }

  console.log(`  ${rc}│${c.reset}${" ".repeat(46)}${rc}│${c.reset}`);

  // Stats
  for (const stat of STAT_NAMES) {
    const val = bones.stats[stat];
    const bar = renderStatBar(val, 15);
    console.log(`  ${rc}│${c.reset}  ${d(stat.padEnd(12))} ${bar} ${w(String(val).padStart(3))}  ${rc}│${c.reset}`);
  }

  console.log(`  ${rc}│${c.reset}${" ".repeat(46)}${rc}│${c.reset}`);
  console.log(`  ${rc}│${c.reset}  ${d("@" + username)}${" ".repeat(46 - username.length - 3 - String(total).length - 10)}${d("Total:")} ${w(String(total))}  ${rc}│${c.reset}`);
  console.log(`  ${rc}└${border}${rc}┘${c.reset}`);
  console.log("");
}

// ── Success output ───────────────────────────────────────────────────────────
function printSuccess(username, org) {
  const viewUrl = `${SITE_URL}/u/${username}`;
  const cardUrl = `${SITE_URL}/card/${username}`;
  const teamUrl = org ? `${SITE_URL}/org/${org}` : null;

  console.log(`  ${g("Submitted successfully.")}`);
  console.log("");
  console.log(`  ${w("View")}  ${d(viewUrl)}`);
  console.log(`  ${w("Card")}  ${d(cardUrl)}`);
  if (teamUrl) {
    console.log(`  ${w("Team")}  ${d(teamUrl)}`);
  }
  console.log("");
  console.log(`  ${d("Embed in your README:")}`);
  console.log(`  ${g(`![buddy](${cardUrl})`)}`);
  console.log("");
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) { printHelp(); process.exit(0); }

  // Interactive mode if no --username
  if (!args.username) {
    const interactive = await interactivePrompt();
    args.username = interactive.username;
    args.github = interactive.github;
    args.org = interactive.org;
  }

  const usernameError = validateUsername(args.username);
  if (usernameError) {
    console.error(`  ${c.red}Error: ${usernameError}${c.reset}`);
    process.exit(1);
  }

  // 1. Read config
  process.stdout.write(`  ${d("Reading Claude Code config...")}`);
  const config = readClaudeConfig();
  if (config.error) {
    console.log(` ${c.red}failed${c.reset}`);
    console.error(`  ${c.red}${config.error}${c.reset}`);
    process.exit(1);
  }
  console.log(` ${g("ok")}`);

  // 2. Compute bones
  process.stdout.write(`  ${d("Computing buddy data...")}`);
  const { bones } = roll(config.userId);
  console.log(` ${g("ok")}`);

  // 3. Verify GitHub
  let githubVerified = false;
  let githubAvatarUrl = null;
  let githubBio = null;
  let githubProfileUrl = null;
  if (args.github) {
    process.stdout.write(`  ${d(`Verifying @${args.github}...`)}`);
    const ghResult = await verifyGithub(args.github);
    githubVerified = ghResult.verified;
    if (githubVerified) {
      githubAvatarUrl = ghResult.avatar_url;
      githubBio = ghResult.bio;
      githubProfileUrl = ghResult.profile_url;
      console.log(` ${g("verified")}`);
    } else {
      console.log(` ${y("not found, skipping")}`);
    }
  }

  // 4. Token
  const stored = readBuddyBoardToken();
  const token = stored?.username === args.username ? stored.token : null;

  // 5. Submit
  process.stdout.write(`  ${d("Submitting...")}`);
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

  const result = await submitBuddy({ username: args.username, token, buddy });

  if (result.error) {
    console.log(` ${c.red}failed${c.reset}`);
    console.error(`  ${c.red}${result.error}${c.reset}`);
    process.exit(1);
  }
  console.log(` ${g("ok")}`);

  // 6. Save token
  const savedToken = result.token || token;
  if (result.token) {
    saveBuddyBoardToken({ username: args.username, token: result.token, api: SITE_URL });
  }

  // 7. Org
  if (args.org) {
    let orgVerified = false;
    if (args.github && githubVerified) {
      process.stdout.write(`  ${d(`Verifying org membership...`)}`);
      const orgCheck = await verifyOrgMembership(args.github, args.org);
      orgVerified = orgCheck.verified;
      console.log(orgVerified ? ` ${g("verified")}` : ` ${d("unverified")}`);
    }

    process.stdout.write(`  ${d(`Joining ${args.org}...`)}`);
    const orgResult = await claimOrg({
      username: args.username, token: savedToken, orgSlug: args.org, orgVerified,
    });
    if (orgResult.error) {
      console.log(` ${y("failed")}`);
    } else {
      console.log(` ${g("ok")}`);
    }
  }

  // 8. Show the card
  printBuddyCard(buddy, bones, args.username, bones.rarity);

  // 9. Links
  printSuccess(args.username, args.org);
}

main().catch((err) => {
  console.error(`  ${c.red}Unexpected error: ${err.message}${c.reset}`);
  process.exit(1);
});
