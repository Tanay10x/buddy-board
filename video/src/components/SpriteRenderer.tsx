import { renderSprite } from "../lib/sprites";
import type { Species, Eye, Hat } from "../lib/types";
import { COLORS } from "../lib/constants";

export const SpriteRenderer: React.FC<{
  species: Species;
  eye: Eye;
  hat: Hat;
  scale?: number;
}> = ({ species, eye, hat, scale = 1 }) => {
  const lines = renderSprite(species, eye, hat);
  return (
    <pre
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14 * scale,
        lineHeight: 1.2,
        color: COLORS.terminal,
        whiteSpace: "pre",
        userSelect: "none",
        margin: 0,
      }}
    >
      {lines.join("\n")}
    </pre>
  );
};
