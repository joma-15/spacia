import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Folder, useSelectionWizard } from "./hooks/useSelectionWizard";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

interface FolderItemProps {
  item: Folder;
  onPress: (folder: Folder) => void;
}

/* -------------------------------------------------------------------------- */
/*                                  Constants                                 */
/* -------------------------------------------------------------------------- */

const COLORS = {
  background: "#0F1A14",
  card: "#16221B",
  border: "#223227",
  primary: "#3ED598",
  text: "#FFFFFF",
  secondaryText: "#7C8C82",
  placeholder: "#5A6B60",
  icon: "#F2C94C",
};

/* -------------------------------------------------------------------------- */
/*                                Folder Item                                 */
/* -------------------------------------------------------------------------- */

const FolderItem = React.memo(
  ({ item, onPress }: FolderItemProps) => {
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.75}
        onPress={() => onPress(item)}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: `${item.accentColor}26`,
              },
            ]}
          >
            <View
              style={[
                styles.iconTab,
                {
                  backgroundColor: item.accentColor,
                },
              ]}
            />

            <MaterialCommunityIcons
              name="folder"
              size={30}
              color={COLORS.icon}
            />
          </View>

          <View style={styles.textWrapper}>
            <Text style={styles.folderName}>{item.subject}</Text>

            <View
              style={[
                styles.badge,
                {
                  backgroundColor: `${item.accentColor}22`,
                  borderColor: `${item.accentColor}55`,
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color: item.accentColor,
                  },
                ]}
              >
                {item.cardCount} cards
              </Text>
            </View>
          </View>
        </View>

        <MaterialCommunityIcons
          name="chevron-right"
          size={26}
          color={COLORS.secondaryText}
        />
      </TouchableOpacity>
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                              Selection Wizard                              */
/* -------------------------------------------------------------------------- */

export default function SelectionWizard() {
  const insets = useSafeAreaInsets();
  const { gameRoute } = useLocalSearchParams<{ gameRoute: string }>();

  const [searchQuery, setSearchQuery] = useState("");

  const { folders, loading, refreshing, fetchFolders } = useSelectionWizard();

  const filteredFolders = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return folders.filter((folder) =>
      folder.subject.toLowerCase().includes(normalizedQuery)
    );
  }, [folders, searchQuery]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleSelectFolder = useCallback((folder: Folder) => {
    if (gameRoute) {
      router.push({
        pathname: gameRoute as any,
        params: { folderId: folder.id, folderName: folder.subject }
      });
    } else {
      console.warn("No gameRoute provided to SelectionWizard");
    }
  }, [gameRoute]);

  const handleRefresh = useCallback(() => {
    fetchFolders(true);
  }, [fetchFolders]);

  const renderFolder = useCallback(
    ({ item }: { item: Folder }) => (
      <FolderItem item={item} onPress={handleSelectFolder} />
    ),
    [handleSelectFolder]
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.background}
      />

      {/* Header */}

      <View
        style={[
          styles.headerTop,
          {
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color={COLORS.text}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerLabel}>WELCOME BACK,</Text>
        <Text style={styles.headerTitle}>Choose a folder.</Text>
      </View>

      {/* Search */}

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons
          name="magnify"
          size={22}
          color={COLORS.secondaryText}
        />

        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search folders..."
          placeholderTextColor={COLORS.placeholder}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color={COLORS.placeholder}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* List Header */}

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>My Subjects</Text>

        <Text style={styles.seeAll}>See all →</Text>
      </View>

      {/* Folder List */}

      <FlatList
        data={filteredFolders}
        renderItem={renderFolder}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: insets.bottom + 32,
          },
        ]}
        initialNumToRender={10}
        windowSize={7}
        removeClippedSubviews
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="folder-search-outline"
              size={42}
              color="#3A4A3F"
            />

            <Text style={styles.emptyStateText}>
              No folders found.
            </Text>
          </View>
        }
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/*                                    Styles                                  */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: "center",
    alignItems: "center",
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },

  headerLabel: {
    color: COLORS.secondaryText,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "800",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 14,
    height: 46,
  },

  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 0,
  },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },

  listHeaderTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },

  seeAll: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "600",
  },

  listContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 4,
  },

  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },

  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
    overflow: "hidden",
  },

  iconTab: {
    position: "absolute",
    top: 0,
    left: 12,
    width: 20,
    height: 8,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },

  textWrapper: {
    flexShrink: 1,
  },

  folderName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },

  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },

  emptyStateText: {
    color: COLORS.placeholder,
    fontSize: 15,
    marginTop: 10,
  },
});