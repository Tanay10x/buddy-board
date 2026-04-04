import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BuddyCardAnimated } from "../components/BuddyCardAnimated";
import { LEGENDARY_BUDDY, EPIC_BUDDY } from "../lib/sample-data";
import { COLORS } from "../lib/constants";

/**
 * Scene: Two buddy cards slide in for head-to-head. Scaled up.
 */
export const CompareScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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

  const vsScale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 8, stiffness: 150 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Left card — scaled up */}
      <div
        style={{
          position: "absolute",
          left: 100,
          transform: `translateX(${(1 - leftSlide) * -300}px) scale(0.95)`,
          opacity: leftSlide > 0.01 ? 1 : 0,
        }}
      >
        <BuddyCardAnimated buddy={LEGENDARY_BUDDY} enterDelay={0} animateStats={false} />
      </div>

      {/* VS badge */}
      <div
        style={{
          position: "absolute",
          zIndex: 20,
          transform: `scale(${vsScale})`,
          width: 90,
          height: 90,
          borderRadius: "50%",
          backgroundColor: COLORS.surface,
          border: `2px solid ${COLORS.terminal}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 0 40px ${COLORS.terminal}44`,
        }}
      >
        <span
          style={{
            fontFamily: "'Satoshi', sans-serif",
            fontSize: 32,
            fontWeight: 900,
            color: COLORS.terminal,
          }}
        >
          VS
        </span>
      </div>

      {/* Right card — scaled up */}
      <div
        style={{
          position: "absolute",
          right: 100,
          transform: `translateX(${(1 - rightSlide) * 300}px) scale(0.95)`,
          opacity: rightSlide > 0.01 ? 1 : 0,
        }}
      >
        <BuddyCardAnimated buddy={EPIC_BUDDY} enterDelay={0} animateStats={false} />
      </div>
    </AbsoluteFill>
  );
};
