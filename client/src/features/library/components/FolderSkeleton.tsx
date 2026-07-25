import React from "react";
import { StyleSheet, View } from "react-native";
import { THEME } from "../theme";
import { Skeleton } from "@/shared/components/Skeleton";

export const FolderSkeleton: React.FC = () => {
  return (
    <View style={[styles.card, THEME.cardShadow]}>
      {/* ── Folder icon skeleton ── */}
      <View style={styles.iconWrap}>
        <Skeleton width={28} height={8} borderRadius={4} style={styles.folderTab} />
        <View style={styles.folderBodyOuter}>
          <Skeleton width={62} height={48} borderRadius={8} style={styles.folderBody} />
        </View>
      </View>

      {/* ── Title skeleton ── */}
      <Skeleton width="80%" height={16} borderRadius={4} style={styles.title} />

      {/* ── Badge skeleton ── */}
      <Skeleton width={80} height={20} borderRadius={10} style={styles.countBadge} />
    </View>
  );
};

export const FolderSkeletonGrid: React.FC = () => {
  return (
    <View style={styles.grid}>
      {[1, 2, 3, 4].map((i) => (
        <FolderSkeleton key={i} />
      ))}
    </View>
  );
};

export default FolderSkeletonGrid;

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 22,
  },
  card: {
    width: "47%",
    backgroundColor: THEME.bgCard,
    borderRadius: THEME.radiusMd,
    padding: 16,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    height: 154,
  },
  iconWrap: { marginTop: 18, marginBottom: 14, alignSelf: "flex-start" },
  folderTab: {
    marginBottom: -1,
    opacity: 0.15,
  },
  folderBodyOuter: {
    width: 62,
    height: 48,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    overflow: "hidden",
  },
  folderBody: {
    opacity: 0.1,
  },
  title: {
    marginBottom: 10,
    opacity: 0.15,
  },
  countBadge: {
    alignSelf: "flex-start",
    opacity: 0.15,
  },
});
