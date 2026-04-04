import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { SpriteRenderer } from "../components/SpriteRenderer";
import { COLORS } from "../lib/constants";
import type { Species, Eye, Hat } from "../lib/types";

const GALLERY_ITEMS: { species: Species; eye: Eye; hat: Hat; label: string }[] = [
  { species: "duck", eye: "·", hat: "none", label: "Duck" },
  { species: "dragon", eye: "✦", hat: "crown", label: "Dragon" },
  { species: "cat", eye: "·", hat: "beanie", label: "Cat" },
  { species: "ghost", eye: "×", hat: "halo", label: "Ghost" },
  { species: "robot", eye: "◉", hat: "none", label: "Robot" },
  { species: "axolotl", eye: "·", hat: "none", label: "Axolotl" },
  { species: "owl", eye: "◉", hat: "wizard", label: "Owl" },
  { species: "mushroom", eye: "·", hat: "none", label: "Mushroom" },
  { species: "capybara", eye: "°", hat: "tophat", label: "Capybara" },
];

/**
 * Scene 5: Species cascade — sprites pop in across a grid. Scaled up.
 */
export const SpeciesGallery: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

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
          fontSize: 48,
          fontWeight: 700,
          color: COLORS.textPrimary,
          opacity: spring({ frame, fps, config: { damping: 20, stiffness: 100 } }),
        }}
      >
        18 species to discover
      </div>

      {/* Grid of sprites — larger tiles */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 24,
          maxWidth: 1000,
        }}
      >
        {GALLERY_ITEMS.map((item, i) => {
          const s = spring({
            frame: frame - 10 - i * 4,
            fps,
            config: { damping: 10, stiffness: 120 },
          });
          return (
            <div
              key={item.species}
              style={{
                transform: `scale(${s})`,
                opacity: s > 0.01 ? 1 : 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 10,
                padding: 20,
                borderRadius: 12,
                backgroundColor: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
                width: 145,
              }}
            >
              <SpriteRenderer
                species={item.species}
                eye={item.eye}
                hat={item.hat}
                scale={1.6}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
