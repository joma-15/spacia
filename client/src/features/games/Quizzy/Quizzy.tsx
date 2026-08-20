import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFlashcardSync } from "../SpaceBlast/hooks/useFlashcardSync";
import { FlashCard } from "@/features/flashcards/types";

/**
 * QUIZZY — single-file React Native + TypeScript multiple choice quiz game.
 * Theme: dark green / neon green "pixel arcade" style, matching the app banner.
 *
 * Questions are built from a folder's real flashcards (via useFlashcardSync):
 * each card's `answer` is the correct option, and the 3 distractors are pulled
 * from OTHER cards' answers in the same folder. If the folder doesn't have
 * enough unique answers to fill A–D, distractors repeat until all questions
 * have been generated.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OptionKey = "A" | "B" | "C" | "D";

interface QuizQuestion {
  id: string; // flashcard id — needed so we can report the answer back to the server
  question: string;
  options: Record<OptionKey, string>;
  correct: OptionKey;
}

const XP_PER_CORRECT = 150;
const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

const theme = {
  bg: "#050f06",
  panel: "#0b1a0c",
  panelBorder: "#1f3d21",
  neon: "#7CFC00",
  neonDim: "#3f7a2e",
  neonSoft: "rgba(124,252,0,0.12)",
  white: "#f2f7f0",
  grey: "#7e8a7c",
  danger: "#ff5c5c",
  gold: "#e8c14a",
  purple: "#b98af0",
};

// ---------------------------------------------------------------------------
// Helpers — turn flashcards into multiple-choice questions
// ---------------------------------------------------------------------------

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Builds one multiple-choice question per flashcard. The correct option is
 * the card's own answer; the 3 distractors come from other cards' answers
 * in the same folder (unique where possible). If there aren't enough
 * unique wrong answers to go around, distractors repeat.
 */
function buildQuizQuestions(cards: FlashCard[]): QuizQuestion[] {
  if (cards.length === 0) return [];

  const allAnswers = cards.map((c) => c.answer);

  return cards.map((card) => {
    // Every other card's answer, excluding this card's own answer text
    // (guards against two cards coincidentally sharing an answer).
    const otherAnswers = cards
      .map((c, idx) => ({ id: c.id, answer: allAnswers[idx] }))
      .filter((c) => c.id !== card.id && c.answer !== card.answer)
      .map((c) => c.answer);

    let distractorPool = shuffle(Array.from(new Set(otherAnswers)));

    if (distractorPool.length === 0) {
      // Only one unique answer exists in the whole folder — nothing to
      // draw distractors from at all.
      distractorPool = ["N/A", "N/A", "N/A"];
    } else if (distractorPool.length < 3) {
      // Not enough unique wrong answers — repeat until we have 3.
      const filled: string[] = [];
      while (filled.length < 3) {
        filled.push(distractorPool[filled.length % distractorPool.length]);
      }
      distractorPool = filled;
    }

    const distractors = distractorPool.slice(0, 3);
    const shuffledOptions = shuffle([card.answer, ...distractors]);

    const options = {} as Record<OptionKey, string>;
    let correct: OptionKey = "A";
    OPTION_KEYS.forEach((key, i) => {
      options[key] = shuffledOptions[i];
      if (shuffledOptions[i] === card.answer) correct = key;
    });

    return { id: card.id, question: card.question, options, correct };
  });
}

// ---------------------------------------------------------------------------
// Game component — presentational, driven entirely by props
// ---------------------------------------------------------------------------

type AnswerState = "idle" | "correct" | "wrong";

interface QuizzyGameProps {
  questions: QuizQuestion[];
  isDataLoading: boolean;
  onAnswer: (cardId: string, correct: boolean) => void;
}

function QuizzyGame({
  questions,
  isDataLoading,
  onAnswer,
}: QuizzyGameProps): React.JSX.Element | null {
  const insets = useSafeAreaInsets();
  const { width } = Dimensions.get("window");
  const isTablet = width >= 768;
  const router = useRouter();

  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [selected, setSelected] = useState<OptionKey | null>(null);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [score, setScore] = useState<number>(0);
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [finished, setFinished] = useState<boolean>(false);

  const totalQuestions = questions.length;
  const question = questions[questionIndex];

  const handleSelect = useCallback(
    (key: OptionKey) => {
      if (answerState !== "idle" || !question) return; // lock after first pick

      setSelected(key);
      const isCorrect = key === question.correct;

      if (isCorrect) {
        setAnswerState("correct");
        setScore((s) => s + 100);
        setXp((x) => x + XP_PER_CORRECT);
        setStreak((s) => s + 1);
      } else {
        setAnswerState("wrong");
        setStreak(0);
      }

      // Report this card's result to the server (fire-and-forget, offline-first).
      onAnswer(question.id, isCorrect);
    },
    [answerState, question, onAnswer],
  );

  const handleNext = useCallback(() => {
    if (questionIndex + 1 >= totalQuestions) {
      setFinished(true);
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelected(null);
    setAnswerState("idle");
  }, [questionIndex, totalQuestions]);

  const handleRestart = useCallback(() => {
    setQuestionIndex(0);
    setSelected(null);
    setAnswerState("idle");
    setScore(0);
    setXp(0);
    setStreak(0);
    setFinished(false);
  }, []);

  const handleBack = useCallback(() => {
    router.replace("/(tabs)/game");
  }, [router]);

  const handleChangeFolder = useCallback(() => {
    router.navigate({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/Quizzy" },
    });
  }, [router]);

  // Progress is shown as a fixed-width fill bar (percentage of totalQuestions)
  // rather than one dot per question, so it can never overflow the card no
  // matter how many questions the deck has.
  const progressPercent =
    totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0;

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  const renderTopBar = () => (
    <View style={styles.topBar}>
      <Pressable
        onPress={handleBack}
        style={({ pressed }) => [
          styles.topBarButton,
          pressed && styles.topBarButtonPressed,
        ]}
        hitSlop={8}
      >
        <Icon name="chevron-left" size={22} color={theme.white} />
      </Pressable>

      <Pressable
        onPress={handleChangeFolder}
        style={({ pressed }) => [
          styles.topBarButton,
          pressed && styles.topBarButtonPressed,
        ]}
        hitSlop={8}
      >
        <Icon name="folder-outline" size={20} color={theme.white} />
      </Pressable>
    </View>
  );

  const renderOption = (key: OptionKey) => {
    if (!question) return null;
    const isSelected = selected === key;
    const isCorrectOption = key === question.correct;

    let optionStyle = styles.option;
    let letterStyle = styles.optionLetter;
    let textStyle = styles.optionText;

    if (answerState !== "idle") {
      if (isCorrectOption) {
        optionStyle = { ...styles.option, ...styles.optionCorrect };
        letterStyle = { ...styles.optionLetter, ...styles.optionLetterActive };
      } else if (isSelected && !isCorrectOption) {
        optionStyle = { ...styles.option, ...styles.optionWrong };
        letterStyle = { ...styles.optionLetter, ...styles.optionLetterWrong };
      } else {
        optionStyle = { ...styles.option, ...styles.optionDisabled };
      }
    }

    const showCorrectMark = answerState !== "idle" && isCorrectOption;
    const showWrongMark =
      answerState !== "idle" && isSelected && !isCorrectOption;

    return (
      <Pressable
        key={key}
        onPress={() => handleSelect(key)}
        disabled={answerState !== "idle"}
        style={({ pressed }) => [
          optionStyle,
          pressed && answerState === "idle" && styles.optionPressed,
        ]}
      >
        <View style={letterStyle}>
          <Text style={styles.optionLetterText}>{key}</Text>
        </View>
        <Text style={textStyle}>{question.options[key]}</Text>

        {/* Fixed-width slot, always present, so text never reflows when marks appear */}
        <View style={styles.resultMarkSlot}>
          {showCorrectMark && (
            <Icon name="check-bold" size={16} color={theme.neon} />
          )}
          {showWrongMark && (
            <Icon name="close-thick" size={16} color={theme.danger} />
          )}
        </View>
      </Pressable>
    );
  };

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (isDataLoading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        {renderTopBar()}
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.logo}>QUIZZY</Text>
          <ActivityIndicator
            color={theme.neon}
            size="large"
            style={{ marginTop: 24 }}
          />
          <Text style={[styles.tagline, { marginTop: 16 }]}>
            LOADING QUESTIONS…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Empty state — folder has no flashcards yet
  // -------------------------------------------------------------------------

  if (totalQuestions === 0) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        {renderTopBar()}
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.logo}>QUIZZY</Text>
          <Text style={[styles.tagline, { marginTop: 6 }]}>
            THINK. CHOOSE. SCORE.
          </Text>
          <Text style={styles.emptyText}>
            This folder doesn't have any flashcards yet.
          </Text>
          <Pressable style={styles.primaryButton} onPress={handleChangeFolder}>
            <Text style={styles.primaryButtonText}>CHOOSE ANOTHER FOLDER</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Finished screen
  // -------------------------------------------------------------------------

  if (finished) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        {renderTopBar()}
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.logo}>QUIZZY</Text>
          <Text style={styles.tagline}>THINK. CHOOSE. SCORE.</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Quiz Complete!</Text>
            <View style={styles.statsRow}>
              <StatBlock
                icon="trophy"
                label="SCORE"
                value={String(score)}
                color={theme.gold}
              />
              <StatBlock
                icon="lightning-bolt"
                label="XP GAINED"
                value={`+${xp}`}
                color={theme.neon}
              />
              <StatBlock
                icon="star"
                label="BEST STREAK"
                value={`x${streak}`}
                color={theme.purple}
              />
            </View>
          </View>

          <Pressable style={styles.primaryButton} onPress={handleRestart}>
            <Text style={styles.primaryButtonText}>PLAY AGAIN</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Main quiz screen
  // -------------------------------------------------------------------------

  if (!question) return null; // safety net — shouldn't happen given guards above

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom", "left", "right"]}
    >
      {renderTopBar()}
      <ScrollView
        contentContainerStyle={[
          styles.container,
          isTablet && styles.containerTablet,
          { paddingBottom: Math.max(insets.bottom, 16) + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>QUIZZY</Text>
          <Text style={styles.tagline}>THINK. CHOOSE. SCORE.</Text>
        </View>

        <View style={styles.questionCard}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionLabel}>
              QUESTION {questionIndex + 1}/{totalQuestions}
            </Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>

          <Text style={styles.questionText}>{question.question}</Text>

          <View style={styles.optionsList}>
            {OPTION_KEYS.map(renderOption)}
          </View>

          {answerState !== "idle" && (
            <Pressable style={styles.nextButton} onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {questionIndex + 1 >= totalQuestions ? "SEE RESULTS" : "NEXT →"}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.statsFooter}>
          <StatBlock
            icon="trophy"
            label="SCORE"
            value={String(score)}
            color={theme.gold}
          />
          <StatBlock
            icon="lightning-bolt"
            label="XP GAINED"
            value={`+${xp}`}
            color={theme.neon}
          />
          <StatBlock
            icon="star"
            label="STREAK"
            value={`x${streak}`}
            color={theme.purple}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Data wiring — same pattern as SpaceBlastGameContent
// ---------------------------------------------------------------------------

const QuizzyGameContent: React.FC<{ folderId: string; folderName: string }> = ({
  folderId,
}) => {
  const { cards, isDataLoading, handleAnswer } = useFlashcardSync(folderId);

  // Only rebuild the quiz set when a card's actual question/answer content
  // changes — NOT when `cards` is replaced purely because `handleAnswer`
  // flipped a card's status. That keeps the shuffled options stable
  // mid-quiz.
  const cardsSignature = cards
    .map((c) => `${c.id}:${c.question}:${c.answer}`)
    .join("|");
  const questions = useMemo(
    () => buildQuizQuestions(cards),
    [cardsSignature], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return (
    <QuizzyGame
      questions={questions}
      isDataLoading={isDataLoading}
      onAnswer={handleAnswer}
    />
  );
};

// ---------------------------------------------------------------------------
// Screen — reads folderId/folderName from the route, same as SpaceBlastScreen
// ---------------------------------------------------------------------------

const QuizzyScreen: React.FC = () => {
  const { folderId, folderName } = useLocalSearchParams<{
    folderId: string;
    folderName: string;
  }>();

  if (!folderId) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorText}>No folder selected.</Text>
      </View>
    );
  }

  return (
    <QuizzyGameContent
      key={folderId}
      folderId={folderId}
      folderName={folderName ?? "Quizzy"}
    />
  );
};

export default QuizzyScreen;

// ---------------------------------------------------------------------------
// Small sub-component
// ---------------------------------------------------------------------------

function StatBlock({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.statBlock}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.bg },
  errorScreen: {
    flex: 1,
    backgroundColor: theme.bg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: { color: theme.grey, fontSize: 16 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBarButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarButtonPressed: {
    borderColor: theme.neonDim,
    backgroundColor: theme.neonSoft,
  },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20 },
  containerTablet: {
    paddingHorizontal: 64,
    alignSelf: "center",
    width: "100%",
    maxWidth: 700,
  },
  centered: { justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", marginBottom: 24 },
  logo: {
    fontSize: 40,
    fontWeight: "900",
    color: theme.white,
    letterSpacing: 4,
    textShadowColor: theme.neon,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tagline: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: theme.neon,
    letterSpacing: 3,
  },
  emptyText: {
    marginTop: 20,
    color: theme.grey,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 24,
  },
  questionCard: {
    backgroundColor: theme.panel,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    padding: 20,
    shadowColor: theme.neon,
    shadowOpacity: Platform.OS === "ios" ? 0.15 : 0,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  questionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  questionLabel: {
    color: theme.neon,
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 2,
  },
  // Fixed-width progress bar — replaces the old one-dot-per-question row,
  // which had no width cap and overflowed the card once there were enough
  // questions. The track width never changes; only the fill percentage does.
  progressTrack: {
    width: 90,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.panelBorder,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.neon,
    borderRadius: 3,
  },
  questionText: {
    color: theme.white,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 27,
    marginBottom: 20,
  },
  optionsList: { gap: 12 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1.5,
    borderColor: theme.panelBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  optionPressed: {
    borderColor: theme.neonDim,
    backgroundColor: theme.neonSoft,
  },
  optionCorrect: { borderColor: theme.neon, backgroundColor: theme.neonSoft },
  optionWrong: {
    borderColor: theme.danger,
    backgroundColor: "rgba(255,92,92,0.10)",
  },
  optionDisabled: { opacity: 0.45 },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.neonDim,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterActive: { borderColor: theme.neon, backgroundColor: theme.neon },
  optionLetterWrong: {
    borderColor: theme.danger,
    backgroundColor: theme.danger,
  },
  optionLetterText: { color: theme.white, fontWeight: "800", fontSize: 13 },
  optionText: {
    color: theme.white,
    fontSize: 15,
    fontWeight: "600",
    flexShrink: 1,
  },
  resultMarkSlot: {
    marginLeft: "auto",
    width: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    marginTop: 20,
    backgroundColor: theme.neon,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  nextButtonText: {
    color: theme.bg,
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 2,
  },
  statsFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 28,
  },
  statBlock: { alignItems: "center", gap: 4 },
  statValue: { fontSize: 18, fontWeight: "900" },
  statLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.grey,
    letterSpacing: 1,
  },
  resultCard: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    borderRadius: 18,
    paddingVertical: 28,
    paddingHorizontal: 24,
    marginTop: 24,
    width: "100%",
    alignItems: "center",
  },
  resultTitle: {
    color: theme.white,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  primaryButton: {
    marginTop: 28,
    backgroundColor: theme.neon,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  primaryButtonText: {
    color: theme.bg,
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 2,
  },
});