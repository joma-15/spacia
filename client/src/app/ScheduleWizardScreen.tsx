import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import { THEME } from "../../components/library/theme";
import { useScheduleWizard } from "../../components/library/hooks/useScheduleWizard";
import { useSchedules } from "../../components/library/hooks/useSchedules";
import { useFolders } from "../../components/library/hooks/useFolders";
import { useFolderFlashcards } from "../../components/library/hooks/useFolderFlashcards";
import WizardProgressBar from "../../components/library/components/schedule/WizardProgressBar";
import FolderSelectStep from "../../components/library/components/schedule/FolderSelectStep";
import FlashcardSelectStep from "../../components/library/components/schedule/FlashcardSelectStep";
import ScheduleSettingsStep from "../../components/library/components/schedule/ScheduleSettingsStep";
import ReviewStep from "../../components/library/components/schedule/ReviewStep";

export default function ScheduleWizardScreen() {
  const { folders, loading: foldersLoading, error: foldersError } = useFolders();
  const wizard = useScheduleWizard();
  const { addSchedule } = useSchedules();

  const {
    cards: cardsInFolder,
    loading: cardsLoading,
  } = useFolderFlashcards(wizard.selectedFolder?.id ?? null);

  const handleCreate = (): void => {
    const schedule = wizard.buildSchedule();
    if (!schedule) return;
    addSchedule(schedule);
    wizard.reset();
    router.push("/ScheduledSessionsScreen" as any);
  };

  if (foldersLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator color={THEME.primary} style={styles.centerSpinner} />
      </SafeAreaView>
    );
  }

  if (foldersError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={styles.errorText}>Couldn't load folders: {foldersError}</Text>
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    switch (wizard.step) {
      case 0:
        return (
          <FolderSelectStep
            folders={folders}
            selectedFolder={wizard.selectedFolder}
            onSelect={wizard.setSelectedFolder}
          />
        );
      case 1:
        if (cardsLoading) {
          return <ActivityIndicator color={THEME.primary} style={styles.centerSpinner} />;
        }
        return (
          <FlashcardSelectStep
            cards={cardsInFolder}
            selectedCardIds={wizard.selectedCardIds}
            onToggle={wizard.toggleCard}
            onSelectAll={() => wizard.selectAllCards(cardsInFolder)}
            onDeselectAll={wizard.deselectAllCards}
          />
        );
      case 2:
        return (
          <ScheduleSettingsStep
            scheduleType={wizard.scheduleType}
            onScheduleTypeChange={wizard.setScheduleType}
            customDays={wizard.customDays}
            onToggleDay={wizard.toggleCustomDay}
            time={wizard.time}
            onTimeChange={wizard.setTime}
            durationMinutes={wizard.durationMinutes}
            onDurationChange={wizard.setDurationMinutes}
            intervalMinutes={wizard.intervalMinutes}
            onIntervalChange={wizard.setIntervalMinutes}
            shuffle={wizard.shuffle}
            onShuffleChange={wizard.setShuffle}
          />
        );
      case 3:
        return (
          <ReviewStep
            folderName={wizard.selectedFolder?.subject ?? ""}
            cardCount={wizard.selectedCardIds.length}
            scheduleType={wizard.scheduleType}
            customDays={wizard.customDays}
            time={wizard.time}
            durationMinutes={wizard.durationMinutes}
            intervalMinutes={wizard.intervalMinutes}
            shuffle={wizard.shuffle}
          />
        );
      default:
        return null;
    }
  };

  const isLastStep = wizard.step === wizard.TOTAL_STEPS - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WizardProgressBar currentStep={wizard.step} />
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {wizard.step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={wizard.goBack}>
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.continueBtn, !wizard.canContinue && styles.continueBtnDisabled]}
          disabled={!wizard.canContinue}
          onPress={isLastStep ? handleCreate : wizard.goNext}
        >
          <Text style={styles.continueBtnText}>
            {isLastStep ? "Create Schedule" : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: THEME.bg },
  scroll: { flex: 1 },
  content: { padding: 20 },
  centerSpinner: { marginTop: 40 },
  errorText: { color: THEME.textWhite, padding: 20 },
  footer: { flexDirection: "row", gap: 10, padding: 20, borderTopWidth: 1, borderTopColor: THEME.border },
  backBtn: {
    flex: 1, backgroundColor: THEME.bgElevated, borderRadius: 12,
    paddingVertical: 15, alignItems: "center", borderWidth: 1, borderColor: THEME.border,
  },
  backBtnText: { color: THEME.textMuted, fontWeight: "700" },
  continueBtn: { flex: 2, backgroundColor: THEME.primary, borderRadius: 12, paddingVertical: 15, alignItems: "center" },
  continueBtnDisabled: { backgroundColor: THEME.primaryDim, opacity: 0.5 },
  continueBtnText: { color: THEME.bg, fontWeight: "700", fontSize: 15 },
});