/**
 * TabRow
 * Segmented control for filtering cards by status:
 * All | Review | Done (Understood).
 */

import React, { memo, useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { TabType } from "../types";
import { COLORS, TABS } from "../constants";

interface Props {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TabRow: React.FC<Props> = ({ activeTab, onTabChange }) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const animation = useRef(new Animated.Value(0)).current;

  const tabIndex = TABS.findIndex((t) => t.key === activeTab);

  useEffect(() => {
    Animated.timing(animation, {
      toValue: tabIndex,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [tabIndex, animation]);

  const tabWidth = containerWidth ? (containerWidth - 6) / 3 : 0;

  const translateX = animation.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [0, tabWidth, tabWidth * 2],
  });

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {containerWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth,
              transform: [{ translateX }],
            },
          ]}
        />
      )}
      {TABS.map(({ key, label }) => {
        const isActive = activeTab === key;

        return (
          <Pressable
            key={key}
            style={styles.tab}
            onPress={() => onTabChange(key)}
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
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    position: "relative",
  },
  indicator: {
    position: "absolute",
    left: 3,
    top: 3,
    bottom: 3,
    backgroundColor: COLORS.primaryDim,
    borderRadius: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1, // Ensure text draws above the absolute indicator
  },
  tabText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "500" },
  tabTextActive: { color: COLORS.primary, fontWeight: "700" },
});