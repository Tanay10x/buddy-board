import { AbsoluteFill, interpolate, useCurrentFrame, spring, useVideoConfig } from "remotion";
import { COLORS } from "../lib/constants";

/**
 * Scene: CTA outro — focus on npx command + URL.
 */
export const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const cmdScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 10, stiffness: 120 },
  });

  const urlOpacity = interpolate(frame, [50, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsing glow behind CTA
  const pulseGlow = interpolate(Math.sin(frame * 0.08), [-1, 1], [0.08, 0.25]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 36,
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 500,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(74,222,128,${pulseGlow}) 0%, transparent 55%)`,
        }}
      />

      {/* Headline */}
      <div
        style={{
          transform: `scale(${titleScale})`,
          fontFamily: "'Satoshi', sans-serif",
          fontSize: 72,
          fontWeight: 900,
          color: COLORS.textPrimary,
          textAlign: "center",
        }}
      >
        Hatch yours.
      </div>

      {/* Big npx command — the hero of the outro */}
      <div
        style={{
          transform: `scale(${cmdScale})`,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 32,
          color: COLORS.terminal,
          padding: "16px 40px",
          borderRadius: 12,
          border: `2px solid ${COLORS.terminal}44`,
          backgroundColor: COLORS.surface,
          boxShadow: `0 0 40px ${COLORS.terminal}22`,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span style={{ color: COLORS.textMuted }}>$</span>
        <span>npx buddy-board</span>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 24,
          color: COLORS.terminal,
          letterSpacing: "0.02em",
        }}
      >
        buddyboard.xyz
      </div>
    </AbsoluteFill>
  );
};
