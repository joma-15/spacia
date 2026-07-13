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

  // Cleanup: clear pending timers if component unmounts to prevent memory leaks/state updates on unmounted components
  useEffect(() => () => {
    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
  }, []);

  // ── Interpolated rotation values for each face ─────────────────────────────

  /**
   * Rotation Math Map (Interpolation):
   * "Interpolate" maps our animation value range (from 0 to 180) to actual 3D angle degrees 
   * (like "0deg" to "180deg") that React Native can use to rotate components.
   * 
   * Front face rotates from 0deg → 180deg as the card flips.
   */
  const frontInterpolate = flipAnim.interpolate({
    inputRange:  [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  /** Back face rotates from 180deg → 360deg, staying opposite the front face */
  const backInterpolate = flipAnim.interpolate({
    inputRange:  [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  // ── Actions ───────────────────────────────────────────────────────────────

  /** 
   * Flip the card to show whichever face isn't currently showing.
   * Runs a 3D rotate transition that spins the card like a coin.
   */
  const flipCard = (): void => {
    const flippingToBack = !isFlipped;
    setIsFlipped(flippingToBack);

    // Starts the smooth rotation animation
    Animated.timing(flipAnim, {
      toValue:  flippingToBack ? 180 : 0,
      duration: 420,                      // 420 milliseconds duration
      easing:   Easing.out(Easing.cubic),  // Starts fast and slows down towards the end
      useNativeDriver: true,               // Runs on hardware accelerator for extra smoothness
    }).start();

    // Wait until the card is halfway rotated (90 degrees, i.e., at 210ms) before swapping
    // which side is visible and clickable. This makes sure users can't accidentally 
    // click the hidden side of the card before the spin completes.
    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
    faceSwapTimeoutRef.current = setTimeout(() => {
      setShowBack(flippingToBack);
      faceSwapTimeoutRef.current = null;
    }, 210);
  };

  /** Reset the flip state back to the front — called when moving to a new card */
  const resetFlip = (): void => {
    if (faceSwapTimeoutRef.current) clearTimeout(faceSwapTimeoutRef.current);
    setIsFlipped(false);
    setShowBack(false);
    flipAnim.setValue(0); // Instantly resets angle back to 0 without animation
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
