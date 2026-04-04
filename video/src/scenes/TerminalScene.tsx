import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { COLORS } from "../lib/constants";

/**
 * Scene 2: Terminal — two phases.
 *   Phase 1 (frames 0–60): typing `npx buddy-board` + pressing enter
 *   Phase 2 (frames 61+): terminal clears, fresh output scrolls in
 */
export const TerminalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Terminal window slides up on entry
  const windowY = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 80 },
  });

  // --- Phase timing ---
  const TYPING_START = 8;
  const CMD = "npx buddy-board";
  const CHARS_PER_FRAME = 0.5;
  const typingEnd = TYPING_START + Math.ceil(CMD.length / CHARS_PER_FRAME); // ~38
  const CLEAR_FRAME = typingEnd + 12; // brief pause then clear (~50)
  const OUTPUT_START = CLEAR_FRAME + 8; // output begins (~58)

  const isPhase1 = frame < CLEAR_FRAME;

  // Phase 1: typing animation
  const charsVisible = Math.min(
    CMD.length,
    Math.max(0, Math.floor((frame - TYPING_START) * CHARS_PER_FRAME))
  );
  const typingDone = charsVisible >= CMD.length;
  const cursor = frame % 30 < 15 ? "█" : " ";

  // Phase 2: output lines stagger in
  const outputLine = (index: number) => {
    const lineFrame = OUTPUT_START + index * 6;
    return interpolate(frame, [lineFrame, lineFrame + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  };

  // Transition: quick fade between phases
  const phase1Opacity = interpolate(
    frame,
    [CLEAR_FRAME - 3, CLEAR_FRAME],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const phase2Opacity = interpolate(
    frame,
    [CLEAR_FRAME, CLEAR_FRAME + 5],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.base,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Terminal window */}
      <div
        style={{
          transform: `translateY(${(1 - windowY) * 60}px)`,
          width: 960,
          borderRadius: 16,
          border: `1px solid ${COLORS.border}`,
          backgroundColor: "#0d0d0d",
          overflow: "hidden",
          boxShadow:
            "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(74,222,128,0.05)",
        }}
      >
        {/* Title bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "14px 20px",
            backgroundColor: COLORS.surface,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#ef4444" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#eab308" }} />
          <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: "#22c55e" }} />
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              color: COLORS.textMuted,
              marginLeft: 16,
            }}
          >
            ~/projects — zsh
          </span>
        </div>

        {/* Terminal body */}
        <div style={{ padding: "28px 24px", minHeight: 360, position: "relative" }}>

          {/* ── Phase 1: Typing the command ── */}
          <div
            style={{
              opacity: phase1Opacity,
              position: isPhase1 ? "relative" : "absolute",
              top: isPhase1 ? undefined : 28,
              left: isPhase1 ? undefined : 24,
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 22,
                color: COLORS.terminal,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span style={{ color: COLORS.textMuted }}>$ </span>
              <span>{CMD.slice(0, charsVisible)}</span>
              <span style={{ opacity: typingDone ? 0.4 : 1 }}>{cursor}</span>
            </div>

            {/* "Enter" feedback — brief flash after typing finishes */}
            {typingDone && (
              <div
                style={{
                  marginTop: 16,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 14,
                  color: COLORS.textMuted,
                  opacity: interpolate(
                    frame,
                    [typingEnd + 2, typingEnd + 5, CLEAR_FRAME - 3, CLEAR_FRAME],
                    [0, 0.6, 0.6, 0],
                    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
                  ),
                }}
              >
                Running...
              </div>
            )}
          </div>

          {/* ── Phase 2: Fresh output (terminal cleared) ── */}
          <div style={{ opacity: phase2Opacity }}>
            {/* Repeat the command at top as a history line (dimmed) */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 14,
                color: COLORS.textMuted,
                marginBottom: 20,
                opacity: 0.5,
              }}
            >
              $ {CMD}
            </div>

            {/* Output lines */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 16,
                lineHeight: 2.2,
                color: COLORS.textSecondary,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div style={{ opacity: outputLine(0) }}>
                <span style={{ color: COLORS.terminal }}>✓</span> Fetching your buddy...
              </div>
              <div style={{ opacity: outputLine(1) }}>
                <span style={{ color: COLORS.terminal }}>✓</span> Species:{" "}
                <span style={{ color: "#eab308" }}>dragon</span>
              </div>
              <div style={{ opacity: outputLine(2) }}>
                <span style={{ color: COLORS.terminal }}>✓</span> Rarity:{" "}
                <span style={{ color: "#eab308", fontWeight: 700 }}>★★★★★ LEGENDARY</span>
              </div>
              <div style={{ opacity: outputLine(3) }}>
                <span style={{ color: COLORS.terminal }}>✓</span> Name:{" "}
                <span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>Zephyr</span>
              </div>
              <div style={{ opacity: outputLine(4), marginTop: 14 }}>
                <span style={{ color: COLORS.terminal, fontWeight: 600 }}>
                  → View your card at buddyboard.xyz/u/tanay
                </span>
              </div>

              {/* Fresh prompt at the bottom */}
              <div
                style={{
                  marginTop: 14,
                  opacity: outputLine(5),
                }}
              >
                <span style={{ color: COLORS.textMuted }}>$ </span>
                <span
                  style={{
                    color: COLORS.terminal,
                    opacity: frame % 30 < 15 ? 1 : 0,
                  }}
                >
                  █
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
