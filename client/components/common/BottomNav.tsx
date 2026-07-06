/**
 * BottomNav.tsx
 * ─────────────────────────────────────────────
 * The fixed navigation bar pinned to the bottom of the screen.
 *
 * Features:
 *  - Regular tabs with an emoji icon + label + active dot indicator
 *  - A special "center" tab rendered as a large floating "+" button
 *
 * It does NOT decide where to navigate — it just tells the parent
 * which tab was tapped via onTabPress / onAddPress callbacks.
 */

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NAV_ITEMS } from "../library/constants";
import { THEME } from "../library/theme";
import { useAddFolder } from "../../context/AddFolderContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// interface Props {
//   /** Currently selected tab — used to highlight the active item */
//   activeTab: NavTab;
//   /** Called when the user taps any non-center tab */
//   onTabPress: (tab: NavTab) => void;
//   /** How much space to leave at the very bottom (iPhone home bar, etc.) */
//   bottomInset: number;
//   /** Called when the user taps the center "+" button */
//   onAddPress: () => void;
// }

const BottomNav = ({ state, navigation, insets }: any) => {
  const { setAddModalVisible } = useAddFolder();

  return (
    <View
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.inner}>
        {NAV_ITEMS.map((item) => {
          // ── Center "+" button — rendered differently from normal tabs ──
          if (item.isCenter) {
            return (
              <TouchableOpacity
                key={item.id}
                onPress={() => setAddModalVisible(true)}
                style={styles.centerWrap}
                activeOpacity={0.85}
              >
                <View style={styles.centerBtn}>
                  <Text style={styles.centerIcon}>+</Text>
                </View>
              </TouchableOpacity>
            );
          }

          // ── Normal tab ──
          const isActive = state.routes[state.index].name === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => navigation.navigate(item.id)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              {/* Emoji icon — brighter when active */}
              <MaterialCommunityIcons
                name={item.icon}
                size={24}
                color={isActive ? THEME.primary : THEME.textDim}
              />

              {/* Label — green + bold when active */}
              <Text style={[styles.label, isActive && styles.labelActive]}>
                {item.label}
              </Text>

              {/* Small green dot below active tab */}
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

export default BottomNav;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: THEME.navBg,
    borderTopWidth: 1,
    borderTopColor: THEME.navBorder,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  inner: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },

  // ── Normal tab ──
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    gap: 3,
    position: "relative",
  },
  emoji: { fontSize: 22, opacity: 0.45 },
  emojiActive: { opacity: 1 },
  label: { color: THEME.textDim, fontSize: 10, fontWeight: "500" },
  labelActive: { color: THEME.primary, fontWeight: "700" },
  activeDot: {
    position: "absolute",
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.primary,
  },

  // ── Center "+" button ──
  centerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginTop: -16, // lifts the button above the nav bar
  },
  centerIcon: {
    color: THEME.bg,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
    marginTop: -2,
  },
});
