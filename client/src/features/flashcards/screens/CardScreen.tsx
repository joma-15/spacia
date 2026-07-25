/**
 * CardSectionPage
 * Root screen for a single flashcard deck.
 * Orchestrates all sub-components and delegates state management
 * entirely to the useFlashCards hook.
 */

import React, { useCallback, useState, useRef, useEffect } from "react";
import { View, Alert, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useFlashCards } from "../hooks/useFlashCards";

// ── Components ────────────────────────────────────────────────────────────────
import Header from "../components/Header";
import StatsCard from "../components/StatsCard";
import TabRow from "../components/TabRow";
import CardList from "../components/CardList";
import AddCardModal from "../components/AddCardModal";
import DeleteAllModal from "../components/DeleteAllModal";
import PremiumModal from "../components/PremiumModal";
import LoadingModal from "../components/LoadingModal";
import CardSkeletonList from "../components/CardSkeleton";
import TextbookUploadModal from "../components/TextbookUploadModal";

// ── Constants ─────────────────────────────────────────────────────────────────
import { COLORS, TABS } from "../constants";
import { TabType } from "../types";

const CardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const pageWidth = screenWidth - 32;

  // ── Modal visibility state (UI-only, not business logic) ──────────────────
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [textbookUploadVisible, setTextbookUploadVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);

  // ── Get folder id and name from URL params ──────────────────────────────
  const { folderId, folderName } = useLocalSearchParams<{ folderId: string; folderName: string }>();

  // ── All card state and actions (single hook call) ──────────────────────────
  const {
    cards,
    activeTab,
    loading,
    initialLoading,
    reviewCards,
    understoodCards,
    progress,
    setActiveTab,
    handleUnderstand,
    handleMoveToReview,
    handleDelete,
    handleEdit,
    handleAddCard,
    handleDeleteAll,
    fetchAiCards,
  } = useFlashCards(folderId);

  const scrollViewRef = useRef<ScrollView>(null);

  /**
   * Handles user switching tabs (between 'All', 'Review', and 'Understood' cards).
   * Programmatically scrolls the paging ScrollView to the selected tab.
   */
  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (tab === activeTab) return;
      setActiveTab(tab);

      const tabIndex = TABS.findIndex((t) => t.key === tab);
      if (tabIndex !== -1 && scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ x: tabIndex * pageWidth, animated: true });
      }
    },
    [activeTab, pageWidth, setActiveTab],
  );

  /**
   * Handles scroll end (swipes) and updates the active tab state accordingly.
   */
  const handleScrollEnd = useCallback(
    (e: any) => {
      const x = e.nativeEvent.contentOffset.x;
      const index = Math.round(x / pageWidth);
      const tabKeys: TabType[] = ["all", "review", "understood"];
      const tab = tabKeys[index];
      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    },
    [activeTab, pageWidth, setActiveTab],
  );

  // ── AI button ──────────────────────────────────────────────────────────────
  const handleAiGenerate = () => {
    setTextbookUploadVisible(true);
    // setPremiumModalVisible(true); // ← uncomment to gate behind paywall
  };

  // ── Confirm delete-all then close modal ────────────────────────────────────
  const handleConfirmDeleteAll = () => {
    handleDeleteAll();
    setDeleteAllModalVisible(false);
  };

  // ── Navigate to subscription screen ───────────────────────────────────────
  const handleUpgrade = () => {
    setPremiumModalVisible(false);
    Alert.alert("Upgrade", "Navigate to your subscription screen here.");
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}>

      {/* ── Top bar ── */}
      <Header
        title={folderName ?? "Flashcards"}
        subtitle="My Subjects"
        hasCards={cards.length > 0}
        onAiGenerate={handleAiGenerate}
        onAddCard={() => setAddModalVisible(true)}
        onDeleteAll={() => setDeleteAllModalVisible(true)}
      />

      {/* ── Totals + progress bar ── */}
      <StatsCard
        total={cards.length}
        reviewCount={reviewCards.length}
        understoodCount={understoodCards.length}
        progress={progress}
      />

      {/* ── All | Review | Done filter ── */}
      <TabRow activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ── Scrollable card list with horizontal paging ── */}
      <View style={styles.listArea}>
        {initialLoading ? (
          <CardSkeletonList />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScrollEnd}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
          >
            <View style={{ width: pageWidth }}>
              <CardList
                cards={cards}
                onUnderstand={handleUnderstand}
                onMoveToReview={handleMoveToReview}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </View>
            <View style={{ width: pageWidth }}>
              <CardList
                cards={reviewCards}
                onUnderstand={handleUnderstand}
                onMoveToReview={handleMoveToReview}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </View>
            <View style={{ width: pageWidth }}>
              <CardList
                cards={understoodCards}
                onUnderstand={handleUnderstand}
                onMoveToReview={handleMoveToReview}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </View>
          </ScrollView>
        )}
      </View>

      {/* ── Modals ── */}
      <AddCardModal
        visible={addModalVisible}
        onClose={() => setAddModalVisible(false)}
        onAdd={handleAddCard}
      />
      <PremiumModal
        visible={premiumModalVisible}
        onClose={() => setPremiumModalVisible(false)}
        onUpgrade={handleUpgrade}
      />
      <TextbookUploadModal
        visible={textbookUploadVisible}
        onClose={() => setTextbookUploadVisible(false)}
        onGenerate={fetchAiCards}
      />
      <LoadingModal visible={loading} />
      <DeleteAllModal
        visible={deleteAllModalVisible}
        cardCount={cards.length}
        onClose={() => setDeleteAllModalVisible(false)}
        onConfirm={handleConfirmDeleteAll}
      />
    </View>
  );
};

export default CardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
  },
  listArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  tabPanel: {
    flex: 1,
  },
  tabPanelHidden: {
    display: "none",
  },
});
