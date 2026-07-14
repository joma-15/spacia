import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";

/* ----------------------------- Interfaces ----------------------------- */

interface Folder {
  id: string;
  name: string;
  flashcards: number;
  color: string; // accent color for the folder icon / tag
}

interface FolderItemProps {
  folder: Folder;
  onPress: (folder: Folder) => void;
}

interface SelectionWizardProps {
  onBackPress?: () => void;
}

/* ------------------------------ Mock Data ------------------------------ */

const MOCK_FOLDERS: Folder[] = [
  {
    id: "1",
    name: "Computer Engineering",
    flashcards: 120,
    color: "#4C8DFF",
  },
  {
    id: "2",
    name: "Mathematics",
    flashcards: 85,
    color: "#3ED598",
  },
  {
    id: "3",
    name: "Programming",
    flashcards: 56,
    color: "#F26D8D",
  },
  {
    id: "4",
    name: "Physics",
    flashcards: 24,
    color: "#4C8DFF",
  },
  {
    id: "5",
    name: "Biology",
    flashcards: 32,
    color: "#F26D8D",
  },
  {
    id: "6",
    name: "Science",
    flashcards: 27,
    color: "#E0B84C",
  },
];

/* ---------------------------- Folder Item ------------------------------ */

const FolderItem: React.FC<FolderItemProps> = ({ folder, onPress }) => {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.75}
      onPress={() => onPress(folder)}
    >
      <View style={styles.cardLeft}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: `${folder.color}26` },
          ]}
        >
          <View
            style={[styles.iconTab, { backgroundColor: folder.color }]}
          />
          <MaterialCommunityIcons name="folder" size={30} color="#F2C94C" />
        </View>

        <View style={styles.textWrapper}>
          <Text style={styles.folderName}>{folder.name}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: `${folder.color}22`,
                borderColor: `${folder.color}55`,
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: folder.color }]}>
              {folder.flashcards} cards
            </Text>
          </View>
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={26} color="#7C8C82" />
    </TouchableOpacity>
  );
};

/* ------------------------------ Component ------------------------------ */

const SelectionWizard: React.FC<SelectionWizardProps> = ({ onBackPress }) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFolders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return MOCK_FOLDERS;
    return MOCK_FOLDERS.filter((folder) =>
      folder.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectFolder = (folder: Folder) => {
    // Navigation will be implemented later
    console.log("Selected folder:", folder);
  };

  const handleBackPress = () => {
    // Navigation will be implemented later
    // if (onBackPress) {
    //   onBackPress();
    // } else {
    //   console.log("Back pressed");
    // }
    router.back();
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0F1A14" />

      <View
        style={[
          styles.headerTop,
          { paddingTop: insets.top + 12 },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={handleBackPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={22}
            color="#FFFFFF"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <Text style={styles.headerLabel}>WELCOME BACK,</Text>
        <Text style={styles.headerTitle}>Choose a folder.</Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialCommunityIcons name="magnify" size={22} color="#7C8C82" />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search folders..."
          placeholderTextColor="#5A6B60"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons
              name="close-circle"
              size={18}
              color="#5A6B60"
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listHeaderTitle}>My Subjects</Text>
        <Text style={styles.seeAll}>See all →</Text>
      </View>

      <FlatList
        data={filteredFolders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <FolderItem folder={item} onPress={handleSelectFolder} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="folder-search-outline"
              size={40}
              color="#3A4A3F"
            />
            <Text style={styles.emptyStateText}>
              No folders match "{searchQuery}"
            </Text>
          </View>
        }
      />
    </View>
  );
};

export default SelectionWizard;

/* -------------------------------- Styles -------------------------------- */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0F1A14",
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
    backgroundColor: "#16221B",
    borderWidth: 1,
    borderColor: "#223227",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLabel: {
    color: "#7C8C82",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#16221B",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#223227",
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
  },
  seeAll: {
    color: "#3ED598",
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
    backgroundColor: "#16221B",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#223227",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    position: "relative",
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
    color: "#FFFFFF",
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
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyStateText: {
    color: "#5A6B60",
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});