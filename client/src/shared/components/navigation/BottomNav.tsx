/**
 * BottomNav.tsx
 * ─────────────────────────────────────────────
 * The fixed navigation bar pinned to the bottom of the screen.
 *
 * Features:
 *  - Regular tabs with an emoji icon + label + active dot indicator
 *  - A special "center" tab rendered as a large floating "+" button
 *  - Smooth spring-scale on active icon + dot fade-in per tab
 *
 * It does NOT decide where to navigate — it just tells the parent
 * which tab was tapped via onTabPress / onAddPress callbacks.
 */

import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NAV_ITEMS } from "@/features/library/constants";
import { THEME } from "@/features/library/theme";
import { useAddFolder } from "@/shared/context/AddFolderContext";
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

/** Animated tab item — handles its own scale + dot-fade per tab */
const AnimatedTabItem = ({
  item,
  isActive,
  onPress,
}: {
  item: (typeof NAV_ITEMS)[number];
  isActive: boolean;
  onPress: () => void;
}) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.88)).current;
  const dotOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1 : 0.88,
        useNativeDriver: true,
        speed: 24,
        bounciness: 4,
      }),
      Animated.timing(dotOpacity, {
        toValue: isActive ? 1 : 0,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.tab}
      activeOpacity={0.7}
    >
      {/* Icon — springs up when active */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <MaterialCommunityIcons
          name={item.icon}
          size={24}
          color={isActive ? THEME.primary : THEME.textDim}
        />
      </Animated.View>

      {/* Label — green + bold when active */}
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {item.label}
      </Text>

      {/* Small green dot below active tab — fades in smoothly */}
      <Animated.View style={[styles.activeDot, { opacity: dotOpacity }]} />
    </TouchableOpacity>
  );
};

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
                onPress={() => {
                  const currentRoute = state.routes[state.index].name;
                  if (currentRoute !== "library") {
                    navigation.navigate("library");
                  }
                  // Small timeout ensures transition to active screen finishes before modal/keyboard opens
                  setTimeout(() => {
                    setAddModalVisible(true);
                  }, 100);
                }}
                style={styles.centerWrap}
                activeOpacity={0.85}
              >
                <View style={styles.centerBtn}>
                  <Text style={styles.centerIcon}>+</Text>
                </View>
              </TouchableOpacity>
            );
          }

          // ── Normal animated tab ──
          const isActive = state.routes[state.index].name === item.id;

          return (
            <AnimatedTabItem
              key={item.id}
              item={item}
              isActive={isActive}
              onPress={() => navigation.navigate(item.id)}
            />
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
