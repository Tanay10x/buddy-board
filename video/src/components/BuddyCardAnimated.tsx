import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SpriteRenderer } from "./SpriteRenderer";
import { StatBarAnimated } from "./StatBarAnimated";
import { RarityBadge } from "./RarityBadge";
import { STAT_NAMES, RARITY_COLORS, COLORS } from "../lib/constants";
import type { Buddy, Rarity } from "../lib/types";

function getRarityGlow(rarity: Rarity): string {
  switch (rarity) {
    case "rare":
      return "0 0 12px rgba(59,130,246,0.25), 0 0 32px rgba(59,130,246,0.1)";
    case "epic":
      return "0 0 12px rgba(168,85,247,0.3), 0 0 32px rgba(168,85,247,0.12)";
    case "legendary":
      return "0 0 16px 4px rgba(234,179,8,0.55), 0 0 48px 8px rgba(234,179,8,0.3)";
    default:
      return "none";
  }
}

function getRarityBorder(rarity: Rarity): string {
  const map: Record<Rarity, string> = {
    common: "#9ca3af",
    uncommon: "#22c55e",
    rare: "#3b82f6",
    epic: "#a855f7",
    legendary: "#eab308",
  };
  return map[rarity];
}

export const BuddyCardAnimated: React.FC<{
  buddy: Buddy;
  /** Frame offset before the card starts animating in */
  enterDelay?: number;
  /** Whether to animate stat bars (default true) */
  animateStats?: boolean;
}> = ({ buddy, enterDelay = 0, animateStats = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const rarityColor = RARITY_COLORS[buddy.rarity];

  // Spring scale-in
  const scale = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.8 },
  });

  // Slight upward drift
  const translateY = spring({
    frame: frame - enterDelay,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  return (
    <div
      style={{
        transform: `scale(${scale}) translateY(${(1 - translateY) * 40}px)`,
        opacity: scale > 0.01 ? 1 : 0,
        width: 380,
        borderRadius: 16,
        border: `2px solid ${getRarityBorder(buddy.rarity)}`,
        backgroundColor: COLORS.surface,
        boxShadow: getRarityGlow(buddy.rarity),
        overflow: "hidden",
        fontFamily: "'Instrument Sans', sans-serif",
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `repeating-linear-gradient(
            to bottom,
            transparent 0px,
            transparent 3px,
            rgba(0,0,0,0.03) 3px,
            rgba(0,0,0,0.03) 4px
          )`,
          pointerEvents: "none",
          zIndex: 1,
          borderRadius: 16,
        }}
      />

      <div style={{ position: "relative", zIndex: 10, padding: 24 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <RarityBadge rarity={buddy.rarity} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {buddy.shiny && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#eab308",
                }}
              >
                ✨ SHINY
              </span>
            )}
            <span
              style={{
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: rarityColor,
              }}
            >
              {buddy.species}
            </span>
          </div>
        </div>

        {/* Sprite + Name */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginBottom: 20,
          }}
        >
          <SpriteRenderer
            species={buddy.species}
            eye={buddy.eye}
            hat={buddy.hat}
            scale={1.4}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <h2
              style={{
                fontFamily: "'Satoshi', sans-serif",
                fontSize: 22,
                fontWeight: 700,
                color: COLORS.textPrimary,
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {buddy.name}
            </h2>
            <p
              style={{
                fontSize: 13,
                fontStyle: "italic",
                color: COLORS.textSecondary,
                margin: 0,
                marginTop: 6,
              }}
            >
              &quot;{buddy.personality}&quot;
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {STAT_NAMES.map((stat, i) => (
            <StatBarAnimated
              key={stat}
              label={stat}
              value={buddy.stats[stat]}
              rarity={buddy.rarity}
              delay={animateStats ? enterDelay + 10 + i * 6 : 0}
            />
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 20,
            paddingTop: 16,
            borderTop: `1px solid ${COLORS.borderSubtle}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
            }}
          >
            <span style={{ color: COLORS.textSecondary }}>
              @{buddy.username}
            </span>
            {buddy.github_verified && (
              <span style={{ color: COLORS.terminal, fontWeight: 700 }}>
                ✓ GitHub
              </span>
            )}
          </div>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12,
              color: COLORS.textMuted,
            }}
          >
            buddyboard.xyz
          </span>
        </div>
      </div>
    </div>
  );
};
