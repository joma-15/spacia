/**
 * TabRow
 * Segmented control for filtering cards by status:
 * All | Review | Done (Understood).
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { TabType } from "../types";
import { COLORS, TABS } from "../constants";

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabRow: React.FC<Props> = ({ activeTab, onTabChange }) => (
  <View style={styles.container}>
    {TABS.map(({ key, label }) => (
      <TouchableOpacity
        key={key}
        style={[styles.tab, activeTab === key && styles.tabActive]}
        onPress={() => onTabChange(key)}
      >
        <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

export default TabRow;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 3, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.primaryDim },
  tabText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "500" },
  tabTextActive: { color: COLORS.primary, fontWeight: "700" },
});