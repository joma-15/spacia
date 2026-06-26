/**
 * PaymentScreen.tsx
 * ─────────────────────────────────────────────
 * Root screen for the Premium subscription upsell.
 *
 * This file's ONLY job is to:
 *  1. Pull all state + animations from usePaymentScreen
 *  2. Calculate layout offsets (nav height, scroll padding)
 *  3. Assemble the sub-components into the final layout
 *
 * CHANGE THE LOOK   → edit the component files
 * CHANGE THE LOGIC  → edit usePaymentScreen.ts
 * CHANGE THE COLORS → edit colors.ts
 * CHANGE THE DATA   → edit constants.ts
 */

import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ── Hook ──────────────────────────────────────────────────────────────────────
import { usePaymentScreen } from "../../components/payment/hooks/usePaymentScreen";

// ── Components ────────────────────────────────────────────────────────────────
import PageHeader      from "../../components/payment/components/PageHeader";
import PlanSelector    from "../../components/payment/components/PlanSelector";
import SavingsCallout  from "../../components/payment/components/SavingsCallout";
import FeatureDivider  from "../../components/payment/components/FeatureDivider";
import PerkList        from "../../components/payment/components/PerkList";
import CtaButton       from "../../components/payment/components/CtaButton";

// ── Colors ────────────────────────────────────────────────────────────────────
import { COLORS } from "../../components/payment/colors";

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();

  const {
    isTablet,
    selectedPlan,
    loadingPurchase,
    activeTab,
    headerFade,
    buttonSlide,
    buttonFade,
    shimmerOpacity,
    setSelectedPlan,
    handlePurchase,
    handleTabPress,
    ctaLabel,
  } = usePaymentScreen();

  // ── Layout offset calculations ─────────────────────────────────────────────

  /**
   * Total height from the bottom of the visible area to the top of the nav bar.
   * Used to position the CTA button just above the nav bar.
   */
  const NAV_BAR_HEIGHT = isTablet ? 72 : 64;
  const bottomOffset = NAV_BAR_HEIGHT + Math.max(insets.bottom, 8);

  /**
   * Extra padding at the bottom of the scroll view so the last item
   * isn't hidden behind the sticky CTA button + nav bar.
   */
  const CTA_HEIGHT   = 110;
  const scrollBottom = bottomOffset + CTA_HEIGHT;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: isTablet ? 40 : 20,
            paddingBottom: scrollBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Crown + headline + subheadline ── */}
        <PageHeader fadeAnim={headerFade} isTablet={isTablet} />

        {/* ── Monthly | Annual plan picker ── */}
        <PlanSelector
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          isTablet={isTablet}
        />

        {/* ── "You're saving $5" banner — only shown for annual ── */}
        {selectedPlan === "annual" && <SavingsCallout />}

        {/* ── "─── Everything included ───" divider ── */}
        <FeatureDivider />

        {/* ── Three animated feature section cards ── */}
        <PerkList />
      </ScrollView>

      {/* ── Sticky CTA button floating above the nav bar ── */}
      <CtaButton
        label={ctaLabel}
        loading={loadingPurchase}
        onPress={handlePurchase}
        isTablet={isTablet}
        bottomOffset={bottomOffset}
        buttonFade={buttonFade}
        buttonSlide={buttonSlide}
        shimmerOpacity={shimmerOpacity}
        horizontalPadding={isTablet ? 40 : 20}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingTop: 20 },
});