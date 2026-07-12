/**
 * usePaymentScreen.ts
 * ─────────────────────────────────────────────
 * Custom hook — all state and logic for the Payment screen.
 *
 * WHAT IS A HOOK?
 * A function starting with "use" that holds React state and logic.
 * By moving everything here, the screen component only handles
 * layout — this hook handles all the behaviour.
 */

import { useEffect, useRef, useState } from "react";
import { Animated, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import type { NavTab, PlanType } from "../types";
import { PRICING } from "../constants";

export function usePaymentScreen() {
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();

  // ── Layout ────────────────────────────────────────────────────────────────

  /** True when the screen is tablet-width (≥ 768px) */
  const isTablet = windowWidth >= 768;

  // ── UI state ──────────────────────────────────────────────────────────────

  /** Which billing plan the user has selected */
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("annual");

  /** Whether the purchase is currently being processed */
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const purchaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Which bottom nav tab is currently active */
  const [activeTab, setActiveTab] = useState<NavTab>("stats");

  // ── Entrance animations ───────────────────────────────────────────────────

  const headerFade  = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(40)).current;
  const buttonFade  = useRef(new Animated.Value(0)).current;

  /**
   * Looping shimmer for the CTA button.
   * Goes 0 → 1 → 0 repeatedly to create a breathing glow effect.
   */
  const shimmer = useRef(new Animated.Value(0)).current;

  /** Interpolated opacity value used on the CTA button */
  const shimmerOpacity = shimmer.interpolate({
    inputRange:  [0, 0.5, 1],
    outputRange: [0.85, 1, 0.85],
  });

  useEffect(() => {
    // Fade in the header immediately on mount
    Animated.timing(headerFade, {
      toValue: 1, duration: 600, useNativeDriver: true,
    }).start();

    // Slide + fade the CTA button up from below after a short delay
    Animated.parallel([
      Animated.timing(buttonFade,  { toValue: 1, duration: 500, delay: 800, useNativeDriver: true }),
      Animated.timing(buttonSlide, { toValue: 0, duration: 500, delay: 800, useNativeDriver: true }),
    ]).start();

    // Loop the shimmer forever
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    return () => {
      if (purchaseTimeoutRef.current) {
        clearTimeout(purchaseTimeoutRef.current);
      }
    };
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  /**
   * Simulate a purchase API call.
   * Replace the setTimeout with your real payment SDK call.
   */
  const handlePurchase = (): void => {
    setLoadingPurchase(true);
    if (purchaseTimeoutRef.current) clearTimeout(purchaseTimeoutRef.current);
    purchaseTimeoutRef.current = setTimeout(() => {
      setLoadingPurchase(false);
      purchaseTimeoutRef.current = null;
    }, 2000);
  };

  /**
   * Handle bottom nav tab press.
   * Some tabs navigate to a different screen; others just update the active tab.
   */
  const handleTabPress = (tab: NavTab): void => {
    setActiveTab(tab);
    if (tab === "popup") {
      router.push("/LibraryScreen");
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────

  /** The label shown inside the CTA button — changes when plan changes */
  const ctaLabel =
    selectedPlan === "annual"
      ? `Start Annual — ${PRICING.annual.display}`
      : `Start Monthly — ${PRICING.monthly.display}`;

  return {
    // layout
    isTablet,
    // state
    selectedPlan,
    loadingPurchase,
    activeTab,
    // animations
    headerFade,
    buttonSlide,
    buttonFade,
    shimmerOpacity,
    // actions
    setSelectedPlan,
    handlePurchase,
    handleTabPress,
    // derived
    ctaLabel,
  };
}
