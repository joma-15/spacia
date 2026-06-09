import React, { useState } from 'react';
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
} from 'react-native';

// ─── Types ───────────────────────────────────────────────────────────────────

type CardStatus = 'review' | 'understood';
type TabType = 'all' | 'review' | 'understood';

interface FlashCard {
  id: string;
  question: string;
  answer: string;
  status: CardStatus;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = {
  background: '#0f1f1a',
  surface: '#1a2e28',
  surfaceElevated: '#1f3530',
  primary: '#2ecc71',
  primaryDim: '#1a7a45',
  text: '#e8f5e9',
  textMuted: '#7a9e8a',
  tagBlue: '#1a3a5c',
  tagBlueBorder: '#2980b9',
  tagGreen: '#1a4a2e',
  tagGreenBorder: '#27ae60',
  tagOrange: '#4a2e0a',
  tagOrangeBorder: '#e67e22',
  danger: '#c0392b',
  dangerDim: '#7b241c',
  border: '#2a4a3a',
} as const;

const INITIAL_CARDS: FlashCard[] = [
  {
    id: '1',
    question: "What is Newton's Second Law?",
    answer: 'Force equals mass times acceleration (F = ma)',
    status: 'review',
  },
  {
    id: '2',
    question: 'Define photosynthesis.',
    answer:
      'The process by which green plants convert sunlight into food using CO₂ and water.',
    status: 'understood',
  },
  {
    id: '3',
    question: 'What is the Pythagorean theorem?',
    answer: 'In a right triangle, a² + b² = c²',
    status: 'review',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

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
  const [expanded, setExpanded] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editQuestion, setEditQuestion] = useState<string>(card.question);
  const [editAnswer, setEditAnswer] = useState<string>(card.answer);
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const isUnderstood = card.status === 'understood';

  const handlePressIn = (): void => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  };

  const handlePressOut = (): void => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };

  const handleSaveEdit = (): void => {
    if (!editQuestion.trim() || !editAnswer.trim()) {
      Alert.alert('Validation', 'Question and answer cannot be empty.');
      return;
    }
    onEdit(card.id, editQuestion.trim(), editAnswer.trim());
    setIsEditing(false);
  };

  const handleCancelEdit = (): void => {
    setEditQuestion(card.question);
    setEditAnswer(card.answer);
    setIsEditing(false);
  };

  const handleDelete = (): void => {
    Alert.alert('Delete Card', 'Are you sure you want to remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(card.id) },
    ]);
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !isEditing && setExpanded((prev) => !prev)}
        style={[styles.card, isUnderstood ? styles.cardUnderstood : styles.cardReview]}
      >
        {/* Status Badge + Actions */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, isUnderstood ? styles.badgeUnderstood : styles.badgeReview]}>
            <Text style={[styles.statusBadgeText, isUnderstood ? styles.badgeTextUnderstood : styles.badgeTextReview]}>
              {isUnderstood ? '✓ Understood' : '⟳ In Review'}
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

        {/* Edit Mode */}
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
            {/* Question */}
            <Text style={styles.cardQuestion}>{card.question}</Text>

            {/* Answer (expanded) */}
            {expanded && (
              <View style={styles.answerContainer}>
                <View style={styles.answerDivider} />
                <Text style={styles.answerLabel}>Answer</Text>
                <Text style={styles.cardAnswer}>{card.answer}</Text>
              </View>
            )}

            {/* Footer */}
            <View style={styles.cardFooter}>
              <Text style={styles.tapHint}>
                {expanded ? 'Tap to collapse' : 'Tap to reveal answer'}
              </Text>
              {!isUnderstood ? (
                <TouchableOpacity
                  style={styles.understandBtn}
                  onPress={() => onUnderstand(card.id)}
                >
                  <Text style={styles.understandBtnText}>Understand It ✓</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => onMoveToReview(card.id)}
                >
                  <Text style={styles.reviewBtnText}>Move to Review ⟳</Text>
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
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');

  const handleAdd = (): void => {
    if (!question.trim() || !answer.trim()) {
      Alert.alert('Validation', 'Please fill in both question and answer.');
      return;
    }
    onAdd(question.trim(), answer.trim());
    setQuestion('');
    setAnswer('');
    onClose();
  };

  const handleClose = (): void => {
    setQuestion('');
    setAnswer('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalSheet}>
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

// ─── Main Screen ─────────────────────────────────────────────────────────────

const CardSectionPage: React.FC = () => {
  const [cards, setCards] = useState<FlashCard[]>(INITIAL_CARDS);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const reviewCards = cards.filter((c) => c.status === 'review');
  const understoodCards = cards.filter((c) => c.status === 'understood');

  const displayedCards: FlashCard[] =
    activeTab === 'all'
      ? cards
      : activeTab === 'review'
      ? reviewCards
      : understoodCards;

  const handleUnderstand = (id: string): void => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'understood' as CardStatus } : c))
    );
  };

  const handleMoveToReview = (id: string): void => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'review' as CardStatus } : c))
    );
  };

  const handleDelete = (id: string): void => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEdit = (id: string, question: string, answer: string): void => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, question, answer } : c))
    );
  };

  const handleAddCard = (question: string, answer: string): void => {
    const newCard: FlashCard = {
      id: Date.now().toString(),
      question,
      answer,
      status: 'review',
    };
    setCards((prev) => [newCard, ...prev]);
  };

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'review', label: 'In Review' },
    { key: 'understood', label: 'Understood' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>My Subjects</Text>
          <Text style={styles.headerTitle}>Physics Cards</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: COLORS.tagBlueBorder }]}>
          <Text style={styles.statNumber}>{cards.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.tagOrangeBorder }]}>
          <Text style={[styles.statNumber, { color: COLORS.tagOrangeBorder }]}>
            {reviewCards.length}
          </Text>
          <Text style={styles.statLabel}>In Review</Text>
        </View>
        <View style={[styles.statCard, { borderColor: COLORS.tagGreenBorder }]}>
          <Text style={[styles.statNumber, { color: COLORS.primary }]}>
            {understoodCards.length}
          </Text>
          <Text style={styles.statLabel}>Understood</Text>
        </View>
      </View>

      {/* Tabs */}
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

      {/* Card List */}
      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      >
        {displayedCards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>No cards here yet.</Text>
            <Text style={styles.emptySubText}>Tap "+ Add" to create one.</Text>
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

      {/* Modal */}
      <AddCardModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddCard}
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
    paddingTop: 52,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  headerSub: {
    color: COLORS.textMuted,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '700',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '700',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: COLORS.primaryDim,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  list: {
    paddingBottom: 20,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardReview: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
  },
  cardUnderstood: {
    backgroundColor: '#162a1e',
    borderColor: '#1a5c35',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeReview: {
    backgroundColor: COLORS.tagOrange,
    borderColor: COLORS.tagOrangeBorder,
  },
  badgeUnderstood: {
    backgroundColor: COLORS.tagGreen,
    borderColor: COLORS.tagGreenBorder,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeTextReview: {
    color: COLORS.tagOrangeBorder,
  },
  badgeTextUnderstood: {
    color: COLORS.primary,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: COLORS.surfaceElevated,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnDanger: {
    backgroundColor: COLORS.dangerDim,
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: COLORS.text,
    fontSize: 14,
  },
  cardQuestion: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 8,
  },
  answerContainer: {
    marginTop: 4,
  },
  answerDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 10,
  },
  answerLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  cardAnswer: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  tapHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  understandBtn: {
    backgroundColor: COLORS.primaryDim,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  understandBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  reviewBtn: {
    backgroundColor: COLORS.tagOrange,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.tagOrangeBorder,
  },
  reviewBtnText: {
    color: COLORS.tagOrangeBorder,
    fontWeight: '700',
    fontSize: 12,
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 10,
  },
  editInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 10,
    padding: 10,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textMuted,
    fontWeight: '600',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryDim,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  saveBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: 12,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  addConfirmBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addConfirmBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});