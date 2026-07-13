/**
 * CardList
 * Virtualized list of CardItem components.
 * Renders an empty state when no cards match the active filter.
 */

import React, { memo, useCallback } from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import CardItem from "./CardItem";
import { FlashCard } from "../types";
import { COLORS } from "../constants";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  cards: FlashCard[];
  onUnderstand: (id: string) => void;
  onMoveToReview: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, question: string, answer: string) => void;
}

const ListFooter = () => <View style={styles.footerSpacer} />;

const EmptyState = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>
      <MaterialCommunityIcons
        name="mailbox-outline"
        size={90}
        color={COLORS.textMuted}
        style={styles.emptyIcon}
      />
    </Text>
    <Text style={styles.emptyText}>No cards here yet.</Text>
    <Text style={styles.emptySubText}>Tap ＋ to create one.</Text>
  </View>
);

const CardList: React.FC<Props> = ({
  cards,
  onUnderstand,
  onMoveToReview,
  onDelete,
  onEdit,
}) => {
  const renderItem = useCallback(
    ({ item }: { item: FlashCard }) => (
      <CardItem
        card={item}
        onUnderstand={onUnderstand}
        onMoveToReview={onMoveToReview}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    ),
    [onUnderstand, onMoveToReview, onDelete, onEdit],
  );

  const keyExtractor = useCallback((item: FlashCard) => item.id, []);

  return (
    <FlatList
      data={cards}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={EmptyState}
      ListFooterComponent={ListFooter}
      removeClippedSubviews
      initialNumToRender={6}
      maxToRenderPerBatch={8}
      windowSize={7}
    />
  );
};

export default memo(CardList);

const styles = StyleSheet.create({
  list: { paddingBottom: 20, gap: 10, flexGrow: 1 },
  footerSpacer: { height: 100 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyIcon: { marginBottom: 18 },
  emptyText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
  emptySubText: { color: COLORS.textMuted, fontSize: 12, marginTop: 3 },
});
