import { AbsoluteFill, Sequence, Audio, staticFile } from "remotion";
import { Intro } from "./scenes/Intro";
import { TerminalScene } from "./scenes/TerminalScene";
import { CardReveal } from "./scenes/CardReveal";
import { SpeciesGallery } from "./scenes/SpeciesGallery";
import { RarityShowcase } from "./scenes/RarityShowcase";
import { LeaderboardReveal } from "./scenes/LeaderboardReveal";
import { CompareScene } from "./scenes/CompareScene";
import { OrgShowcase } from "./scenes/OrgShowcase";
import { OrgCompare } from "./scenes/OrgCompare";
import { Outro } from "./scenes/Outro";
import { COLORS } from "./lib/constants";

/**
 * Main promo video composition — 10 scenes.
 *
 * At 30fps:
 *   Intro:          90 frames  (3s)
 *   Terminal:       120 frames (4s)
 *   Card Reveal:    120 frames (4s)
 *   Species Gallery: 90 frames (3s)
 *   Rarity:         105 frames (3.5s)
 *   Leaderboard:     90 frames (3s)
 *   Compare:         90 frames (3s)
 *   Org Showcase:    105 frames (3.5s)
 *   Org Compare:     120 frames (4s)
 *   Outro:          120 frames (4s)
 *   ──────────────────────────────
 *   Total:         1050 frames (35s)
 */
export const BuddyBoardPromo: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.base }}>
      {/* Music — Hyperactive Chiptune Loop by Rolly-SFX (CC0) */}
      <Audio src={staticFile("music.mp3")} volume={0.3} loop />

      <Sequence from={0} durationInFrames={90}>
        <Intro />
      </Sequence>

      <Sequence from={90} durationInFrames={120}>
        <TerminalScene />
      </Sequence>

      <Sequence from={210} durationInFrames={120}>
        <CardReveal />
      </Sequence>

      <Sequence from={330} durationInFrames={90}>
        <SpeciesGallery />
      </Sequence>

      <Sequence from={420} durationInFrames={105}>
        <RarityShowcase />
      </Sequence>

      <Sequence from={525} durationInFrames={90}>
        <LeaderboardReveal />
      </Sequence>

      <Sequence from={615} durationInFrames={90}>
        <CompareScene />
      </Sequence>

      <Sequence from={705} durationInFrames={105}>
        <OrgShowcase />
      </Sequence>

      <Sequence from={810} durationInFrames={120}>
        <OrgCompare />
      </Sequence>

      <Sequence from={930} durationInFrames={120}>
        <Outro />
      </Sequence>
    </AbsoluteFill>
  );
};
