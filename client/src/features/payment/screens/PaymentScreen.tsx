/**
 * PaymentScreen.tsx
 * ─────────────────────────────────────────────
 * Root screen for the Premium subscription upsell.
 *
 * This file's ONLY job is to:
 *  1. Pull all state + animations from usePaymentScreen
 *  2. Calculate layout offsets (nav height, scroll padding)
 *  3. Assemble the sub-components into the final layout
 */

import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// ── Hook ──────────────────────────────────────────────────────────────────────
import { usePaymentScreen } from "../hooks/usePaymentScreen";

// ── Components ────────────────────────────────────────────────────────────────
import PageHeader from "../components/PageHeader";
import PlanSelector from "../components/PlanSelector";
import SavingsCallout from "../components/SavingsCallout";
import FeatureDivider from "../components/FeatureDivider";
import PerkList from "../components/PerkList";
import CtaButton from "../components/CtaButton";

// ── Colors ────────────────────────────────────────────────────────────────────
import { COLORS } from "../colors";

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const {
    isTablet,
    selectedPlan,
    loadingPurchase,
    headerFade,
    buttonSlide,
    buttonFade,
    shimmerOpacity,
    setSelectedPlan,
    handlePurchase,
    ctaLabel,
  } = usePaymentScreen();

  // Position the sticky CTA button comfortably above the bottom safe area
  const bottomOffset = Math.max(insets.bottom, 16);
  const CTA_HEIGHT = 80;
  const scrollBottom = bottomOffset + CTA_HEIGHT + 32;

  const canGoBack = router.canGoBack();

  return (
    <SafeAreaView style={styles.root} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* ── Top Bar with Back Button when opened as a stack/modal screen ── */}
      {canGoBack && (
        <View
          style={[
            styles.topNav,
            { paddingHorizontal: isTablet ? 40 : 20 },
          ]}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={8}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={COLORS.text}
            />
          </TouchableOpacity>
        </View>
      )}

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

      {/* ── Sticky CTA button floating above bottom edge ── */}
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
  root: { flex: 1, backgroundColor: COLORS.bg },
  topNav: {
    paddingTop: 8,
    paddingBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { paddingTop: 12 },
});
