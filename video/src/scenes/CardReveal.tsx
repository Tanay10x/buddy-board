import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import { BuddyCardAnimated } from "../components/BuddyCardAnimated";
import { LEGENDARY_BUDDY } from "../lib/sample-data";
import { COLORS } from "../lib/constants";

/**
 * Scene 3: Legendary card springs in with full glow, stats fill.
 * Scaled up — card is larger and more centered.
 */
export const CardReveal: React.FC = () => {
  const frame = useCurrentFrame();

  // Background glow pulse
  const glowOpacity = interpolate(
    frame,
    [0, 15, 60, 90],
    [0, 0.15, 0.25, 0.15],
    { extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Radial glow behind card */}
      <div
        style={{
          position: "absolute",
          width: 700,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(ellipse, rgba(234,179,8,${glowOpacity}) 0%, transparent 70%)`,
        }}
      />

      {/* Scale the card up */}
      <div style={{ transform: "scale(1.35)" }}>
        <BuddyCardAnimated buddy={LEGENDARY_BUDDY} enterDelay={5} />
      </div>
    </AbsoluteFill>
  );
};
