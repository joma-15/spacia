/**
 * PerkList.tsx
 * ─────────────────────────────────────────────
 * Renders all three PerkSection cards with staggered entrance animations.
 *
 * The stagger is achieved by passing an increasing `delay` to each
 * PerkSection — each card waits a little longer before fading in,
 * creating a cascade effect that feels polished and intentional.
 *
 * Pure display component — receives data from constants, no props needed.
 */

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import PerkSection from "./PerkSection";
import { PERKS } from "../constants";
import { COLORS } from "../colors";

/** How many milliseconds to wait between each card's entrance */
const STAGGER_DELAY_MS = 150;

/** The first card starts fading in after this many ms */
const BASE_DELAY_MS = 300;

const PerkList: React.FC = () => (
  <View>
    {PERKS.map((perk, index) => (
      <PerkSection
        key={index}
        emoji={perk.emoji}
        title={perk.title}
        items={perk.items}
        delay={BASE_DELAY_MS + index * STAGGER_DELAY_MS}
      />
    ))}

    {/* ── Legal footer note below the feature cards ── */}
    <Text style={styles.footerNote}>
      Cancel anytime. No hidden fees.{"\n"}
      Billed as a single payment for annual plans.
    </Text>
  </View>
);

export default PerkList;

const styles = StyleSheet.create({
  footerNote: {
    color: COLORS.textDim,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 20,
  },
});