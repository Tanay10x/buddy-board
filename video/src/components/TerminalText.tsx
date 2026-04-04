import { useCurrentFrame } from "remotion";
import { COLORS } from "../lib/constants";

export const TerminalText: React.FC<{
  text: string;
  /** Characters per frame */
  speed?: number;
  prefix?: string;
  fontSize?: number;
}> = ({ text, speed = 0.5, prefix = "$ ", fontSize = 24 }) => {
  const frame = useCurrentFrame();
  const charsVisible = Math.min(text.length, Math.floor(frame * speed));
  const cursor = frame % 30 < 15 ? "█" : " ";
  const done = charsVisible >= text.length;

  return (
    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize,
        color: COLORS.terminal,
        display: "flex",
        alignItems: "center",
      }}
    >
      <span style={{ color: COLORS.textMuted }}>{prefix}</span>
      <span>{text.slice(0, charsVisible)}</span>
      <span style={{ opacity: done ? 0.4 : 1 }}>{cursor}</span>
    </div>
  );
};
