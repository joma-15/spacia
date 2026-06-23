import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { THEME } from "../../library/theme";
import type { Folder } from "../../library/types";

interface Props {
  folders: Folder[];
  selectedFolder: Folder | null;
  onSelect: (folder: Folder) => void;
}

const tint = (hex: string, alpha: string = "20") => `${hex}${alpha}`;

const FolderSelectStep: React.FC<Props> = ({ folders, selectedFolder, onSelect }) => {
  const [query, setQuery] = useState<string>("");
  const filtered = folders.filter((f) => f.subject.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Select a Folder</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {folders.length} {folders.length === 1 ? "folder" : "folders"}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.search}
          placeholder="Search folders..."
          placeholderTextColor={THEME.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={8}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>⌕</Text>
          </View>
          <Text style={styles.emptyText}>No folders match "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = selectedFolder?.id === item.id;
            return (
              // Outer wrapper: shadow ONLY. Background must stay OPAQUE
              // (THEME.bgCard) always — Android elevation breaks and
              // renders a black box if this background is transparent.
              <View
                style={[
                  styles.cardShadowWrap,
                  { backgroundColor: THEME.bgCard },
                  THEME.cardShadow,
                  isSelected && THEME.glowShadow,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.card,
                    // The selected tint lives HERE instead — this view has
                    // no elevation, so a semi-transparent color is safe.
                    isSelected && { backgroundColor: THEME.primaryGlow, borderColor: THEME.primary },
                  ]}
                  onPress={() => onSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.accentTab, { backgroundColor: item.accentColor }]} />

                  <View style={styles.cardTopRow}>
                    <View style={[styles.iconBox, { backgroundColor: tint(item.accentColor, "25") }]}>
                      <Text style={styles.folderEmoji}>📂</Text>
                    </View>

                    <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                      {isSelected && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.subject}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

export default FolderSelectStep;

const CARD_WIDTH = "48%";

const styles = StyleSheet.create({
  wrap: { flex: 1 },

  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  heading: { fontSize: 18, fontWeight: "700", color: THEME.textWhite },
  countBadge: {
    backgroundColor: THEME.accentDim,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: { color: THEME.accent, fontSize: 11, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusMd,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    marginBottom: 16,
    gap: 8,
  },
  searchIcon: { fontSize: 16, color: THEME.textMuted, fontWeight: "700" },
  search: { flex: 1, paddingVertical: 12, color: THEME.textWhite, fontSize: 14 },
  clearIcon: { color: THEME.textMuted, fontSize: 13, fontWeight: "700", paddingLeft: 4 },

  columnWrapper: { justifyContent: "space-between" },

  // Shadow + ALWAYS-opaque background. Never put a transparent color here.
  cardShadowWrap: {
    width: CARD_WIDTH,
    marginBottom: 14,
    borderRadius: THEME.radiusLg,
  },

  // Clipping + selected tint live here — safe to use transparency,
  // since this view has no elevation/shadow of its own.
  card: {
    borderRadius: THEME.radiusLg,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    overflow: "hidden",
  },

  accentTab: {
    position: "absolute",
    top: 0,
    left: 14,
    width: 28,
    height: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginTop: 6,
    marginBottom: 12,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: THEME.radiusMd,
    alignItems: "center",
    justifyContent: "center",
  },
  folderEmoji: { fontSize: 24 },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: THEME.radiusFull,
    borderWidth: 1.5,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primary,
  },
  checkMark: { color: THEME.bg, fontSize: 12, fontWeight: "700" },

  cardTitle: { color: THEME.textWhite, fontWeight: "700", fontSize: 15, marginBottom: 8 },

  emptyWrap: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: THEME.radiusFull,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: { fontSize: 20, color: THEME.textMuted, fontWeight: "700" },
  emptyText: { color: THEME.textMid, fontSize: 13, fontWeight: "600" },
});