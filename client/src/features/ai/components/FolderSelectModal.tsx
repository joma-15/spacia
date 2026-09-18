/**
 * FolderSelectModal.tsx
 * ─────────────────────────────────────────────
 * Bottom sheet / modal allowing the user to select which folder context
 * Spacia AI will use to answer questions, summarize, and quiz.
 */

import React, { useState, useMemo } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AI_THEME } from "../constants";
import { SelectedFolderContext } from "../types";
import { Folder } from "@/features/library/types";

interface FolderSelectModalProps {
  visible: boolean;
  folders: Folder[];
  currentFolder: SelectedFolderContext;
  onSelect: (folder: SelectedFolderContext) => void;
  onClose: () => void;
}

export const FolderSelectModal: React.FC<FolderSelectModalProps> = ({
  visible,
  folders,
  currentFolder,
  onSelect,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders;
    const q = search.toLowerCase().trim();
    return folders.filter((f) => f.subject.toLowerCase().includes(q));
  }, [folders, search]);

  const handleSelectGeneral = () => {
    onSelect({
      id: null,
      name: "All Folders",
      cardCount: folders.reduce((sum, f) => sum + (f.cardCount || 0), 0),
      accentColor: AI_THEME.gold,
    });
    onClose();
  };

  const handleSelectFolder = (f: Folder) => {
    onSelect({
      id: f.id,
      name: f.subject,
      cardCount: f.cardCount,
      accentColor: f.accentColor,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          {/* ── Handle Bar ── */}
          <View style={styles.handle} />

          {/* ── Header ── */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Study Context</Text>
              <Text style={styles.subtitle}>
                Choose a folder for Spacia AI to focus on
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialCommunityIcons
                name="close"
                size={20}
                color={AI_THEME.textMuted}
              />
            </TouchableOpacity>
          </View>

          {/* ── Search Bar ── */}
          <View style={styles.searchBar}>
            <MaterialCommunityIcons
              name="magnify"
              size={18}
              color={AI_THEME.textMuted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search folders..."
              placeholderTextColor={AI_THEME.textDim}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={6}>
                <MaterialCommunityIcons
                  name="close-circle"
                  size={16}
                  color={AI_THEME.textMuted}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* ── "All Folders" Option ── */}
          <TouchableOpacity
            style={[
              styles.folderRow,
              currentFolder.id === null && styles.folderRowActive,
            ]}
            onPress={handleSelectGeneral}
            activeOpacity={0.7}
          >
            <View style={styles.folderRowLeft}>
              <View
                style={[
                  styles.folderIconWrap,
                  { backgroundColor: "rgba(242, 201, 76, 0.15)" },
                ]}
              >
                <MaterialCommunityIcons
                  name="folder-multiple"
                  size={20}
                  color={AI_THEME.gold}
                />
              </View>
              <View>
                <Text style={styles.folderName}>All Folders</Text>
                <Text style={styles.folderDetail}>General Study & All Subjects</Text>
              </View>
            </View>

            {currentFolder.id === null && (
              <MaterialCommunityIcons
                name="check-circle"
                size={20}
                color={AI_THEME.primary}
              />
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* ── Specific Folders List ── */}
          <FlatList
            data={filteredFolders}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            style={styles.list}
            renderItem={({ item }) => {
              const isSelected = currentFolder.id === item.id;
              return (
                <TouchableOpacity
                  style={[
                    styles.folderRow,
                    isSelected && styles.folderRowActive,
                  ]}
                  onPress={() => handleSelectFolder(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.folderRowLeft}>
                    <View
                      style={[
                        styles.folderIconWrap,
                        {
                          backgroundColor: `${item.accentColor || AI_THEME.primary}22`,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="folder"
                        size={20}
                        color={item.accentColor || AI_THEME.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.folderName}>{item.subject}</Text>
                      <Text style={styles.folderDetail}>
                        {item.cardCount || 0} flashcards
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <MaterialCommunityIcons
                      name="check-circle"
                      size={20}
                      color={AI_THEME.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyList}>
                <Text style={styles.emptyListText}>No folders found.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: AI_THEME.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    maxHeight: "75%",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: AI_THEME.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  title: {
    color: AI_THEME.textWhite,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitle: {
    color: AI_THEME.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: AI_THEME.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AI_THEME.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: AI_THEME.border,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    color: AI_THEME.textWhite,
    fontSize: 14,
    paddingVertical: 0,
  },
  divider: {
    height: 1,
    backgroundColor: AI_THEME.border,
    marginVertical: 6,
  },
  list: {
    marginTop: 4,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
  },
  folderRowActive: {
    backgroundColor: AI_THEME.primarySoft,
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.25)",
  },
  folderRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  folderIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  folderName: {
    color: AI_THEME.textWhite,
    fontSize: 15,
    fontWeight: "700",
  },
  folderDetail: {
    color: AI_THEME.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emptyList: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyListText: {
    color: AI_THEME.textDim,
    fontSize: 13,
  },
});
