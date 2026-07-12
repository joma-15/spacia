/**
 * TabRow
 * Segmented control for filtering cards by status:
 * All | Review | Done (Understood).
 */

import React, { memo, useCallback, useEffect, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { TabType } from "../types";
import { COLORS, TABS } from "../constants";

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabRow: React.FC<Props> = ({ activeTab, onTabChange }) => {
  // Optimistic highlight so the tab responds on press, not after the list re-renders.
  const [selectedTab, setSelectedTab] = useState(activeTab);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  const handlePress = useCallback(
    (tab: TabType) => {
      if (tab === selectedTab) return;
      setSelectedTab(tab);
      onTabChange(tab);
    },
    [onTabChange, selectedTab],
  );

  return (
    <View style={styles.container}>
      {TABS.map(({ key, label }) => {
        const isActive = selectedTab === key;

        return (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.tab,
              isActive && styles.tabActive,
              pressed && !isActive && styles.tabPressed,
            ]}
            onPress={() => handlePress(key)}
          >
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

export default memo(TabRow);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row", backgroundColor: COLORS.surface,
    borderRadius: 10, padding: 3, marginBottom: 14,
    borderWidth: 1, borderColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  tabPressed: { opacity: 0.75 },
  tabActive: { backgroundColor: COLORS.primaryDim },
  tabText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "500" },
  tabTextActive: { color: COLORS.primary, fontWeight: "700" },
});