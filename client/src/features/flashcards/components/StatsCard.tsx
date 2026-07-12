/**
 * StatsCard
 * Displays total / in-review / understood counts plus a mastery
 * progress bar. Pure display component — receives all data as props.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../constants";

interface Props {
  total: number;
  reviewCount: number;
  understoodCount: number;
  progress: number; // 0–1
}

const StatsCard: React.FC<Props> = ({ total, reviewCount, understoodCount, progress }) => (
  <View style={styles.card}>
    {/* ── Stat columns ── */}
    <View style={styles.row}>
      <StatColumn label="Total" value={total} />
      <View style={styles.divider} />
      <StatColumn label="In Review" value={reviewCount} valueColor={COLORS.tagOrangeBorder} />
      <View style={styles.divider} />
      <StatColumn label="Understood" value={understoodCount} valueColor={COLORS.primary} />
    </View>

    {/* ── Progress bar ── */}
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${Math.round(progress * 100)}%` as any }]} />
    </View>
    <Text style={styles.label}>{Math.round(progress * 100)}% mastered</Text>
  </View>
);

// ─── StatColumn ───────────────────────────────────────────────────────────────
/** Single statistic column used inside StatsCard */

interface StatColumnProps {
  label: string;
  value: number;
  valueColor?: string;
}

const StatColumn: React.FC<StatColumnProps> = ({ label, value, valueColor }) => (
  <View style={styles.statItem}>
    <Text style={[styles.statNumber, valueColor ? { color: valueColor } : undefined]}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

export default StatsCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface, borderRadius: 14,
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    marginBottom: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  row: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", marginBottom: 12 },
  statItem: { alignItems: "center", flex: 1 },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
  statNumber: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 1, letterSpacing: 0.3 },
  track: { height: 5, backgroundColor: COLORS.surfaceElevated, borderRadius: 3, overflow: "hidden" },
  fill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },
  label: { color: COLORS.textMuted, fontSize: 10, marginTop: 5, textAlign: "right", letterSpacing: 0.2 },
});