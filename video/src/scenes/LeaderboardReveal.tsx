import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LEADERBOARD_DATA } from "../lib/sample-data";
import { RARITY_COLORS, COLORS } from "../lib/constants";
import { SpriteRenderer } from "../components/SpriteRenderer";

/**
 * Scene 7: Leaderboard rows slide in staggered. Scaled up table.
 */
export const LeaderboardReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = spring({ frame, fps, config: { damping: 20, stiffness: 100 } });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 32,
      }}
    >
      <div
        style={{
          fontFamily: "'Satoshi', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          opacity: titleOpacity,
        }}
      >
        Compete on the leaderboard
      </div>

      {/* Table — wider */}
      <div
        style={{
          width: 900,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
          overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 24px",
            borderBottom: `1px solid ${COLORS.border}`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          <span style={{ width: 50 }}>#</span>
          <span style={{ flex: 1 }}>Buddy</span>
          <span style={{ width: 100, textAlign: "right" }}>Species</span>
          <span style={{ width: 120, textAlign: "right" }}>Rarity</span>
          <span style={{ width: 70, textAlign: "right" }}>Total</span>
        </div>

        {/* Rows */}
        {LEADERBOARD_DATA.map((buddy, i) => {
          const delay = 15 + i * 8;
          const slideIn = spring({
            frame: frame - delay,
            fps,
            config: { damping: 16, stiffness: 100 },
          });
          const translateX = (1 - slideIn) * 200;

          return (
            <div
              key={buddy.id}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "14px 24px",
                borderBottom: i < LEADERBOARD_DATA.length - 1 ? `1px solid ${COLORS.borderSubtle}` : "none",
                transform: `translateX(${translateX}px)`,
                opacity: slideIn > 0.01 ? 1 : 0,
              }}
            >
              <span
                style={{
                  width: 50,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: i === 0 ? "#eab308" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : COLORS.textMuted,
                }}
              >
                {buddy.rank}
              </span>

              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ transform: "scale(0.55)", transformOrigin: "left center" }}>
                  <SpriteRenderer species={buddy.species} eye={buddy.eye} hat={buddy.hat} />
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Satoshi', sans-serif",
                      fontWeight: 600,
                      fontSize: 15,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {buddy.name}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      color: COLORS.textMuted,
                    }}
                  >
                    @{buddy.username}
                  </div>
                </div>
              </div>

              <span
                style={{
                  width: 100,
                  textAlign: "right",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                }}
              >
                {buddy.species}
              </span>

              <span
                style={{
                  width: 120,
                  textAlign: "right",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 700,
                  color: RARITY_COLORS[buddy.rarity],
                  textTransform: "uppercase",
                }}
              >
                {buddy.rarity}
              </span>

              <span
                style={{
                  width: 70,
                  textAlign: "right",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 16,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                {buddy.total_stats}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
