/**
 * PlanSelector.tsx
 * ─────────────────────────────────────────────
 * The two side-by-side plan cards (Monthly | Annual).
 *
 * Extracts the row layout so PaymentScreen doesn't need
 * to know about the grid spacing or tablet sizing adjustments.
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import PlanCard from "./PlanCard";
import { PRICING, SAVINGS_PERCENT } from "../constants";
import type { PlanType } from "../types";

interface Props {
  selectedPlan: PlanType;
  onSelectPlan: (plan: PlanType) => void;
  isTablet: boolean;
}

const PlanSelector: React.FC<Props> = ({ selectedPlan, onSelectPlan, isTablet }) => (
  <View style={[styles.row, isTablet && styles.rowTablet]}>

    {/* ── Monthly plan card ── */}
    <PlanCard
      label="Monthly"
      price={PRICING.monthly.display}
      selected={selectedPlan === "monthly"}
      onSelect={() => onSelectPlan("monthly")}
    />

    {/* ── Annual plan card — includes savings badge and per-month breakdown ── */}
    <PlanCard
      label="Annual"
      price={PRICING.annual.display}
      perMonth={PRICING.annual.perMonth}
      badge={`SAVE ${SAVINGS_PERCENT}%`}
      selected={selectedPlan === "annual"}
      onSelect={() => onSelectPlan("annual")}
    />
  </View>
);

export default PlanSelector;

const styles = StyleSheet.create({
  row:       { flexDirection: "row", gap: 12, marginBottom: 14 },
  rowTablet: { gap: 20 },
});