/**
 * CardSectionPage
 * Root screen for a single flashcard deck.
 * Orchestrates all sub-components and delegates state management
 * entirely to the useFlashCards hook.
 */

import React, { useCallback, useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
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
import InitialLoadingModal from "../components/InitialLoadingModal";
import TextbookUploadModal from "../components/TextbookUploadModal";

// ── Constants ─────────────────────────────────────────────────────────────────
import { COLORS, TABS } from "../constants";
import { TabType } from "../types";

const CardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // ── Modal visibility state (UI-only, not business logic) ──────────────────
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [textbookUploadVisible, setTextbookUploadVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);
  const [mountedTabs, setMountedTabs] = useState<Set<TabType>>(() => new Set(["all"]));

  // ── Get folder id ──────────────────────────────────────────────────────────
  const { folderId } = useLocalSearchParams<{ folderId: string }>();

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

  const tabCards: Record<TabType, typeof cards> = {
    all: cards,
    review: reviewCards,
    understood: understoodCards,
  };

  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (tab === activeTab) return;

      if (mountedTabs.has(tab)) {
        setActiveTab(tab);
        return;
      }

      // Let the existing loading modal paint before mounting this tab's list.
      // This avoids the first visit to a large Review/Done list feeling like a
      // frozen tab press.
      setTabLoading(true);
      requestAnimationFrame(() => {
        setMountedTabs((prev) => {
          const next = new Set(prev);
          next.add(tab);
          return next;
        });
        setActiveTab(tab);

        requestAnimationFrame(() => setTabLoading(false));
      });
    },
    [activeTab, mountedTabs, setActiveTab],
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
        title="Physics Cards"
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

      {/* ── Scrollable card list ── */}
      <View style={styles.listArea}>
        {TABS.map(({ key }) =>
          mountedTabs.has(key) ? (
            <View
              key={key}
              style={[styles.tabPanel, activeTab !== key && styles.tabPanelHidden]}
              pointerEvents={activeTab === key ? "auto" : "none"}
            >
              <CardList
                cards={tabCards[key]}
                onUnderstand={handleUnderstand}
                onMoveToReview={handleMoveToReview}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </View>
          ) : null,
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
      <InitialLoadingModal visible={initialLoading || tabLoading}/>
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
  tabPanel: {
    flex: 1,
  },
  tabPanelHidden: {
    display: "none",
  },
});
