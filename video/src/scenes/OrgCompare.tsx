import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { ORG_COMPARE } from "../lib/sample-data";
import { COLORS } from "../lib/constants";

/**
 * Scene: Head-to-head org comparison — Anthropic vs Vercel.
 */
export const OrgCompare: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { left, right } = ORG_COMPARE;

  // Cards slide in from sides
  const leftSlide = spring({
    frame: frame - 5,
    fps,
    config: { damping: 14, stiffness: 80 },
  });
  const rightSlide = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 80 },
  });

  // VS badge
  const vsScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  // Stats bars animate after cards arrive
  const statsReveal = interpolate(frame, [35, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const stats = [
    { label: "Members", left: left.member_count, right: right.member_count },
    { label: "Combined Power", left: left.combined_power, right: right.combined_power },
    { label: "Legendaries", left: left.legendary_count, right: right.legendary_count },
    { label: "Verified", left: left.verified_member_count, right: right.verified_member_count },
  ];

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
          fontFamily: "'Satoshi', sans-serif",
          fontSize: 42,
          fontWeight: 700,
          color: COLORS.textPrimary,
          opacity: spring({ frame, fps, config: { damping: 20, stiffness: 100 } }),
        }}
      >
        Org vs Org
      </div>

      {/* Comparison container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
        }}
      >
        {/* Left org card */}
        <OrgCompareCard
          org={left}
          slide={leftSlide}
          direction="left"
        />

        {/* VS badge */}
        <div
          style={{
            transform: `scale(${vsScale})`,
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: COLORS.surface,
            border: `2px solid ${COLORS.terminal}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 30px ${COLORS.terminal}44`,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Satoshi', sans-serif",
              fontSize: 24,
              fontWeight: 900,
              color: COLORS.terminal,
            }}
          >
            VS
          </span>
        </div>

        {/* Right org card */}
        <OrgCompareCard
          org={right}
          slide={rightSlide}
          direction="right"
        />
      </div>

      {/* Stats comparison bars */}
      <div
        style={{
          width: 700,
          display: "flex",
          flexDirection: "column",
          gap: 14,
          opacity: statsReveal,
          transform: `translateY(${(1 - statsReveal) * 20}px)`,
        }}
      >
        {stats.map((stat) => {
          const leftPct = stat.left / (stat.left + stat.right);
          const rightPct = 1 - leftPct;
          const leftWins = stat.left > stat.right;

          return (
            <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Left value */}
              <span
                style={{
                  width: 60,
                  textAlign: "right",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: leftWins ? COLORS.terminal : COLORS.textSecondary,
                }}
              >
                {stat.left.toLocaleString()}
              </span>

              {/* Bar */}
              <div
                style={{
                  flex: 1,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: COLORS.elevated,
                  display: "flex",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${leftPct * 100}%`,
                    backgroundColor: leftWins ? COLORS.terminal : COLORS.textMuted,
                    borderRadius: "5px 0 0 5px",
                  }}
                />
                <div
                  style={{
                    width: `${rightPct * 100}%`,
                    backgroundColor: !leftWins ? "#a855f7" : COLORS.textMuted,
                    borderRadius: "0 5px 5px 0",
                  }}
                />
              </div>

              {/* Right value */}
              <span
                style={{
                  width: 60,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 15,
                  fontWeight: 700,
                  color: !leftWins ? "#a855f7" : COLORS.textSecondary,
                }}
              >
                {stat.right.toLocaleString()}
              </span>

              {/* Label */}
              <span
                style={{
                  width: 120,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  color: COLORS.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                {stat.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Sub-component: org comparison card
import type { SampleOrg } from "../lib/sample-data";

const OrgCompareCard: React.FC<{
  org: SampleOrg;
  slide: number;
  direction: "left" | "right";
}> = ({ org, slide, direction }) => {
  const translateX = (1 - slide) * (direction === "left" ? -200 : 200);

  return (
    <div
      style={{
        transform: `translateX(${translateX}px)`,
        opacity: slide > 0.01 ? 1 : 0,
        width: 260,
        padding: 28,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        border: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
      }}
    >
      {/* Slug */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 12,
          color: COLORS.terminal,
          backgroundColor: `${COLORS.terminal}15`,
          padding: "4px 12px",
          borderRadius: 6,
        }}
      >
        /{org.slug}
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: "'Satoshi', sans-serif",
          fontSize: 26,
          fontWeight: 700,
          color: COLORS.textPrimary,
        }}
      >
        {org.display_name}
      </div>

      {/* Key stat */}
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 36,
          fontWeight: 700,
          color: direction === "left" ? COLORS.terminal : "#a855f7",
        }}
      >
        {org.combined_power.toLocaleString()}
      </div>
      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
          color: COLORS.textMuted,
          textTransform: "uppercase",
        }}
      >
        Combined Power
      </div>
    </div>
  );
};
