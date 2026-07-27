import { useEffect, useState } from "react";
import { Asset } from "expo-asset";
import { GAME_IMAGE_ASSETS } from "../constants";

/**
 * Downloads/decodes every image the game needs (explosions, spaceship)
 * BEFORE letting the game show them.
 *
 * Why this matters: on a cold app start, an <Image source={require(...)}>
 * can be asked to draw before React Native has finished resolving and
 * caching that image — which is what causes things like "the explosion
 * doesn't show up the very first time". Waiting for `Asset.loadAsync`
 * to finish avoids that.
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
        console.warn("SpaceBlast: failed to preload game assets", err);
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
