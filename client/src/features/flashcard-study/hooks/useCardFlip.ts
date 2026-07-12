/**
 * useCardFlip.ts
 * ─────────────────────────────────────────────
 * Manages the 3D flip animation for a single flashcard.
 *
 * WHY a separate hook from session logic?
 * Flip animation is purely visual state (is it flipped right now?)
 * while session logic (which card, scores) is business state.
 * Splitting them means each hook stays focused and easy to follow.
 */

import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";

export function useCardFlip() {

  // ── State ────────────────────────────────────────────────────────────────

  /** True once the user has tapped to see the answer */
  const [isFlipped, setIsFlipped] = useState(false);

  /**
   * Controls which face is touchable/visible.
   * We delay this slightly so taps don't register on the "wrong" face
   * mid-animation (see flipCard below).
   */
  const [showBack, setShowBack] = useState(false);

  /** Drives the rotateY animation — 0 = front facing, 180 = back facing */
  const flipAnim = useRef(new Animated.Value(0)).current;
  const faceSwapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
  }, []);

  // ── Interpolated rotation values for each face ─────────────────────────────

  /** Front face rotates from 0deg → 180deg as the card flips */
  const frontInterpolate = flipAnim.interpolate({
    inputRange:  [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  /** Back face rotates from 180deg → 360deg, staying opposite the front */
  const backInterpolate = flipAnim.interpolate({
    inputRange:  [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  /** Flip the card to show whichever face isn't currently showing */
  const flipCard = (): void => {
    const flippingToBack = !isFlipped;
    setIsFlipped(flippingToBack);

    Animated.timing(flipAnim, {
      toValue:  flippingToBack ? 180 : 0,
      duration: 420,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Wait until the card is halfway rotated (90deg) before swapping
    // which face receives touches — this matches when the visible
    // face actually changes from the user's perspective.
    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
    faceSwapTimeoutRef.current = setTimeout(() => {
      setShowBack(flippingToBack);
      faceSwapTimeoutRef.current = null;
    }, 210);
  };

  /** Reset the flip state — called when moving to a new card */
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
