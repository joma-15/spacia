import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from "react-native";

// ─────────────────────────────────────────────
// 🎨 THEME
// ─────────────────────────────────────────────
const THEME = {
  bg: "#0F1F17",
  bgCard: "#162B1E",
  bgElevated: "#1C3527",
  primary: "#3DDC84",
  primaryDim: "#2AAF63",
  primaryGlow: "#3DDC8430",
  accent: "#FFD166",
  accentDim: "#FFD16620",
  textWhite: "#F0FFF6",
  textMid: "#A8C5B0",
  textMuted: "#5A7A65",
  textDim: "#3d6b50",
  border: "#243D2C",
  borderBright: "#2E5438",
  navBg: "#111e17",
  navBorder: "#1e3828",
  folderBlue: "#4A90D9",
  folderGreen: "#3DDC84",
  folderRed: "#E05C7A",
  folderGold: "#FFD166",
  folderPurple: "#A78BFA",
  folderOrange: "#FB923C",
  folderPink: "#F472B6",
  folderCyan: "#22D3EE",
  radiusSm: 10,
  radiusMd: 16,
  radiusLg: 22,
  radiusFull: 999,
  cardShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  glowShadow: {
    shadowColor: "#3DDC84",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─────────────────────────────────────────────
// 📦 Types
// ─────────────────────────────────────────────
interface Folder {
  id: string;
  subject: string;
  cardCount: number;
  accentColor: string;
}

type NavTab = "profile" | "streak" | "add" | "popup" | "stats";

const ACCENT_COLORS: { label: string; value: string }[] = [
  { label: "Blue", value: THEME.folderBlue },
  { label: "Green", value: THEME.folderGreen },
  { label: "Red", value: THEME.folderRed },
  { label: "Gold", value: THEME.folderGold },
  { label: "Purple", value: THEME.folderPurple },
  { label: "Orange", value: THEME.folderOrange },
  { label: "Pink", value: THEME.folderPink },
  { label: "Cyan", value: THEME.folderCyan },
];

// ─────────────────────────────────────────────
// 📁 FOLDER CARD
// ─────────────────────────────────────────────
interface FolderCardProps {
  folder: Folder;
  onDelete: (id: string) => void;
  onPress: () => void;
}

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onDelete,
  onPress,
}) => {
  const { subject, cardCount, accentColor } = folder;

  const handleDelete = (): void => {
    Alert.alert("Delete Folder", `Remove "${subject}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => onDelete(folder.id),
      },
    ]);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.folderCard, THEME.cardShadow]}
      onPress={onPress}
    >
      <TouchableOpacity
        style={styles.folderOverflow}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        onPress={handleDelete}
      >
        <Text style={styles.folderOverflowDots}>✕</Text>
      </TouchableOpacity>

      <View style={styles.folderIconWrap}>
        <View style={[styles.folderTab, { backgroundColor: accentColor }]} />
        <View
          style={[
            styles.folderBody,
            {
              backgroundColor: accentColor + "28",
              borderColor: accentColor + "55",
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.folderEmoji, { color: accentColor }]}>📂</Text>
        </View>
      </View>

      <Text style={styles.folderTitle}>{subject}</Text>

      <View
        style={[
          styles.cardCountBadge,
          {
            backgroundColor: accentColor + "22",
            borderColor: accentColor + "55",
          },
        ]}
      >
        <Text style={[styles.cardCountText, { color: accentColor }]}>
          {cardCount} cards
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// ➕ ADD FOLDER MODAL
// ─────────────────────────────────────────────
interface AddFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (subject: string, accentColor: string) => void;
}

const AddFolderModal: React.FC<AddFolderModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const insets = useSafeAreaInsets();
  const [subject, setSubject] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(THEME.folderGreen);

  const handleAdd = (): void => {
    if (!subject.trim()) {
      Alert.alert("Validation", "Please enter a subject name.");
      return;
    }
    onAdd(subject.trim(), selectedColor);
    setSubject("");
    setSelectedColor(THEME.folderGreen);
    onClose();
  };

  const handleClose = (): void => {
    setSubject("");
    setSelectedColor(THEME.folderGreen);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View
          style={[
            styles.modalSheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 24 },
          ]}
        >
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Subject Folder</Text>

          <Text style={styles.fieldLabel}>Subject Name</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g. Chemistry, History..."
            placeholderTextColor={THEME.textMuted}
            value={subject}
            onChangeText={setSubject}
            autoFocus
          />

          <Text style={styles.fieldLabel}>Folder Color</Text>
          <View style={styles.colorRow}>
            {ACCENT_COLORS.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setSelectedColor(c.value)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.value },
                  selectedColor === c.value && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>

          <View
            style={[
              styles.colorPreview,
              {
                backgroundColor: selectedColor + "22",
                borderColor: selectedColor + "55",
              },
            ]}
          >
            <Text style={[styles.colorPreviewText, { color: selectedColor }]}>
              📂 {subject || "Subject Name"}
            </Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAdd}>
              <Text style={styles.addConfirmBtnText}>Create Folder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─────────────────────────────────────────────
// 🔔 POPUP TOGGLE BANNER
// ─────────────────────────────────────────────
interface PopupToggleBannerProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

const PopupToggleBanner: React.FC<PopupToggleBannerProps> = ({
  enabled,
  onToggle,
}) => (
  <View style={styles.popupBanner}>
    <View style={styles.popupIconWrap}>
      <Text style={styles.popupIcon}>🔒</Text>
    </View>
    <View style={styles.popupTextWrap}>
      <Text style={styles.popupTitle}>Flashcards will pop up</Text>
      <Text style={styles.popupSubtitle}>when you unlock your device</Text>
    </View>
    <Switch
      value={enabled}
      onValueChange={onToggle}
      trackColor={{ false: THEME.border, true: THEME.primaryDim }}
      thumbColor={enabled ? THEME.primary : THEME.textMuted}
      ios_backgroundColor={THEME.border}
    />
  </View>
);

// ─────────────────────────────────────────────
// 🧭 BOTTOM NAV  (PaymentScreen style)
// ─────────────────────────────────────────────
const NAV_ITEMS: {
  id: NavTab;
  label: string;
  emoji: string;
  isCenter?: boolean;
}[] = [
  { id: "profile", label: "Profile", emoji: "👤" },
  { id: "streak", label: "Streak", emoji: "🔥" },
  { id: "add", label: "", emoji: "+", isCenter: true },
  { id: "popup", label: "Library", emoji: "📂" },
  { id: "stats", label: "Premium", emoji: "👑" },
];

interface BottomNavProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
  bottomInset: number;
  onAddPress: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabPress,
  bottomInset,
  onAddPress,
}) => (
  <View
    style={[styles.navContainer, { paddingBottom: Math.max(bottomInset, 8) }]}
  >
    <View style={styles.navInner}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;

        if (item.isCenter) {
          return (
            <TouchableOpacity
              key={item.id}
              onPress={onAddPress}
              style={styles.navCenterWrap}
              activeOpacity={0.85}
            >
              <View style={styles.navCenterBtn}>
                <Text style={styles.navCenterIcon}>+</Text>
              </View>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onTabPress(item.id)}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <Text style={[styles.navEmoji, isActive && styles.navEmojiActive]}>
              {item.emoji}
            </Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
            {isActive && <View style={styles.navActiveDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// ─────────────────────────────────────────────
// 🏠 HOME SCREEN
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [popupEnabled, setPopupEnabled] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<NavTab>("popup");

  const insets = useSafeAreaInsets();

  const filteredFolders = folders.filter((f) =>
    f.subject.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddFolder = (subject: string, accentColor: string): void => {
    const newFolder: Folder = {
      id: Date.now().toString(),
      subject,
      cardCount: 0,
      accentColor,
    };
    setFolders((prev) => [newFolder, ...prev]);
  };

  const handleDeleteFolder = (id: string): void => {
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab === "add") {
      setModalVisible(true);
    } else {
      setActiveTab(tab);
    }
  };

  const handleNavigation = (tab: NavTab) => {
    switch (tab) {
      case "stats":
        router.push("/PaymentPageRoute");
        break;

      default:
        break;
    }

    setActiveTab(tab);
  };

  // Nav height + bottom inset used to pad scroll content
  const NAV_BAR_HEIGHT = 64;
  const scrollPaddingBottom = NAV_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Greeting ── */}
        <View style={[styles.greetingWrap, { marginTop: 24 }]}>
          <Text style={styles.greetingSub}>Welcome back,</Text>
          <Text style={styles.greetingMain}>Let's keep learning.</Text>

          <View style={styles.searchBar}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search subjects..."
              placeholderTextColor={THEME.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Text style={styles.searchClear}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Section header ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Subjects</Text>
          <Text style={styles.sectionCount}>
            {filteredFolders.length}{" "}
            {filteredFolders.length === 1 ? "folder" : "folders"}
          </Text>
        </View>

        {/* ── Folder grid or empty state ── */}
        {filteredFolders.length > 0 ? (
          <View style={styles.folderGrid}>
            {filteredFolders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                onDelete={handleDeleteFolder}
                onPress={() =>
                  router.push({
                    pathname: "/CardPageRoute",
                    params: { folderId: folder.id, subject: folder.subject },
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            {searchQuery.length > 0 ? (
              <>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyText}>
                  No results for "{searchQuery}"
                </Text>
                <Text style={styles.emptySubText}>
                  Try a different search term.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyIcon}>📂</Text>
                <Text style={styles.emptyText}>No subjects yet.</Text>
                <Text style={styles.emptySubText}>
                  Tap ＋ below to create your first folder.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.emptyAddBtnText}>＋ Create Folder</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* ── Pop-up toggle banner ── */}
        <PopupToggleBanner enabled={popupEnabled} onToggle={setPopupEnabled} />

        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Bottom Nav (PaymentScreen style) ── */}
      <BottomNav
        activeTab={activeTab}
        onTabPress={handleNavigation }
        bottomInset={insets.bottom}
        onAddPress={() => setModalVisible(true)}
      />

      {/* ── Add Folder Modal ── */}
      <AddFolderModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddFolder}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 💅 STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 8,
  },

  // ── Greeting ──
  greetingWrap: { marginBottom: 30 },
  greetingSub: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: "500",
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  greetingMain: {
    fontSize: 30,
    fontWeight: "800",
    color: THEME.textWhite,
    letterSpacing: -0.8,
    marginBottom: 16,
  },

  // ── Search bar ──
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: THEME.borderBright,
    gap: 10,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1,
    color: THEME.textWhite,
    fontSize: 14,
    fontWeight: "500",
    padding: 0,
  },
  searchClear: { color: THEME.textMuted, fontSize: 13, fontWeight: "700" },

  // ── Section header ──
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.textWhite,
    letterSpacing: 0.1,
  },
  sectionCount: { fontSize: 12, fontWeight: "600", color: THEME.textMuted },

  // ── Folder grid ──
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 22,
  },

  // ── Folder card ──
  folderCard: {
    width: "47%",
    backgroundColor: THEME.bgCard,
    borderRadius: THEME.radiusMd,
    padding: 16,
    paddingTop: 12,
    position: "relative",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  folderOverflow: { position: "absolute", top: 10, right: 12, zIndex: 1 },
  folderOverflowDots: {
    fontSize: 13,
    color: THEME.textMuted,
    fontWeight: "700",
  },
  folderIconWrap: { marginTop: 6, marginBottom: 14, alignSelf: "flex-start" },
  folderTab: {
    width: 28,
    height: 8,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginBottom: -1,
    opacity: 0.85,
  },
  folderBody: {
    width: 62,
    height: 48,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  folderEmoji: { fontSize: 22 },
  folderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 6,
  },
  cardCountBadge: {
    alignSelf: "flex-start",
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
  },
  cardCountText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.2 },

  // ── Empty state ──
  emptyState: {
    alignItems: "center",
    paddingVertical: 52,
    marginBottom: 22,
  },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyText: {
    color: THEME.textWhite,
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubText: {
    color: THEME.textMuted,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyAddBtn: {
    backgroundColor: THEME.primaryDim,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: THEME.radiusFull,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  emptyAddBtnText: { color: THEME.primary, fontWeight: "700", fontSize: 14 },

  // ── Pop-up banner ──
  popupBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusMd,
    padding: 14,
    gap: 12,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  popupIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: THEME.bg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  popupIcon: { fontSize: 18 },
  popupTextWrap: { flex: 1 },
  popupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 2,
  },
  popupSubtitle: { fontSize: 12, color: THEME.textMuted },

  // ─────────────────────────────────────────────
  // 🧭 NAV  —  PaymentScreen style
  // ─────────────────────────────────────────────
  navContainer: {
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
  navInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    gap: 3,
    position: "relative",
  },
  navEmoji: { fontSize: 22, opacity: 0.45 },
  navEmojiActive: { opacity: 1 },
  navLabel: { color: THEME.textDim, fontSize: 10, fontWeight: "500" },
  navLabelActive: { color: THEME.primary, fontWeight: "700" },
  navActiveDot: {
    position: "absolute",
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.primary,
  },
  navCenterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  navCenterBtn: {
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
    marginTop: -16,
  },
  navCenterIcon: {
    color: THEME.bg,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
    marginTop: -2,
  },

  // ── Modal ──
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalSheet: {
    backgroundColor: THEME.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: THEME.textWhite,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  fieldLabel: {
    color: THEME.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    backgroundColor: THEME.bg,
    borderRadius: 12,
    padding: 13,
    color: THEME.textWhite,
    fontSize: 15,
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  colorRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotSelected: {
    borderColor: THEME.textWhite,
    transform: [{ scale: 1.2 }],
  },
  colorPreview: {
    marginTop: 16,
    borderRadius: THEME.radiusMd,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignItems: "center",
  },
  colorPreviewText: { fontSize: 15, fontWeight: "700" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    backgroundColor: THEME.bg,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  cancelBtnText: { color: THEME.textMuted, fontWeight: "600", fontSize: 14 },
  addConfirmBtn: {
    flex: 2,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },
  addConfirmBtnText: { color: THEME.bg, fontWeight: "700", fontSize: 15 },
});
