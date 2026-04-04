import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { RarityBadge } from "../components/RarityBadge";
import { RARITY_COLORS, COLORS } from "../lib/constants";
import type { Rarity } from "../lib/types";

const RARITIES: Rarity[] = ["common", "uncommon", "rare", "epic", "legendary"];

/**
 * Scene 6: Rarity tiers light up one by one. Scaled up bars.
 */
export const RarityShowcase: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 48,
      }}
    >
      <div
        style={{
          fontFamily: "'Satoshi', sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          opacity: spring({ frame, fps, config: { damping: 20, stiffness: 100 } }),
        }}
      >
        5 rarity tiers
      </div>

      <div style={{ display: "flex", gap: 32, alignItems: "flex-end" }}>
        {RARITIES.map((rarity, i) => {
          const delay = 15 + i * 12;
          const s = spring({
            frame: frame - delay,
            fps,
            config: { damping: 10, stiffness: 100 },
          });
          const color = RARITY_COLORS[rarity];
          const barHeight = 80 + i * 55;

          const isLegendary = rarity === "legendary";
          const glowIntensity = isLegendary
            ? interpolate(Math.sin(frame * 0.1), [-1, 1], [0.3, 0.7])
            : 0;

          return (
            <div
              key={rarity}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                transform: `scale(${s}) translateY(${(1 - s) * 30}px)`,
                opacity: s > 0.01 ? 1 : 0,
              }}
            >
              <div
                style={{
                  width: 100,
                  height: barHeight * s,
                  borderRadius: 10,
                  background: `linear-gradient(to top, ${color}22, ${color})`,
                  border: `2px solid ${color}`,
                  boxShadow: isLegendary
                    ? `0 0 ${20 + glowIntensity * 30}px ${color}88`
                    : `0 0 12px ${color}33`,
                }}
              />
              <RarityBadge rarity={rarity} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
