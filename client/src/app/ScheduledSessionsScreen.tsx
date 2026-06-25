import { router } from "expo-router";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSchedules } from "../../components/ScheduledCards/hooks/useSchedules";
import { THEME } from "../../components/library/theme";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ScheduleCard from "../../components/ScheduledCards/components/ScheduleCard";
import InitialLoadingModal from "../../components/flashcards/components/InitialLoadingModal";
export default function ScheduledSessionsScreen() {
  const { schedules, toggleSchedule, deleteSchedule, duplicateSchedule, loading } =
    useSchedules();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.push("/LibraryScreen" as any)}
          hitSlop={8}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Scheduled Sessions</Text>
      </View>

      {schedules.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🧠</Text>
          <Text style={styles.emptyTitle}>
            No scheduled flashcard sessions yet.
          </Text>
          <Text style={styles.emptySubtitle}>
            Create your first study reminder.
          </Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push("/ScheduleWizardScreen" as any)}
          >
            <Text style={styles.createBtnText}>＋ Create Schedule</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={schedules}
          keyExtractor={(item, index) => item.id ?? index.toString()}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ScheduleCard
              schedule={item}
              onToggle={toggleSchedule}
              onDelete={deleteSchedule}
              onDuplicate={duplicateSchedule}
              onEdit={(id) =>
                router.push({
                  pathname: "/ScheduleWizardScreen" as any,
                  params: { editId: id },
                })
              }
            />
          )}
        />
      )}

      {schedules.length > 0 && (
        <TouchableOpacity
          style={[
            styles.fab,
            {
              bottom: insets.bottom + 24,
            },
          ]}
          onPress={() => router.push("/ScheduleWizardScreen" as any)}
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}

      <InitialLoadingModal visible={loading}/>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: THEME.radiusFull,
    backgroundColor: THEME.bgElevated,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    color: THEME.textWhite,
    fontSize: 22,
    fontWeight: "700",
    marginTop: -2,
  },
  headerTitle: { color: THEME.textWhite, fontSize: 22, fontWeight: "800" },
  list: { padding: 20 },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 44, marginBottom: 14 },
  emptyTitle: {
    color: THEME.textWhite,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    textAlign: "center",
  },
  emptySubtitle: {
    color: THEME.textMuted,
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
  },
  createBtn: {
    backgroundColor: THEME.primaryDim,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: THEME.radiusFull,
    borderWidth: 1,
    borderColor: THEME.primary,
  },
  createBtnText: { color: THEME.primary, fontWeight: "700", fontSize: 14 },
  fab: {
    position: "absolute",
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabIcon: { color: THEME.bg, fontSize: 28, fontWeight: "300", marginTop: -2 },
});
