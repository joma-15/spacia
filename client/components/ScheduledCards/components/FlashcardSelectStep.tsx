import React, { useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { THEME } from "../../library/theme";
import type { Flashcard } from "../../library/types";

interface Props {
  cards: Flashcard[];
  selectedCardIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

/** Maps a difficulty tag to a theme color, for the small badge on each card. */
const DIFFICULTY_COLOR: Record<string, string> = {
  again: THEME.folderRed,
  hard: THEME.folderOrange,
  easy: THEME.folderGreen,
  mastered: THEME.folderCyan,
};

const FlashcardSelectStep: React.FC<Props> = ({
  cards,
  selectedCardIds,
  onToggle,
  onSelectAll,
  onDeselectAll,
}) => {
  const [query, setQuery] = useState<string>("");
  const filtered = cards.filter((c) =>
    c.question.toLowerCase().includes(query.toLowerCase()),
  );
  const allSelected = cards.length > 0 && selectedCardIds.length === cards.length;

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Select Flashcards</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>
            {selectedCardIds.length}/{cards.length}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.search}
          placeholder="Search flashcards..."
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

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionPill, allSelected && styles.actionPillActive]}
          onPress={onSelectAll}
        >
          <Text style={[styles.actionText, allSelected && styles.actionTextActive]}>
            Select All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionPill} onPress={onDeselectAll}>
          <Text style={styles.actionText}>Deselect All</Text>
        </TouchableOpacity>
      </View>

      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIconCircle}>
            <Text style={styles.emptyIcon}>⌕</Text>
          </View>
          <Text style={styles.emptyText}>No flashcards match "{query}"</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const checked = selectedCardIds.includes(item.id);
            const diffColor = item.difficulty
              ? DIFFICULTY_COLOR[item.difficulty]
              : THEME.textDim;

            return (
              // Outer: shadow + ALWAYS-opaque background (Android elevation rule)
              <View
                style={[
                  styles.cardShadowWrap,
                  { backgroundColor: THEME.bgCard },
                  THEME.cardShadow,
                  checked && THEME.glowShadow,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.card,
                    checked && { backgroundColor: THEME.primaryGlow, borderColor: THEME.primary },
                  ]}
                  onPress={() => onToggle(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardTopRow}>
                    {item.difficulty && (
                      <View style={[styles.diffPill, { borderColor: diffColor }]}>
                        <Text style={[styles.diffText, { color: diffColor }]}>
                          {item.difficulty}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.checkCircle, checked && styles.checkCircleActive]}>
                      {checked && <Text style={styles.checkMark}>✓</Text>}
                    </View>
                  </View>

                  <Text style={styles.question} numberOfLines={3}>
                    {item.question}
                  </Text>

                  <Text style={styles.answerPreview} numberOfLines={1}>
                    {item.answer}
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

export default FlashcardSelectStep;

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
    backgroundColor: THEME.primaryGlow,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: { color: THEME.primary, fontSize: 12, fontWeight: "700" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusMd,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 16, color: THEME.textMuted, fontWeight: "700" },
  search: { flex: 1, paddingVertical: 12, color: THEME.textWhite, fontSize: 14 },
  clearIcon: { color: THEME.textMuted, fontSize: 13, fontWeight: "700", paddingLeft: 4 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  actionPill: {
    borderRadius: THEME.radiusFull,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    backgroundColor: THEME.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  actionPillActive: {
    backgroundColor: THEME.primaryGlow,
    borderColor: THEME.primary,
  },
  actionText: { color: THEME.textMid, fontWeight: "700", fontSize: 12 },
  actionTextActive: { color: THEME.primary },

  columnWrapper: { justifyContent: "space-between" },

  // Shadow + ALWAYS-opaque background. Never make this transparent.
  cardShadowWrap: {
    width: CARD_WIDTH,
    marginBottom: 12,
    borderRadius: THEME.radiusLg,
  },

  // Content + selection tint — safe to be transparent, no shadow here.
  card: {
    borderRadius: THEME.radiusLg,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
    minHeight: 140,
    overflow: "hidden",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  diffPill: {
    borderWidth: 1,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  diffText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },

  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: THEME.radiusFull,
    borderWidth: 1.5,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: "auto",
  },
  checkCircleActive: {
    borderColor: THEME.primary,
    backgroundColor: THEME.primary,
  },
  checkMark: { color: THEME.bg, fontSize: 12, fontWeight: "700" },

  question: {
    color: THEME.textWhite,
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 8,
  },
  answerPreview: {
    color: THEME.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },

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