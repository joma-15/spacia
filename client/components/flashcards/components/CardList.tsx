/**
 * CardList
 * Scrollable list of CardItem components.
 * Renders an empty state when no cards match the active filter.
 */

import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import CardItem from "./CardItem";
import { FlashCard } from "../types";
import { COLORS } from "../constants";

interface Props {
  cards: FlashCard[];
  onUnderstand: (id: string) => void;
  onMoveToReview: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, question: string, answer: string) => void;
}

const CardList: React.FC<Props> = ({
  cards,
  onUnderstand,
  onMoveToReview,
  onDelete,
  onEdit,
}) => (
  <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
    {cards.length === 0 ? (
      /* ── Empty state ── */
      <View style={styles.emptyState}>
        <Text style={styles.emptyIcon}>📭</Text>
        <Text style={styles.emptyText}>No cards here yet.</Text>
        <Text style={styles.emptySubText}>Tap ＋ to create one.</Text>
      </View>
    ) : (
      cards.map((card) => (
        <CardItem
          key={card.id}
          card={card}
          onUnderstand={onUnderstand}
          onMoveToReview={onMoveToReview}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))
    )}
    {/* Bottom spacing so last card clears the FAB area */}
    <View style={{ height: 100 }} />
  </ScrollView>
);

export default CardList;

const styles = StyleSheet.create({
  list: { paddingBottom: 20, gap: 10 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { fontSize: 38, marginBottom: 10 },
  emptyText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  emptySubText: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
});