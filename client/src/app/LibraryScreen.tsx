/**
 * LibraryScreen.tsx
 * ─────────────────────────────────────────────
 * The root screen for the Library feature.
 *
 * This file's ONLY job is to:
 *  1. Pull state and actions from the useLibrary hook
 *  2. Manage which modals are open (UI-only state)
 *  3. Handle navigation (router.push) when tabs are tapped
 *  4. Assemble all the sub-components into the final layout
 *
 * If you want to change the LOOK of the screen → edit the components.
 * If you want to change the LOGIC             → edit useLibrary.ts.
 * If you want to change the COLORS            → edit theme.ts.
 */

import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useLibrary } from "../../components/library/hooks/useLibrary";

// ── Components ────────────────────────────────────────────────────────────────
import GreetingSection      from "../../components/library/components/GreetingSection";
import SectionHeader        from "../../components/library/components/SectionHeader";
import FolderGrid           from "../../components/library/components/FolderGrid";
import EmptyState           from "../../components/library/components/EmptyState";
import PopupNavBanner       from "../../components/library/components/PopupNavBanner";
import BottomNav            from "../../components/library/components/BottomNav";
import AddFolderModal       from "../../components/library/components/AddFolderModal";

// ── Theme ─────────────────────────────────────────────────────────────────────
import { THEME } from "../../components/library/theme";
import type { NavTab } from "../../components/library/types";

// The nav bar is a fixed height — we need this to add padding below the scroll
// content so the last item isn't hidden behind the bar.
const NAV_BAR_HEIGHT = 64;

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();

  // ── Business logic (state + actions) from the hook ────────────────────────
  // Note: popupEnabled/setPopupEnabled removed from this destructure since
  // the banner is now a nav button, not a toggle. The hook can still expose
  // them for other screens if needed — they're just unused here now.
  const {
    searchQuery,
    filteredFolders,
    setSearchQuery,
    clearSearch,
    addFolder,
    deleteFolder,
  } = useLibrary();

  // ── UI-only state (modal visibility, active tab) ──────────────────────────
  // These are kept here (not in the hook) because they're pure UI concerns
  // that don't affect any business data.
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<NavTab>("popup");

  // ── Navigation handlers ───────────────────────────────────────────────────

  /**
   * Called when the user taps any bottom-nav tab.
   * Some tabs navigate to a new screen; others just update the active state.
   */
  const handleTabPress = (tab: NavTab): void => {
    if (tab === "stats") {
      router.push("/PaymentScreen");
    }
    setActiveTab(tab);
  };

  /**
   * Called when the "Study reminders" banner is tapped.
   * Adjust this route to wherever your scheduling/notification
   * settings screen actually lives.
   */
  const handleStudyRemindersPress = (): void => {
    router.push("/ScheduleWizardScreen");
  };

  // ── Layout calculation ────────────────────────────────────────────────────

  // Padding added to the bottom of the ScrollView so content
  // isn't hidden behind the fixed BottomNav bar.
  const scrollBottomPadding = NAV_BAR_HEIGHT + Math.max(insets.bottom, 8) + 16;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: scrollBottomPadding },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Welcome text + search bar ── */}
        <GreetingSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSearchClear={clearSearch}
        />

        {/* ── "My Subjects" heading + folder count ── */}
        <SectionHeader count={filteredFolders.length} />

        {/* ── Folder grid OR empty state, depending on what we have ── */}
        {filteredFolders.length > 0 ? (
          <FolderGrid
            folders={filteredFolders}
            onDelete={deleteFolder}
          />
        ) : (
          <EmptyState
            searchQuery={searchQuery}
            onCreatePress={() => setAddModalVisible(true)}
          />
        )}

        {/* ── "Study reminders" nav banner ── */}
        <PopupNavBanner onPress={handleStudyRemindersPress} />
      </ScrollView>

      {/* ── Fixed bottom navigation bar ── */}
      <BottomNav
        activeTab={activeTab}
        onTabPress={handleTabPress}
        bottomInset={insets.bottom}
        onAddPress={() => setAddModalVisible(true)}
      />

      {/* ── Add folder modal (sits above everything) ── */}
      <AddFolderModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={addFolder}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  scroll:   { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 8,
  },
});