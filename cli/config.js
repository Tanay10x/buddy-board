import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

function readJsonFile(path) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export function readClaudeConfig() {
  const home = homedir();

  // Try main config first
  const mainPath = join(home, ".claude.json");
  let config = readJsonFile(mainPath);

  // Fall back to newest backup
  if (!config || !config.companion) {
    const backupDir = join(home, ".claude", "backups");
    try {
      const files = readdirSync(backupDir)
        .filter((f) => f.startsWith(".claude.json.backup."))
        .sort()
        .reverse();

      for (const file of files) {
        const backup = readJsonFile(join(backupDir, file));
        if (backup && backup.companion) {
          config = backup;
          break;
        }
      }
    } catch {
      // backups dir doesn't exist
    }
  }

  if (!config) {
    return { error: "Can't read ~/.claude.json. Is Claude Code installed?" };
  }

  if (!config.companion) {
    return { error: "No buddy found. Run /buddy in Claude Code first." };
  }

  const userId =
    config.oauthAccount?.accountUuid ?? config.userID ?? "anon";

  return {
    companion: config.companion,
    userId,
  };
}

export function readBuddyBoardToken() {
  const tokenPath = join(homedir(), ".buddy-board");
  return readJsonFile(tokenPath);
}

export function saveBuddyBoardToken(data) {
  const tokenPath = join(homedir(), ".buddy-board");
  writeFileSync(tokenPath, JSON.stringify(data, null, 2));
}
