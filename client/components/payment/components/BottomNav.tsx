/**
 * BottomNav.tsx
 * ─────────────────────────────────────────────
 * Fixed navigation bar pinned to the bottom of the screen.
 *
 * Features:
 *  - Regular tabs: emoji icon + text label + active green dot
 *  - Center tab: large floating "+" button
 *
 * This component only RENDERS — it does not decide where to
 * navigate. That logic lives in the screen via onTabPress.
 */

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NAV_ITEMS } from "../constants";
import { COLORS } from "../colors";
import type { NavTab } from "../types";

interface Props {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
  /** iPhone home indicator height — passed in so we don't hardcode it */
  bottomInset: number;
}

const BottomNav: React.FC<Props> = ({ activeTab, onTabPress, bottomInset }) => (
  <View style={[styles.container, { paddingBottom: Math.max(bottomInset, 8) }]}>
    <View style={styles.inner}>
      {NAV_ITEMS.map((item) => {

        // ── Center "+" floating button ──
        if (item.isCenter) {
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onTabPress(item.id)}
              style={styles.centerWrap}
              activeOpacity={0.85}
            >
              <View style={styles.centerBtn}>
                <Text style={styles.centerIcon}>+</Text>
              </View>
            </TouchableOpacity>
          );
        }

        // ── Regular tab ──
        const isActive = activeTab === item.id;

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onTabPress(item.id)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Text style={[styles.emoji, isActive && styles.emojiActive]}>
              {item.emoji}
            </Text>
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {item.label}
            </Text>
            {/* Small green dot shown only under the active tab */}
            {isActive && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export default BottomNav;

const styles = StyleSheet.create({
  container: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.navBg,
    borderTopWidth: 1, borderTopColor: COLORS.navBorder,
    paddingTop: 10, paddingHorizontal: 8,
  },
  inner: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" },

  tab: { flex: 1, alignItems: "center", paddingVertical: 4, gap: 3, position: "relative" },
  emoji: { fontSize: 22, opacity: 0.45 },
  emojiActive: { opacity: 1 },
  label: { color: COLORS.textDim, fontSize: 10, fontWeight: "500" },
  labelActive: { color: COLORS.accent, fontWeight: "700" },
  activeDot: {
    position: "absolute", bottom: -4,
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.accent,
  },

  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  centerBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12,
    elevation: 8,
    marginTop: -16,
  },
  centerIcon: {
    color: COLORS.bg, fontSize: 28,
    fontWeight: "300", lineHeight: 32, marginTop: -2,
  },
});