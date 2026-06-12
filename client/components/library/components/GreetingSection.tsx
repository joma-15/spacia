/**
 * GreetingSection.tsx
 * ─────────────────────────────────────────────
 * The top of the screen: welcome text + search bar.
 *
 * The search bar is kept here (not a separate file) because
 * it's visually glued to the greeting and they always appear together.
 */

import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { THEME } from "../theme";

interface Props {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearchClear: () => void;
}

const GreetingSection: React.FC<Props> = ({
  searchQuery,
  onSearchChange,
  onSearchClear,
}) => (
  <View style={styles.wrap}>

    {/* ── Welcome text ── */}
    <Text style={styles.sub}>Welcome back,</Text>
    <Text style={styles.main}>Let's keep learning.</Text>

    {/* ── Search bar ── */}
    <View style={styles.searchBar}>
      <Text style={styles.searchIcon}>🔍</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search subjects..."
        placeholderTextColor={THEME.textMuted}
        value={searchQuery}
        onChangeText={onSearchChange}
        returnKeyType="search"
      />

      {/* Only show the ✕ clear button when there's text to clear */}
      {searchQuery.length > 0 && (
        <TouchableOpacity onPress={onSearchClear}>
          <Text style={styles.clearBtn}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default GreetingSection;

const styles = StyleSheet.create({
  wrap: { marginTop: 24, marginBottom: 30 },
  sub: {
    fontSize: 14, color: THEME.textMuted, fontWeight: "500",
    marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase",
  },
  main: {
    fontSize: 30, fontWeight: "800", color: THEME.textWhite,
    letterSpacing: -0.8, marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: THEME.bgElevated, borderRadius: THEME.radiusFull,
    paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1, borderColor: THEME.borderBright, gap: 10,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1, color: THEME.textWhite,
    fontSize: 14, fontWeight: "500", padding: 0,
  },
  clearBtn: { color: THEME.textMuted, fontSize: 13, fontWeight: "700" },
});