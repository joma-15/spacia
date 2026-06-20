import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { THEME } from "../../theme";
import type { Flashcard } from "../../types";

interface Props {
  cards: Flashcard[];
  selectedCardIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
}

const FlashcardSelectStep: React.FC<Props> = ({
  cards, selectedCardIds, onToggle, onSelectAll, onDeselectAll,
}) => {
  const [query, setQuery] = useState<string>("");
  const filtered = cards.filter((c) => c.question.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Select Flashcards</Text>

      <TextInput
        style={styles.search}
        placeholder="Search flashcards..."
        placeholderTextColor={THEME.textMuted}
        value={query}
        onChangeText={setQuery}
      />

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={onSelectAll}>
          <Text style={styles.actionText}>Select All</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onDeselectAll}>
          <Text style={styles.actionText}>Deselect All</Text>
        </TouchableOpacity>
        <Text style={styles.countText}>
          Selected: {selectedCardIds.length} / {cards.length}
        </Text>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const checked = selectedCardIds.includes(item.id);
          return (
            <TouchableOpacity style={styles.row} onPress={() => onToggle(item.id)}>
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default FlashcardSelectStep;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: { fontSize: 18, fontWeight: "700", color: THEME.textWhite, marginBottom: 14 },
  search: {
    backgroundColor: THEME.bgElevated, borderRadius: 12, padding: 12,
    color: THEME.textWhite, borderWidth: 1, borderColor: THEME.borderBright, marginBottom: 12,
  },
  actionsRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 12 },
  actionText: { color: THEME.primary, fontWeight: "700", fontSize: 12 },
  countText: { color: THEME.textMuted, fontSize: 12, fontWeight: "600", marginLeft: "auto" },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: THEME.bgCard, borderRadius: THEME.radiusMd,
    padding: 12, marginBottom: 8, borderWidth: 1, borderColor: THEME.border,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: THEME.borderBright,
    justifyContent: "center", alignItems: "center",
  },
  checkboxChecked: { backgroundColor: THEME.primary, borderColor: THEME.primary },
  checkmark: { color: THEME.bg, fontSize: 13, fontWeight: "900" },
  question: { flex: 1, color: THEME.textWhite, fontSize: 13, fontWeight: "500" },
});