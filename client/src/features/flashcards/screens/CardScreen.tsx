/**
 * CardSectionPage
 * Root screen for a single flashcard deck.
 * Orchestrates all sub-components and delegates state management
 * entirely to the useFlashCards hook.
 */

import React, { useCallback, useState, useRef } from "react";
import { View, Alert, StyleSheet, ScrollView, useWindowDimensions, Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import AuthModal from "@/features/auth/components/AuthModal";
import { useAuth } from "@/features/auth/hooks/useAuth";

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
  const { isAuthenticated } = useAuth();

  // ── Modal visibility state (UI-only, not business logic) ──────────────────
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [textbookUploadVisible, setTextbookUploadVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [authRequiredVisible, setAuthRequiredVisible] = useState(false);

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
    handleReviewAll,
    handleMarkAllDone,
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
    if (!isAuthenticated) {
      setAuthRequiredVisible(true);
      return;
    }
    setTextbookUploadVisible(true);
    // setPremiumModalVisible(true); // ← uncomment to gate behind paywall
  };

  // ── Confirm delete-all then close modal ────────────────────────────────────
  const handleConfirmDeleteAll = () => {
    handleDeleteAll();
    setDeleteAllModalVisible(false);
  };

  // ── Re-review all: confirm then reset all understood cards to review ────────
  const handleReviewAllPress = () => {
    Alert.alert(
      "Re-review All",
      `Move all ${understoodCards.length} completed card${understoodCards.length !== 1 ? "s" : ""} back to Review so you can study them again?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Re-review All",
          style: "destructive",
          onPress: handleReviewAll,
        },
      ],
    );
  };

  // ── Mark all as Done: confirm then move all review cards to understood ─────
  const handleMarkAllDonePress = () => {
    Alert.alert(
      "Mark All as Done",
      `Move all ${reviewCards.length} review card${reviewCards.length !== 1 ? "s" : ""} to Done?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Mark All as Done",
          onPress: handleMarkAllDone,
        },
      ],
    );
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
            <View style={{ width: pageWidth, flex: 1 }}>
              {/* Mark All as Done banner — only visible when Review tab has cards */}
              {reviewCards.length > 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.reviewAllBanner,
                    pressed && styles.reviewAllBannerPressed,
                  ]}
                  onPress={handleMarkAllDonePress}
                >
                  <View style={styles.reviewAllIconWrap}>
                    <Text style={styles.reviewAllIcon}>✅</Text>
                  </View>
                  <View style={styles.reviewAllTextBlock}>
                    <Text style={styles.reviewAllTitle}>Mark All as Done</Text>
                    <Text style={styles.reviewAllSub}>
                      Move {reviewCards.length} review card{reviewCards.length !== 1 ? "s" : ""} to Done
                    </Text>
                  </View>
                  <Text style={styles.reviewAllArrow}>›</Text>
                </Pressable>
              )}
              <CardList
                cards={reviewCards}
                onUnderstand={handleUnderstand}
                onMoveToReview={handleMoveToReview}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </View>
            <View style={{ width: pageWidth, flex: 1 }}>
              {/* Re-review All banner — only visible when Done tab has cards */}
              {understoodCards.length > 0 && (
                <Pressable
                  style={({ pressed }) => [
                    styles.reviewAllBanner,
                    pressed && styles.reviewAllBannerPressed,
                  ]}
                  onPress={handleReviewAllPress}
                >
                  <View style={styles.reviewAllIconWrap}>
                    <Text style={styles.reviewAllIcon}>🔄</Text>
                  </View>
                  <View style={styles.reviewAllTextBlock}>
                    <Text style={styles.reviewAllTitle}>Re-review All</Text>
                    <Text style={styles.reviewAllSub}>
                      Move {understoodCards.length} completed card{understoodCards.length !== 1 ? "s" : ""} back to Review
                    </Text>
                  </View>
                  <Text style={styles.reviewAllArrow}>›</Text>
                </Pressable>
              )}
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
      <AuthModal
        key={authRequiredVisible ? "ai-auth-open" : "ai-auth-closed"}
        visible={authRequiredVisible}
        initialMode="login"
        notice="Sign in or create an account to generate AI flashcards from a textbook."
        onClose={() => setAuthRequiredVisible(false)}
        onAuthenticated={() => {
          setAuthRequiredVisible(false);
          setTextbookUploadVisible(true);
        }}
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
  // ── Re-review All banner ────────────────────────────────────────────────────
  reviewAllBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    gap: 12,
  },
  reviewAllBannerPressed: {
    opacity: 0.75,
  },
  reviewAllIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryDim,
    alignItems: "center",
    justifyContent: "center",
  },
  reviewAllIcon: {
    fontSize: 18,
  },
  reviewAllTextBlock: {
    flex: 1,
  },
  reviewAllTitle: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  reviewAllSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "400",
  },
  reviewAllArrow: {
    color: COLORS.textMuted,
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 26,
  },
});
