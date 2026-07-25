import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../constants";
import { Skeleton } from "@/shared/components/Skeleton";

export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      {/* ── Badge and actions skeleton ── */}
      <View style={styles.header}>
        <Skeleton width={90} height={18} borderRadius={9} style={styles.opacityMuted} />
        <View style={styles.actions}>
          <Skeleton width={28} height={28} borderRadius={7} style={styles.opacityMuted} />
          <Skeleton width={28} height={28} borderRadius={7} style={styles.opacityMuted} />
        </View>
      </View>

      {/* ── Question lines skeleton ── */}
      <Skeleton width="90%" height={16} borderRadius={4} style={styles.textLine} />
      <Skeleton width="60%" height={16} borderRadius={4} style={styles.textLine} />

      {/* ── Footer skeleton ── */}
      <View style={styles.footer}>
        <Skeleton width={100} height={12} borderRadius={4} style={styles.opacityMuted} />
        <Skeleton width={80} height={26} borderRadius={13} style={styles.opacityMuted} />
      </View>
    </View>
  );
};

export const CardSkeletonList: React.FC = () => {
  return (
    <View style={styles.list}>
      {[1, 2, 3].map((i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  );
};

export default CardSkeletonList;

const styles = StyleSheet.create({
  list: {
    paddingBottom: 20,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  textLine: {
    marginBottom: 8,
    opacity: 0.15,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  opacityMuted: {
    opacity: 0.15,
  },
});
