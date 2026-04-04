import { Composition } from "remotion";
import { BuddyBoardPromo } from "./BuddyBoardPromo";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main promo — 1920x1080 landscape, 35s at 30fps */}
      <Composition
        id="BuddyBoardPromo"
        component={BuddyBoardPromo}
        durationInFrames={1050}
        fps={30}
        width={1920}
        height={1080}
      />

      {/* Vertical version for Reels/TikTok/Shorts */}
      <Composition
        id="BuddyBoardPromoVertical"
        component={BuddyBoardPromo}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* Square for Instagram feed */}
      <Composition
        id="BuddyBoardPromoSquare"
        component={BuddyBoardPromo}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
