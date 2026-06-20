import React, { useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { THEME } from "../../theme";
import type { Folder } from "../../types";

interface Props {
  folders: Folder[];
  selectedFolder: Folder | null;
  onSelect: (folder: Folder) => void;
}

const FolderSelectStep: React.FC<Props> = ({ folders, selectedFolder, onSelect }) => {
  const [query, setQuery] = useState<string>("");
  const filtered = folders.filter((f) => f.subject.toLowerCase().includes(query.toLowerCase()));

  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Select a Folder</Text>

      <TextInput
        style={styles.search}
        placeholder="Search folders..."
        placeholderTextColor={THEME.textMuted}
        value={query}
        onChangeText={setQuery}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => {
          const isSelected = selectedFolder?.id === item.id;
          return (
            <TouchableOpacity
              style={[styles.row, isSelected && styles.rowSelected]}
              onPress={() => onSelect(item)}
            >
              <View style={[styles.iconDot, { backgroundColor: item.accentColor }]} />
              <Text style={styles.rowTitle}>{item.subject}</Text>
              <Text style={styles.rowCount}>{item.cardCount} cards</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default FolderSelectStep;

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  heading: { fontSize: 18, fontWeight: "700", color: THEME.textWhite, marginBottom: 14 },
  search: {
    backgroundColor: THEME.bgElevated, borderRadius: 12, padding: 12,
    color: THEME.textWhite, borderWidth: 1, borderColor: THEME.borderBright, marginBottom: 14,
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: THEME.bgCard, borderRadius: THEME.radiusMd,
    padding: 14, marginBottom: 10, borderWidth: 1, borderColor: THEME.border,
  },
  rowSelected: { borderColor: THEME.primary, backgroundColor: THEME.primaryGlow },
  iconDot: { width: 10, height: 10, borderRadius: 5 },
  rowTitle: { flex: 1, color: THEME.textWhite, fontWeight: "700", fontSize: 14 },
  rowCount: { color: THEME.textMuted, fontSize: 12, fontWeight: "600" },
});