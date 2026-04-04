import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS } from "../lib/constants";

/**
 * Scene 1: Dark intro — logo + tagline. Scaled up to fill frame.
 */
export const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  const subtitleOpacity = interpolate(frame, [40, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const lineWidth = interpolate(frame, [5, 35], [0, 600], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // npx command fades in at the bottom
  const cmdOpacity = interpolate(frame, [60, 75], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Ambient glow — bigger */}
      <div
        style={{
          position: "absolute",
          width: 900,
          height: 900,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(74,222,128,0.1) 0%, transparent 65%)`,
          opacity: interpolate(frame, [0, 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />

      {/* Horizontal accent line */}
      <div
        style={{
          position: "absolute",
          width: lineWidth,
          height: 2,
          background: `linear-gradient(90deg, transparent, ${COLORS.terminal}, transparent)`,
          top: "40%",
        }}
      />

      {/* Title block */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <h1
          style={{
            fontFamily: "'Satoshi', sans-serif",
            fontSize: 96,
            fontWeight: 900,
            color: COLORS.textPrimary,
            margin: 0,
            letterSpacing: "-0.03em",
          }}
        >
          Buddy Board
        </h1>
        <div
          style={{
            opacity: subtitleOpacity,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 22,
            color: COLORS.terminal,
            letterSpacing: "0.06em",
          }}
        >
          Your Claude Code companion, ranked.
        </div>
      </div>

      {/* npx command at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          opacity: cmdOpacity,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 20,
          color: COLORS.textMuted,
          padding: "10px 24px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: COLORS.surface,
        }}
      >
        <span style={{ color: COLORS.textMuted }}>$ </span>
        <span style={{ color: COLORS.terminal }}>npx buddy-board</span>
      </div>
    </AbsoluteFill>
  );
};
