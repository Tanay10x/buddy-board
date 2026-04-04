import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SAMPLE_ORGS } from "../lib/sample-data";
import { COLORS } from "../lib/constants";

/**
 * Scene: Org cards cascade in showing different organizations.
 */
export const OrgShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 40,
      }}
    >
      {/* Title */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          fontFamily: "'Satoshi', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
        }}
      >
        Team up with your org
      </div>

      {/* Org cards grid */}
      <div
        style={{
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
          justifyContent: "center",
          maxWidth: 1050,
        }}
      >
        {SAMPLE_ORGS.map((org, i) => {
          const delay = 12 + i * 8;
          const s = spring({
            frame: frame - delay,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          // Staggered slide up
          const translateY = (1 - s) * 50;

          return (
            <div
              key={org.slug}
              style={{
                transform: `scale(${s}) translateY(${translateY}px)`,
                opacity: s > 0.01 ? 1 : 0,
                width: 240,
                padding: 24,
                borderRadius: 16,
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            >
              {/* Slug badge */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: COLORS.terminal,
                  backgroundColor: `${COLORS.terminal}15`,
                  padding: "4px 10px",
                  borderRadius: 6,
                  alignSelf: "flex-start",
                  letterSpacing: "0.04em",
                }}
              >
                /{org.slug}
              </div>

              {/* Name */}
              <div
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontSize: 22,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                {org.display_name}
              </div>

              {/* Description */}
              <div
                style={{
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {org.description}
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 4,
                  paddingTop: 12,
                  borderTop: `1px solid ${COLORS.borderSubtle}`,
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 18,
                      fontWeight: 700,
                      color: COLORS.textPrimary,
                    }}
                  >
                    {org.member_count}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: COLORS.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    members
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#eab308",
                    }}
                  >
                    {org.legendary_count}
                  </div>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: COLORS.textMuted,
                      textTransform: "uppercase",
                    }}
                  >
                    legendary
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
