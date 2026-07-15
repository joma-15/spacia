/**
 * useCardFlip.ts
 * ─────────────────────────────────────────────
 * Manages the 3D flip animation for a single card.
 */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

export function useCardFlip() {
  /** True once the user has tapped to see the answer */
  const [isFlipped, setIsFlipped] = useState(false);

  /**
   * Controls which face is touchable/visible.
   */
  const [showBack, setShowBack] = useState(false);

  /** Drives the rotateY animation — 0 = front facing, 180 = back facing */
  const flipAnim = useRef(new Animated.Value(0)).current;
  const faceSwapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup
  useEffect(() => () => {
    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
  }, []);

  const frontInterpolate = flipAnim.interpolate({
    inputRange:  [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange:  [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const flipCard = (): void => {
    const flippingToBack = !isFlipped;
    setIsFlipped(flippingToBack);

    Animated.timing(flipAnim, {
      toValue:  flippingToBack ? 180 : 0,
      duration: 420,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
    faceSwapTimeoutRef.current = setTimeout(() => {
      setShowBack(flippingToBack);
      faceSwapTimeoutRef.current = null;
    }, 210);
  };

  const resetFlip = (): void => {
    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
    setIsFlipped(false);
    setShowBack(false);
    flipAnim.setValue(0);
  };

  return {
    isFlipped,
    showBack,
    frontInterpolate,
    backInterpolate,
    flipCard,
    resetFlip,
  };
}
