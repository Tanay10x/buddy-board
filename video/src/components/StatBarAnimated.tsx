import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { RARITY_COLORS, COLORS } from "../lib/constants";
import type { Rarity } from "../lib/types";

export const StatBarAnimated: React.FC<{
  label: string;
  value: number;
  rarity: Rarity;
  delay?: number; // frames to delay before filling
}> = ({ label, value, rarity, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = RARITY_COLORS[rarity];
  const pct = Math.min(100, Math.max(0, value));

  // Animate fill width from 0 to target over 30 frames after delay
  const fillWidth = interpolate(frame - delay, [0, 30], [0, pct], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Animate number counting up
  const displayValue = Math.round(
    interpolate(frame - delay, [0, 30], [0, value], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Fade in the whole row
  const opacity = interpolate(frame - delay, [-5, 0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        opacity,
      }}
    >
      <span
        style={{
          width: 96,
          flexShrink: 0,
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          color: COLORS.textMuted,
        }}
      >
        {label}
      </span>
      {/* Track */}
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: 9999,
          backgroundColor: COLORS.elevated,
          overflow: "hidden",
        }}
      >
        {/* Fill */}
        <div
          style={{
            height: "100%",
            width: `${fillWidth}%`,
            background: color,
            borderRadius: 9999,
            boxShadow: `0 0 6px 0px ${color}55`,
          }}
        />
      </div>
      <span
        style={{
          width: 32,
          flexShrink: 0,
          textAlign: "right",
          fontSize: 12,
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          color: COLORS.textPrimary,
        }}
      >
        {displayValue}
      </span>
    </div>
  );
};
