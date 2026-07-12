/**
 * CardItem
 * Renders a single flashcard with expand/collapse, inline edit,
 * status badge, and delete/understand/re-review controls.
 */

import React, { memo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Alert,
  StyleSheet,
} from "react-native";
import { FlashCard } from "../types";
import { COLORS } from "../constants";

interface Props {
  card: FlashCard;
  onUnderstand: (id: string) => void;
  onMoveToReview: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, question: string, answer: string) => void;
}

const CardItem: React.FC<Props> = ({
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

  // ── Animation helpers ────────────────────────────────────────────────────

  const animatePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();

  const animatePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();

  // ── Edit handlers ────────────────────────────────────────────────────────

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

  // ── Delete handler ───────────────────────────────────────────────────────

  const handleDelete = () =>
    Alert.alert("Delete Card", "Are you sure you want to remove this card?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(card.id) },
    ]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={animatePressIn}
        onPressOut={animatePressOut}
        onPress={() => !isEditing && setExpanded((p) => !p)}
        style={[styles.card, isUnderstood ? styles.cardUnderstood : styles.cardReview]}
      >
        {/* ── Card header: badge + action buttons ── */}
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

        {/* ── Edit mode ── */}
        {isEditing ? (
          <CardEditForm
            editQuestion={editQuestion}
            editAnswer={editAnswer}
            onChangeQuestion={setEditQuestion}
            onChangeAnswer={setEditAnswer}
            onSave={handleSaveEdit}
            onCancel={handleCancelEdit}
          />
        ) : (
          /* ── View mode ── */
          <CardViewContent
            card={card}
            expanded={expanded}
            isUnderstood={isUnderstood}
            onUnderstand={() => onUnderstand(card.id)}
            onMoveToReview={() => onMoveToReview(card.id)}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ─── CardEditForm ─────────────────────────────────────────────────────────────
/**
 * CardEditForm
 * Inline form rendered inside CardItem when the user taps the edit icon.
 */

interface CardEditFormProps {
  editQuestion: string;
  editAnswer: string;
  onChangeQuestion: (v: string) => void;
  onChangeAnswer: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CardEditForm: React.FC<CardEditFormProps> = ({
  editQuestion,
  editAnswer,
  onChangeQuestion,
  onChangeAnswer,
  onSave,
  onCancel,
}) => (
  <View>
    <Text style={styles.fieldLabel}>Question</Text>
    <TextInput
      style={styles.editInput}
      value={editQuestion}
      onChangeText={onChangeQuestion}
      multiline
      placeholderTextColor={COLORS.textMuted}
    />
    <Text style={styles.fieldLabel}>Answer</Text>
    <TextInput
      style={styles.editInput}
      value={editAnswer}
      onChangeText={onChangeAnswer}
      multiline
      placeholderTextColor={COLORS.textMuted}
    />
    <View style={styles.rowActions}>
      <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.saveBtn} onPress={onSave}>
        <Text style={styles.saveBtnText}>Save</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// ─── CardViewContent ──────────────────────────────────────────────────────────
/**
 * CardViewContent
 * The read-only view of a card including the collapsible answer section
 * and the understand / re-review action button.
 */

interface CardViewContentProps {
  card: FlashCard;
  expanded: boolean;
  isUnderstood: boolean;
  onUnderstand: () => void;
  onMoveToReview: () => void;
}

const CardViewContent: React.FC<CardViewContentProps> = ({
  card,
  expanded,
  isUnderstood,
  onUnderstand,
  onMoveToReview,
}) => (
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
        <TouchableOpacity style={styles.understandBtn} onPress={onUnderstand}>
          <Text style={styles.understandBtnText}>Got it ✓</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.reviewBtn} onPress={onMoveToReview}>
          <Text style={styles.reviewBtnText}>Re-review ⟳</Text>
        </TouchableOpacity>
      )}
    </View>
  </>
);

export default memo(CardItem);

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
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
    width: 28, height: 28, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
  },
  iconBtnDanger: {
    backgroundColor: COLORS.dangerDim,
    width: 28, height: 28, borderRadius: 7,
    alignItems: "center", justifyContent: "center",
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
    backgroundColor: COLORS.primaryDim, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.primary,
  },
  understandBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 11 },
  reviewBtn: {
    backgroundColor: COLORS.tagOrange, paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.tagOrangeBorder,
  },
  reviewBtnText: { color: COLORS.tagOrangeBorder, fontWeight: "700", fontSize: 11 },
  fieldLabel: {
    color: COLORS.textMuted, fontSize: 10, textTransform: "uppercase",
    letterSpacing: 1, marginBottom: 5, marginTop: 9,
  },
  editInput: {
    backgroundColor: COLORS.surfaceElevated, borderRadius: 9, padding: 10,
    color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.border,
    minHeight: 56, textAlignVertical: "top",
  },
  rowActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1, backgroundColor: COLORS.surfaceElevated, borderRadius: 10,
    paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: "600", fontSize: 13 },
  saveBtn: {
    flex: 1, backgroundColor: COLORS.primaryDim, borderRadius: 10,
    paddingVertical: 10, alignItems: "center", borderWidth: 1, borderColor: COLORS.primary,
  },
  saveBtnText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
});