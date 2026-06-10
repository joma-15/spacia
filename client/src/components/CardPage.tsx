import React, { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";

// ─── Types ───────────────────────────────────────────────────────────────────

type CardStatus = "review" | "understood";
type TabType = "all" | "review" | "understood";

interface FlashCard {
  id: string;
  question: string;
  answer: string;
  status: CardStatus;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  background: "#0f1f1a",
  surface: "#1a2e28",
  surfaceElevated: "#1f3530",
  primary: "#2ecc71",
  primaryDim: "#1a7a45",
  text: "#e8f5e9",
  textMuted: "#7a9e8a",
  tagBlue: "#1a3a5c",
  tagBlueBorder: "#2980b9",
  tagGreen: "#1a4a2e",
  tagGreenBorder: "#27ae60",
  tagOrange: "#4a2e0a",
  tagOrangeBorder: "#e67e22",
  danger: "#c0392b",
  dangerDim: "#7b241c",
  dangerBorder: "#c0392b",
  border: "#2a4a3a",
  premiumPurple: "#1e1035",
  premiumPurpleBorder: "#7c3aed",
  premiumPurpleText: "#c4b5fd",
  premiumGold: "#f59e0b",
  premiumGoldDim: "#78350f",
} as const;

// ─── CardItem ─────────────────────────────────────────────────────────────────

interface CardItemProps {
  card: FlashCard;
  onUnderstand: (id: string) => void;
  onMoveToReview: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, question: string, answer: string) => void;
}

const CardItem: React.FC<CardItemProps> = ({
  card,
  onUnderstand,
  onMoveToReview,
  onDelete,
  onEdit,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(card.question);
  const [editAnswer, setEditAnswer] = useState(card.answer);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const isUnderstood = card.status === "understood";

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  const handleSaveEdit = () => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      Alert.alert("Validation", "Question and answer cannot be empty.");
      return;
    }
    onEdit(card.id, editQuestion.trim(), editAnswer.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert("Delete Card", "Are you sure you want to remove this card?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(card.id) },
    ]);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !isEditing && setExpanded((p) => !p)}
        style={[styles.card, isUnderstood ? styles.cardUnderstood : styles.cardReview]}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, isUnderstood ? styles.badgeUnderstood : styles.badgeReview]}>
            <Text style={[styles.statusBadgeText, isUnderstood ? styles.badgeTextUnderstood : styles.badgeTextReview]}>
              {isUnderstood ? "✓ Understood" : "⟳ In Review"}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.iconBtn}>
              <Text style={styles.iconBtnText}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.iconBtnDanger}>
              <Text style={styles.iconBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>

        {isEditing ? (
          <View>
            <Text style={styles.fieldLabel}>Question</Text>
            <TextInput
              style={styles.editInput}
              value={editQuestion}
              onChangeText={setEditQuestion}
              multiline
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.fieldLabel}>Answer</Text>
            <TextInput
              style={styles.editInput}
              value={editAnswer}
              onChangeText={setEditAnswer}
              multiline
              placeholderTextColor={COLORS.textMuted}
            />
            <View style={styles.rowActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Text style={styles.cardQuestion}>{card.question}</Text>
            {expanded && (
              <View style={styles.answerContainer}>
                <View style={styles.answerDivider} />
                <Text style={styles.answerLabel}>Answer</Text>
                <Text style={styles.cardAnswer}>{card.answer}</Text>
              </View>
            )}
            <View style={styles.cardFooter}>
              <Text style={styles.tapHint}>
                {expanded ? "Tap to collapse" : "Tap to reveal answer"}
              </Text>
              {!isUnderstood ? (
                <TouchableOpacity style={styles.understandBtn} onPress={() => onUnderstand(card.id)}>
                  <Text style={styles.understandBtnText}>Got it ✓</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.reviewBtn} onPress={() => onMoveToReview(card.id)}>
                  <Text style={styles.reviewBtnText}>Re-review ⟳</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── Add Card Modal ───────────────────────────────────────────────────────────

interface AddCardModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (question: string, answer: string) => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ visible, onClose, onAdd }) => {
  const insets = useSafeAreaInsets();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");

  const handleAdd = () => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert("Validation", "Please fill in both question and answer.");
      return;
    }
    onAdd(question.trim(), answer.trim());
    setQuestion("");
    setAnswer("");
    onClose();
  };

  const handleClose = () => {
    setQuestion("");
    setAnswer("");
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Add New Card</Text>
          <Text style={styles.fieldLabel}>Question</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter your question..."
            placeholderTextColor={COLORS.textMuted}
            value={question}
            onChangeText={setQuestion}
            multiline
          />
          <Text style={styles.fieldLabel}>Answer</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Enter the answer..."
            placeholderTextColor={COLORS.textMuted}
            value={answer}
            onChangeText={setAnswer}
            multiline
          />
          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addConfirmBtn} onPress={handleAdd}>
              <Text style={styles.addConfirmBtnText}>Add Card</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Delete All Confirmation Modal ───────────────────────────────────────────

interface DeleteAllModalProps {
  visible: boolean;
  cardCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteAllModal: React.FC<DeleteAllModalProps> = ({
  visible,
  cardCount,
  onClose,
  onConfirm,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.deleteOverlay}>
        <View style={[styles.deleteSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <View style={styles.deleteIconCircle}>
            <Text style={styles.deleteIconEmoji}>🗑️</Text>
          </View>
          <Text style={styles.deleteTitle}>Delete All Cards?</Text>
          <Text style={styles.deleteSub}>
            You're about to permanently remove{" "}
            <Text style={styles.deleteHighlight}>
              {cardCount} {cardCount === 1 ? "card" : "cards"}
            </Text>
            . This action cannot be undone.
          </Text>
          <View style={styles.deleteWarnPill}>
            <Text style={styles.deleteWarnText}>⚠ All progress will be lost</Text>
          </View>
          <View style={styles.rowActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteConfirmBtn} onPress={onConfirm}>
              <Text style={styles.deleteConfirmBtnText}>Delete All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ─── Premium Modal ────────────────────────────────────────────────────────────

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

const PREMIUM_FEATURES = [
  { icon: "✦", text: "Generate cards from any topic or pasted text" },
  { icon: "✦", text: "Smart difficulty levels auto-assigned per card" },
  { icon: "✦", text: "Bulk generate entire study decks in seconds" },
  { icon: "✦", text: "AI detects gaps and suggests missing cards" },
];

const PremiumModal: React.FC<PremiumModalProps> = ({ visible, onClose, onUpgrade }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <TouchableOpacity activeOpacity={1} style={styles.premiumOverlay} onPress={onClose}>
      <TouchableOpacity activeOpacity={1} onPress={() => {}}>
        <View style={styles.premiumSheet}>
          <View style={styles.modalHandle} />
          <View style={styles.premiumCrownCircle}>
            <Text style={styles.premiumCrownEmoji}>👑</Text>
          </View>
          <Text style={styles.premiumTitle}>Premium Feature</Text>
          <Text style={styles.premiumSub}>
            Generate flashcards instantly from any topic using AI.{"\n"}Upgrade your plan to unlock this feature.
          </Text>
          <View style={styles.premiumFeatureBox}>
            {PREMIUM_FEATURES.map((f, i) => (
              <View
                key={i}
                style={[styles.premiumFeatureItem, i < PREMIUM_FEATURES.length - 1 && styles.premiumFeatureDivider]}
              >
                <Text style={styles.premiumFeatureIcon}>{f.icon}</Text>
                <Text style={styles.premiumFeatureText}>{f.text}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrade}>
            <Text style={styles.upgradeBtnText}>👑 Upgrade to Premium</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.maybeLaterBtn} onPress={onClose}>
            <Text style={styles.maybeLaterText}>Maybe later</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </TouchableOpacity>
  </Modal>
);

// ─── Loading Modal ────────────────────────────────────────────────────────────

interface LoadingModalProps {
  visible: boolean;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ visible }) => (
  <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingSheet}>
        <View style={styles.loadingIconCircle}>
          <Text style={styles.loadingIconEmoji}>✦</Text>
        </View>
        <ActivityIndicator size="large" color={COLORS.primary} style={styles.loadingSpinner} />
        <Text style={styles.loadingTitle}>Generating Cards</Text>
        <Text style={styles.loadingSubText}>Fetching your flashcards via AI…</Text>
        <View style={styles.loadingDotsRow}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.loadingDot, { opacity: 0.3 + i * 0.3 }]} />
          ))}
        </View>
      </View>
    </View>
  </Modal>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

const CardSectionPage: React.FC = () => {
  const insets = useSafeAreaInsets(); // ← for back button top positioning
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [modalVisible, setModalVisible] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);
  const [deleteAllModalVisible, setDeleteAllModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const reviewCards = cards.filter((c) => c.status === "review");
  const understoodCards = cards.filter((c) => c.status === "understood");
  const displayedCards =
    activeTab === "all" ? cards : activeTab === "review" ? reviewCards : understoodCards;

  const handleUnderstand = (id: string) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "understood" as CardStatus } : c)));
  const handleMoveToReview = (id: string) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, status: "review" as CardStatus } : c)));
  const handleDelete = (id: string) =>
    setCards((prev) => prev.filter((c) => c.id !== id));
  const handleEdit = (id: string, question: string, answer: string) =>
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, question, answer } : c)));
  const handleAddCard = (question: string, answer: string) => {
    setCards((prev) => [
      { id: Date.now().toString(), question, answer, status: "review" },
      ...prev,
    ]);
  };
  const handleDeleteAll = () => {
    setCards([]);
    setDeleteAllModalVisible(false);
    setActiveTab("all");
  };

  async function fetchData() {
    setLoading(true);
    try {
      const response = await fetch("http://192.168.8.35:5000/flashcards");
      const data = await response.json();
      const newCards: FlashCard[] = data.flashcards.map((item: any) => ({
        id: item.id ?? Date.now().toString() + Math.random(),
        question: item.question,
        answer: item.answer,
        status: (item.status as CardStatus) ?? "review",
      }));
      setCards((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const fresh = newCards.filter((c) => !existingIds.has(c.id));
        return [...fresh, ...prev];
      });
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      Alert.alert("Error", "Failed to fetch flashcards.");
    } finally {
      setLoading(false);
    }
  }

  const handleAiGenerate = () => fetchData();
  const handleUpgrade = () => {
    setPremiumModalVisible(false);
    Alert.alert("Upgrade", "Navigate to your subscription screen here.");
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "review", label: "Review" },
    { key: "understood", label: "Done" },
  ];

  const progress = cards.length > 0 ? understoodCards.length / cards.length : 0;

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) + 8 }]}>

      {/* ── Header ── */}
      <View style={styles.header}>

        {/* ← BACK BUTTON */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backBtnIcon}>‹</Text>
        </TouchableOpacity>

        {/* Title block */}
        <View style={styles.headerLeft}>
          <Text style={styles.headerSub}>My Subjects</Text>
          <Text style={styles.headerTitle}>Physics Cards</Text>
        </View>

        {/* Right-side action chips */}
        <View style={styles.headerActions}>
          {cards.length > 0 && (
            <TouchableOpacity
              style={styles.deleteAllChip}
              onPress={() => setDeleteAllModalVisible(true)}
              activeOpacity={0.75}
            >
              <Text style={styles.deleteAllChipText}>🗑 Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.aiChip} onPress={handleAiGenerate} activeOpacity={0.75}>
            <Text style={styles.aiChipStar}>✦</Text>
            <Text style={styles.aiChipText}>AI</Text>
            <View style={styles.aiChipCrown}>
              <Text style={styles.aiChipCrownText}>👑</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Progress bar + stats row ── */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{cards.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.tagOrangeBorder }]}>
              {reviewCards.length}
            </Text>
            <Text style={styles.statLabel}>In Review</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: COLORS.primary }]}>
              {understoodCards.length}
            </Text>
            <Text style={styles.statLabel}>Understood</Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
        </View>
        <Text style={styles.progressLabel}>{Math.round(progress * 100)}% mastered</Text>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        {tabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Card list ── */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {displayedCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No cards here yet.</Text>
            <Text style={styles.emptySubText}>Tap ＋ to create one.</Text>
          </View>
        ) : (
          displayedCards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              onUnderstand={handleUnderstand}
              onMoveToReview={handleMoveToReview}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      <AddCardModal visible={modalVisible} onClose={() => setModalVisible(false)} onAdd={handleAddCard} />
      <PremiumModal visible={premiumModalVisible} onClose={() => setPremiumModalVisible(false)} onUpgrade={handleUpgrade} />
      <LoadingModal visible={loading} />
      <DeleteAllModal
        visible={deleteAllModalVisible}
        cardCount={cards.length}
        onClose={() => setDeleteAllModalVisible(false)}
        onConfirm={handleDeleteAll}
      />
    </View>
  );
};

export default CardSectionPage;

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    // paddingTop is now dynamic via insets in the component
    paddingHorizontal: 16,
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",        // vertically centres back btn, title, actions
    marginBottom: 16,
    gap: 10,
  },

  // ← NEW back button
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    // no marginTop — aligns naturally with flexbox center
  },
  backBtnIcon: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 26,
    marginTop: -1,   // optical correction for the ‹ glyph
  },

  headerLeft: { flex: 1 },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  deleteAllChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  deleteAllChipText: {
    color: "#f87171",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  aiChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.premiumPurple,
    borderWidth: 1,
    borderColor: COLORS.premiumPurpleBorder,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  aiChipStar: { color: COLORS.premiumPurpleText, fontSize: 11, fontWeight: "700" },
  aiChipText: { color: COLORS.premiumPurpleText, fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  aiChipCrown: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.premiumGold,
    borderWidth: 2,
    borderColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
  aiChipCrownText: { fontSize: 8, lineHeight: 12 },
  addBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: "#fff", fontSize: 20, fontWeight: "300", lineHeight: 24 },

  statsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 12,
  },
  statItem: { alignItems: "center", flex: 1 },
  statDivider: { width: 1, height: 28, backgroundColor: COLORS.border },
  statNumber: { color: COLORS.text, fontSize: 20, fontWeight: "700" },
  statLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 1, letterSpacing: 0.3 },
  progressTrack: { height: 5, backgroundColor: COLORS.surfaceElevated, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },
  progressLabel: { color: COLORS.textMuted, fontSize: 10, marginTop: 5, textAlign: "right", letterSpacing: 0.2 },

  tabRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  tabActive: { backgroundColor: COLORS.primaryDim },
  tabText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "500" },
  tabTextActive: { color: COLORS.primary, fontWeight: "700" },

  list: { paddingBottom: 20, gap: 10 },
  card: { borderRadius: 14, padding: 14, borderWidth: 1 },
  cardReview: { backgroundColor: COLORS.surface, borderColor: COLORS.border },
  cardUnderstood: { backgroundColor: "#162a1e", borderColor: "#1a5c35" },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 9,
  },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  badgeReview: { backgroundColor: COLORS.tagOrange, borderColor: COLORS.tagOrangeBorder },
  badgeUnderstood: { backgroundColor: COLORS.tagGreen, borderColor: COLORS.tagGreenBorder },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },
  badgeTextReview: { color: COLORS.tagOrangeBorder },
  badgeTextUnderstood: { color: COLORS.primary },
  cardActions: { flexDirection: "row", gap: 6 },
  iconBtn: {
    backgroundColor: COLORS.surfaceElevated,
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnDanger: {
    backgroundColor: COLORS.dangerDim,
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { color: COLORS.text, fontSize: 13 },
  cardQuestion: { color: COLORS.text, fontSize: 14, fontWeight: "600", lineHeight: 20, marginBottom: 6 },
  answerContainer: { marginTop: 4 },
  answerDivider: { height: 1, backgroundColor: COLORS.border, marginBottom: 8 },
  answerLabel: { color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 },
  cardAnswer: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 6 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  tapHint: { color: COLORS.textMuted, fontSize: 10, fontStyle: "italic" },
  understandBtn: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  understandBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 11 },
  reviewBtn: {
    backgroundColor: COLORS.tagOrange,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.tagOrangeBorder,
  },
  reviewBtnText: { color: COLORS.tagOrangeBorder, fontWeight: "700", fontSize: 11 },

  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
    marginTop: 9,
  },
  editInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 9,
    padding: 10,
    color: COLORS.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
    textAlignVertical: "top",
  },
  rowActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryDim,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  saveBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 38, marginBottom: 10 },
  emptyText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  emptySubText: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },

  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 22,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 2 },
  modalInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 11,
    padding: 11,
    color: COLORS.text,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 66,
    textAlignVertical: "top",
  },
  addConfirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 11,
    paddingVertical: 13,
    alignItems: "center",
  },
  addConfirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  deleteOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
    paddingHorizontal: 28,
  },
  deleteSheet: {
    width: "100%",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.dangerBorder + "55",
  },
  deleteIconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: COLORS.dangerDim,
    borderWidth: 1.5,
    borderColor: COLORS.dangerBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  deleteIconEmoji: { fontSize: 24 },
  deleteTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  deleteSub: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 14 },
  deleteHighlight: { color: "#f87171", fontWeight: "700" },
  deleteWarnPill: {
    backgroundColor: COLORS.dangerDim,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.dangerBorder + "88",
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 6,
  },
  deleteWarnText: { color: "#f87171", fontSize: 11, fontWeight: "600" },
  deleteConfirmBtn: {
    flex: 2,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.dangerBorder,
  },
  deleteConfirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  premiumOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  premiumSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 22,
    paddingBottom: 40,
    alignItems: "center",
  },
  premiumCrownCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.premiumGoldDim,
    borderWidth: 2,
    borderColor: COLORS.premiumGold,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  premiumCrownEmoji: { fontSize: 28 },
  premiumTitle: { color: COLORS.text, fontSize: 20, fontWeight: "700", marginBottom: 7, textAlign: "center" },
  premiumSub: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20, textAlign: "center", marginBottom: 20 },
  premiumFeatureBox: {
    width: "100%",
    backgroundColor: "#162a1e",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1a5c35",
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  premiumFeatureItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11 },
  premiumFeatureDivider: { borderBottomWidth: 1, borderBottomColor: "#1a3a28" },
  premiumFeatureIcon: { color: COLORS.primary, fontSize: 14, width: 18, textAlign: "center" },
  premiumFeatureText: { color: COLORS.text, fontSize: 13, flex: 1, lineHeight: 19 },
  upgradeBtn: {
    width: "100%",
    backgroundColor: "#5b21b6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.premiumPurpleBorder,
    marginBottom: 10,
  },
  upgradeBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  maybeLaterBtn: {
    width: "100%",
    paddingVertical: 11,
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  maybeLaterText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },

  loadingOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.75)" },
  loadingSheet: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    paddingVertical: 36,
    paddingHorizontal: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 220,
  },
  loadingIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.premiumPurple,
    borderWidth: 1.5,
    borderColor: COLORS.premiumPurpleBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  loadingIconEmoji: { color: COLORS.premiumPurpleText, fontSize: 22, fontWeight: "700" },
  loadingSpinner: { marginBottom: 16 },
  loadingTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 6, letterSpacing: -0.2 },
  loadingSubText: { color: COLORS.textMuted, fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 18 },
  loadingDotsRow: { flexDirection: "row", gap: 6 },
  loadingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.primary },
});