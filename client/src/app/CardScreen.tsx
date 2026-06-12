/**
 * CardSectionPage
 * Root screen for a single flashcard deck.
 * Orchestrates all sub-components and delegates state management
 * entirely to the useFlashCards hook.
 */

import React, { useState } from "react";
import { View, Alert, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Hook ──────────────────────────────────────────────────────────────────────
import { useFlashCards } from "../../components/flashcards/hooks/useFlashCards";

// ── Components ────────────────────────────────────────────────────────────────
import Header from "../../components/flashcards/components/Header";
import StatsCard from "../../components/flashcards/components/StatsCard";
import TabRow from "../../components/flashcards/components/TabRow";
import CardList from "../../components/flashcards/components/CardList";
import AddCardModal from "../../components/flashcards/components/AddCardModal";
import DeleteAllModal from "../../components/flashcards/components/DeleteAllModal";
import PremiumModal from "../../components/flashcards/components/PremiumModal";
import LoadingModal from "../../components/flashcards/components/LoadingModal";

// ── Constants ─────────────────────────────────────────────────────────────────
import { COLORS } from "../../components/flashcards/constants";

const CardScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  // ── Modal visibility state (UI-only, not business logic) ──────────────────
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);

  // ── All card state and actions ─────────────────────────────────────────────
  const {
    cards,
    activeTab,
    loading,
    reviewCards,
    understoodCards,
    displayedCards,
    progress,
    setActiveTab,
    handleUnderstand,
    handleMoveToReview,
    handleDelete,
    handleEdit,
    handleAddCard,
    handleDeleteAll,
    fetchAiCards,
  } = useFlashCards();

  // ── AI button: swap between fetchAiCards() and setPremiumModalVisible(true) ─
  const handleAiGenerate = () => {
    fetchAiCards();
    // setPremiumModalVisible(true); // ← uncomment to gate behind paywall
  };

  /** Confirm delete-all then close modal */
  const handleConfirmDeleteAll = () => {
    handleDeleteAll();
    setDeleteAllModalVisible(false);
  };

  /** Navigate to subscription screen */
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
      <TabRow activeTab={activeTab} onTabChange={setActiveTab} />

      {/* ── Scrollable card list ── */}
      <CardList
        cards={displayedCards}
        onUnderstand={handleUnderstand}
        onMoveToReview={handleMoveToReview}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />

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
});