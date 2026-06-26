import { router } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useFolderFlashcards } from "../../components/library/hooks/useFolderFlashcards";
import { useFolders } from "../../components/library/hooks/useFolders";
import { useSchedules } from "../../components/ScheduledCards/hooks/useSchedules";
import { useScheduleWizard } from "../../components/ScheduledCards/hooks/useScheduleWizard";
import { THEME } from "../../components/library/theme";
import FlashcardSelectStep from "../../components/ScheduledCards/components/FlashcardSelectStep";
import FolderSelectStep from "../../components/ScheduledCards/components/FolderSelectStep";
import ReviewStep from "../../components/ScheduledCards/components/ReviewStep";
import ScheduleSettingsStep from "../../components/ScheduledCards/components/ScheduleSettingsStep";
import WizardProgressBar from "../../components/ScheduledCards/components/WizardProgressBar";

export default function ScheduleWizardScreen() {
  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
  } = useFolders();
  const insets = useSafeAreaInsets();
  const wizard = useScheduleWizard();
  const { addSchedule } = useSchedules();

  const { cards: cardsInFolder, loading: cardsLoading } = useFolderFlashcards(
    wizard.selectedFolder?.id ?? null,
  );

  //send the data to the database and also build the schedule 
  const handleCreate = async (): Promise<void> => {
    const schedule = wizard.buildSchedule();

    if (!schedule) return;
    // addSchedule(schedule);
    await wizard.handleSubmit();

    wizard.reset();
    router.push("/ScheduledSessionsScreen" as any);
  };

  /**
   * Handles the footer "Back" button for every step.
   * Step 0 has no previous wizard step, so it exits the wizard
   * entirely (back to wherever the user launched it from, e.g. Library).
   * Any other step just steps back within the wizard via wizard.goBack.
   */
  const handleBackPress = (): void => {
    if (wizard.step === 0) {
      router.back();
    } else {
      wizard.goBack();
    }
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
        <Text style={styles.errorText}>
          Couldn't load folders: {foldersError}
        </Text>
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
          return (
            <ActivityIndicator
              color={THEME.primary}
              style={styles.centerSpinner}
            />
          );
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
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <WizardProgressBar currentStep={wizard.step} />
        {renderStep()}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 20),
          },
        ]}
      >
        {/* Back button now always renders — step 0 exits the wizard,
            every other step goes back within the wizard. */}
        <TouchableOpacity style={styles.backBtn} onPress={handleBackPress}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueBtn,
            !wizard.canContinue && styles.continueBtnDisabled,
          ]}
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
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
  },
  backBtn: {
    flex: 1,
    backgroundColor: THEME.bgElevated,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  backBtnText: { color: THEME.textMuted, fontWeight: "700" },
  continueBtn: {
    flex: 2,
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
  },
  continueBtnDisabled: { backgroundColor: THEME.primaryDim, opacity: 0.5 },
  continueBtnText: { color: THEME.bg, fontWeight: "700", fontSize: 15 },
});
