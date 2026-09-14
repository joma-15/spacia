import { useEffect, useState } from "react";
import { Asset } from "expo-asset";

/**
 * All image assets the MemoryMatch (Spacia Rush) game needs.
 * Pre-loading them guarantees every sprite frame is decoded and
 * cached before the first game tick — no blank/flickering ninja
 * on a cold start.
 */
const GAME_IMAGE_ASSETS = [
  // 6-frame run cycle
  require("../../../../../assets/images/ninja-run-1.png"),
  require("../../../../../assets/images/ninja-run-2.png"),
  require("../../../../../assets/images/ninja-run-3.png"),
  require("../../../../../assets/images/ninja-run-4.png"),
  require("../../../../../assets/images/ninja-run-5.png"),
  require("../../../../../assets/images/ninja-run-6.png"),
  // 3-frame dash animation
  require("../../../../../assets/images/ninja-dash-1.png"),
  require("../../../../../assets/images/ninja-dash-2.png"),
  require("../../../../../assets/images/ninja-dash-3.png"),
  // Dash trail effect
  require("../../../../../assets/images/ninja-dash-trail.png"),
];

/**
 * Downloads/decodes every image the game needs BEFORE letting the
 * game show them.
 *
 * Why this matters: on a cold app start, an <Image source={require(...)}>
 * can be asked to draw before React Native has finished resolving and
 * caching that image — which causes the ninja sprite to not show up
 * the very first time. Waiting for `Asset.loadAsync` to finish avoids
 * that.
 *
 * Returns `true` once assets are ready (or if preloading failed —
 * we don't want to block the game forever just because of that).
 */
export function useAssetPreload(): boolean {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Asset.loadAsync(GAME_IMAGE_ASSETS)
      .catch((err) => {
        console.warn("MemoryMatch: failed to preload game assets", err);
      })
      .finally(() => {
        if (!cancelled) setAssetsReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return assetsReady;
}
