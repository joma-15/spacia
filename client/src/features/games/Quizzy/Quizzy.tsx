import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
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
import {
  useFlashcardSync,
  QuizAnswerRecord,
} from "./UseflashcardSync";
import { FlashCard } from "@/features/flashcards/types";

/**
 * QUIZZY — single-file React Native + TypeScript multiple choice quiz game.
 *
 * Visual direction: a calm, dark-green study surface. The question is set in
 * a serif face like a printed flashcard, the answer options are full-width
 * rows, and the "Next" button is pinned to the bottom of the screen where
 * the thumb already is. Color is used to show meaning (right / wrong /
 * progress) instead of decoration, so there are no glows or neon text.
 *
 * Questions are built from a folder's real flashcards (via useFlashcardSync):
 * each card's `answer` is the correct option, and the 3 distractors are pulled
 * from OTHER cards' answers in the same folder. If the folder doesn't have
 * enough unique answers to fill A–D, distractors repeat until all questions
 * have been generated.
 *
 * SYNC MODEL:
 * Every answer during the game updates LOCAL state only (score, xp, streak,
 * question index, per-card correctness). Nothing is sent to the backend
 * until the game finishes, at which point ONE batched result — including
 * every card's answer — is sent via `onGameComplete`.
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

/**
 * The single payload sent to the backend when the game ends. Adjust in
 * `useFlashcardSync` (or wherever the actual request is built) to match the
 * real endpoint if it differs.
 */
export interface QuizSessionResult {
  folderId: string;
  answers: QuizAnswerRecord[];
  score: number;
  xp: number;
  correctAnswers: number;
  incorrectAnswers: number;
  totalQuestions: number;
  completed: true;
  durationSeconds: number;
}

const XP_PER_CORRECT = 150;
const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D"];

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

/**
 * Colors used by this screen. The greens are deliberately softer than a
 * pure neon so long study sessions are easy on the eyes.
 */
const theme = {
  bg: "#08110b",
  panel: "#101b13",
  panelBorder: "#213526",
  neon: "#8ee36b",
  neonDim: "#4d7a3f",
  neonSoft: "rgba(142,227,107,0.10)",
  white: "#eaf1e6",
  grey: "#8a998c",
  danger: "#f0736a",
  gold: "#e2c275",
};

/** Serif family for the question text, so it reads like a printed card. */
const SERIF = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "serif",
});

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
  folderId: string;
  questions: QuizQuestion[];
  isDataLoading: boolean;
  /**
   * Fired after every question. Local-only in practice (backed by
   * `recordAnswerLocally`, which never touches the network) — safe to call
   * on every answer without any network-related concerns.
   */
  onAnswer: (cardId: string, correct: boolean) => void;
  /**
   * Fired exactly once, when the game finishes, with the complete batched
   * result. This is the ONLY prop on this component that should ever
   * reach the network. May return void or a Promise; rejections are
   * caught and logged, never thrown back into the UI.
   */
  onGameComplete: (result: QuizSessionResult) => void | Promise<void>;
}

function QuizzyGame({
  folderId,
  questions,
  isDataLoading,
  onAnswer,
  onGameComplete,
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

  // ---------------------------------------------------------------------
  // Local-only gameplay tracking for the eventual ONE backend sync.
  // These are refs (not state) on purpose: they're written synchronously
  // inside `handleSelect`, so `submitFinalResult` always reads the true,
  // up-to-the-moment totals.
  // ---------------------------------------------------------------------
  const answersRef = useRef<QuizAnswerRecord[]>([]);
  const correctCountRef = useRef(0);
  const incorrectCountRef = useRef(0);
  const hasSubmittedRef = useRef(false);
  const startTimeRef = useRef<number>(Date.now());

  const totalQuestions = questions.length;
  const question = questions[questionIndex];

  // The single, guarded backend sync. Called once, when the game reaches
  // its terminal state — never from a useEffect keyed on score/progress.
  const submitFinalResult = useCallback(() => {
    if (hasSubmittedRef.current) return; // duplicate-submission guard
    hasSubmittedRef.current = true;

    const correctAnswers = correctCountRef.current;
    const incorrectAnswers = incorrectCountRef.current;
    const durationSeconds = Math.round(
      (Date.now() - startTimeRef.current) / 1000,
    );

    const result: QuizSessionResult = {
      folderId,
      answers: answersRef.current,
      score: correctAnswers * 100,
      xp: correctAnswers * XP_PER_CORRECT,
      correctAnswers,
      incorrectAnswers,
      totalQuestions,
      completed: true,
      durationSeconds,
    };

    try {
      const maybePromise = onGameComplete(result);
      if (
        maybePromise &&
        typeof (maybePromise as Promise<void>).catch === "function"
      ) {
        (maybePromise as Promise<void>).catch((err) => {
          // Gameplay already finished locally — a failed sync must not
          // roll back the score, restart the game, or retry-spam the
          // backend. If the app has an offline queue elsewhere, hook it
          // in here instead of this log line.
          console.warn("[Quizzy] Failed to sync final result:", err);
        });
      }
    } catch (err) {
      console.warn("[Quizzy] Failed to sync final result:", err);
    }
  }, [onGameComplete, folderId, totalQuestions]);

  const handleSelect = useCallback(
    (key: OptionKey) => {
      if (answerState !== "idle" || !question) return; // lock after first pick

      setSelected(key);
      const isCorrect = key === question.correct;

      // Local-only bookkeeping for the end-of-game sync. No network call.
      answersRef.current.push({ cardId: question.id, correct: isCorrect });
      if (isCorrect) {
        correctCountRef.current += 1;
      } else {
        incorrectCountRef.current += 1;
      }

      if (isCorrect) {
        setAnswerState("correct");
        setScore((s) => s + 100);
        setXp((x) => x + XP_PER_CORRECT);
        setStreak((s) => s + 1);
      } else {
        setAnswerState("wrong");
        setStreak(0);
      }

      // Local status write only (SQLite + on-screen card state) — no
      // network request happens here.
      onAnswer(question.id, isCorrect);
    },
    [answerState, question, onAnswer],
  );

  const handleNext = useCallback(() => {
    if (questionIndex + 1 >= totalQuestions) {
      setFinished(true);
      submitFinalResult(); // the ONE backend request for the whole game
      return;
    }
    setQuestionIndex((i) => i + 1);
    setSelected(null);
    setAnswerState("idle");
  }, [questionIndex, totalQuestions, submitFinalResult]);

  const handleRestart = useCallback(() => {
    setQuestionIndex(0);
    setSelected(null);
    setAnswerState("idle");
    setScore(0);
    setXp(0);
    setStreak(0);
    setFinished(false);

    // Reset local tracking so a replay produces its own independent final
    // sync, instead of being silently blocked by the previous game's guard.
    answersRef.current = [];
    correctCountRef.current = 0;
    incorrectCountRef.current = 0;
    hasSubmittedRef.current = false;
    startTimeRef.current = Date.now();
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

  // Progress is a fixed-width fill bar (percentage of totalQuestions), so it
  // can never overflow no matter how many questions the deck has.
  const progressPercent =
    totalQuestions > 0 ? ((questionIndex + 1) / totalQuestions) * 100 : 0;

  // Animate the fill toward its new width whenever the question changes.
  const progressAnim = useRef(new Animated.Value(progressPercent)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progressPercent,
      duration: 250,
      useNativeDriver: false, // width can't use the native driver
    }).start();
  }, [progressPercent, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------

  /**
   * Back button on the left, folder picker on the right, and a short title
   * in the middle (the question counter while playing, "Quizzy" elsewhere).
   */
  const renderTopBar = (title: string) => (
    <View style={styles.topBar}>
      <Pressable
        onPress={handleBack}
        accessibilityRole="button"
        accessibilityLabel="Back to games"
        style={({ pressed }) => [
          styles.topBarButton,
          pressed && styles.topBarButtonPressed,
        ]}
        hitSlop={8}
      >
        <Icon name="chevron-left" size={22} color={theme.white} />
      </Pressable>

      <Text style={styles.topBarTitle}>{title}</Text>

      <Pressable
        onPress={handleChangeFolder}
        accessibilityRole="button"
        accessibilityLabel="Choose another folder"
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

  /** One answer row: letter badge, answer text, and a result mark. */
  const renderOption = (key: OptionKey) => {
    if (!question) return null;
    const revealed = answerState !== "idle";
    const isSelected = selected === key;
    const isCorrectOption = key === question.correct;

    const showCorrectMark = revealed && isCorrectOption;
    const showWrongMark = revealed && isSelected && !isCorrectOption;
    const isDimmed = revealed && !showCorrectMark && !showWrongMark;

    return (
      <Pressable
        key={key}
        onPress={() => handleSelect(key)}
        disabled={revealed}
        accessibilityRole="button"
        accessibilityLabel={`Option ${key}: ${question.options[key]}`}
        accessibilityState={{ disabled: revealed, selected: isSelected }}
        style={({ pressed }) => [
          styles.option,
          pressed && !revealed && styles.optionPressed,
          showCorrectMark && styles.optionCorrect,
          showWrongMark && styles.optionWrong,
          isDimmed && styles.optionDimmed,
        ]}
      >
        <View
          style={[
            styles.optionLetter,
            showCorrectMark && styles.optionLetterCorrect,
            showWrongMark && styles.optionLetterWrong,
          ]}
        >
          <Text
            style={[
              styles.optionLetterText,
              (showCorrectMark || showWrongMark) && styles.optionLetterTextOnFill,
            ]}
          >
            {key}
          </Text>
        </View>
        <Text style={styles.optionText}>{question.options[key]}</Text>

        {/* Fixed-width slot, always present, so text never reflows when marks appear */}
        <View style={styles.resultMarkSlot}>
          {showCorrectMark && (
            <Icon name="check-bold" size={18} color={theme.neon} />
          )}
          {showWrongMark && (
            <Icon name="close-thick" size={18} color={theme.danger} />
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
        {renderTopBar("Quizzy")}
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator color={theme.neon} size="large" />
          <Text style={styles.statusText}>Loading questions</Text>
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
        {renderTopBar("Quizzy")}
        <View style={[styles.container, styles.centered]}>
          <Icon name="cards-outline" size={40} color={theme.neonDim} />
          <Text style={styles.emptyTitle}>No flashcards in this folder</Text>
          <Text style={styles.emptyText}>
            Add some flashcards to it, or pick a different folder to play.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleChangeFolder}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>Choose a folder</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Finished screen
  // -------------------------------------------------------------------------

  if (finished) {
    // Each correct answer is worth 100 points, so this is derived from score.
    const correctCount = Math.round(score / 100);

    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={["top", "bottom", "left", "right"]}
      >
        {renderTopBar("Quizzy")}
        <View
          style={[
            styles.finishedBody,
            isTablet && styles.containerTablet,
          ]}
        >
          <View>
            <Text style={styles.finishedTitle}>Round complete</Text>
            <Text style={styles.finishedSummary}>
              {correctCount} of {totalQuestions} correct
            </Text>

            <View style={styles.ledger}>
              <LedgerRow
                icon="trophy-outline"
                label="Score"
                value={String(score)}
                color={theme.gold}
              />
              <LedgerRow
                icon="lightning-bolt"
                label="XP gained"
                value={`+${xp}`}
                color={theme.neon}
              />
              <LedgerRow
                icon="fire"
                label="Streak"
                value={`x${streak}`}
                color={theme.white}
                isLast
              />
            </View>
          </View>

          <View>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                styles.fullWidthButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleRestart}
              accessibilityRole="button"
            >
              <Text style={styles.primaryButtonText}>Play again</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleChangeFolder}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryButtonText}>
                Choose another folder
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // -------------------------------------------------------------------------
  // Main quiz screen
  // -------------------------------------------------------------------------

  if (!question) return null; // safety net — shouldn't happen given guards above

  const isLastQuestion = questionIndex + 1 >= totalQuestions;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "bottom", "left", "right"]}
    >
      {renderTopBar(`Question ${questionIndex + 1} of ${totalQuestions}`)}

      <View style={styles.progressTrack}>
        <Animated.View
          style={[styles.progressFill, { width: progressWidth }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.container,
          isTablet && styles.containerTablet,
          { paddingBottom: 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <InlineStat
            icon="trophy-outline"
            value={String(score)}
            label="Score"
            color={theme.gold}
          />
          <InlineStat
            icon="lightning-bolt"
            value={`+${xp}`}
            label="XP gained"
            color={theme.neon}
          />
          <InlineStat
            icon="fire"
            value={`x${streak}`}
            label="Streak"
            color={theme.white}
          />
        </View>

        <Text style={styles.questionText}>{question.question}</Text>

        <View style={styles.optionsList}>{OPTION_KEYS.map(renderOption)}</View>
      </ScrollView>

      {/* Footer keeps a fixed height so the layout never jumps when the button appears */}
      <View style={[styles.footer, isTablet && styles.footerTablet]}>
        {answerState !== "idle" && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              styles.fullWidthButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={handleNext}
            accessibilityRole="button"
          >
            <Text style={styles.primaryButtonText}>
              {isLastQuestion ? "See results" : "Next question"}
            </Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Data wiring — same pattern as SpaceBlastGameContent
// ---------------------------------------------------------------------------

const QuizzyGameContent: React.FC<{ folderId: string; folderName: string }> = ({
  folderId,
}) => {
  const { cards, isDataLoading, recordAnswerLocally, submitGameResults } =
    useFlashcardSync(folderId);

  // Only rebuild the quiz set when a card's actual question/answer content
  // changes — NOT when `cards` is replaced purely because of an unrelated
  // sync. That keeps the shuffled options stable mid-quiz.
  const cardsSignature = cards
    .map((c : any) => `${c.id}:${c.question}:${c.answer}`)
    .join("|");
  const questions = useMemo(
    () => buildQuizQuestions(cards),
    [cardsSignature], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // The ONE network call for the whole game — fires once, when
  // `submitFinalResult` inside QuizzyGame calls this at completion.
  const onGameComplete = useCallback(
    (result: QuizSessionResult) => submitGameResults(result.answers),
    [submitGameResults],
  );

  return (
    <QuizzyGame
      folderId={folderId}
      questions={questions}
      isDataLoading={isDataLoading}
      onAnswer={recordAnswerLocally}
      onGameComplete={onGameComplete}
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
        <Text style={styles.errorText}>
          No folder selected. Go back and choose one to start.
        </Text>
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
// Small sub-components
// ---------------------------------------------------------------------------

/**
 * A compact icon + value pair shown above the question (score, xp, streak).
 * The label is only used for screen readers; the icon carries the meaning.
 */
function InlineStat({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View
      style={styles.inlineStat}
      accessible
      accessibilityLabel={`${label}: ${value}`}
    >
      <Icon name={icon} size={16} color={color} />
      <Text style={[styles.inlineStatValue, { color }]}>{value}</Text>
    </View>
  );
}

/**
 * One line of the results list on the finished screen: icon, label on the
 * left, value on the right, with a thin divider under it (except the last).
 */
function LedgerRow({
  icon,
  label,
  value,
  color,
  isLast,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
  color: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.ledgerRow, !isLast && styles.ledgerRowDivider]}>
      <Icon name={icon} size={20} color={color} />
      <Text style={styles.ledgerLabel}>{label}</Text>
      <Text style={[styles.ledgerValue, { color }]}>{value}</Text>
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
    paddingHorizontal: 32,
  },
  errorText: {
    color: theme.grey,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  topBarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarButtonPressed: {
    backgroundColor: theme.neonSoft,
  },
  topBarTitle: {
    color: theme.grey,
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // Progress
  progressTrack: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    backgroundColor: theme.panelBorder,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: theme.neon,
    borderRadius: 2,
  },

  // Layout containers
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 24 },
  containerTablet: {
    paddingHorizontal: 64,
    alignSelf: "center",
    width: "100%",
    maxWidth: 700,
  },
  centered: { justifyContent: "center", alignItems: "center" },

  // Loading / empty
  statusText: {
    marginTop: 16,
    color: theme.grey,
    fontSize: 15,
  },
  emptyTitle: {
    marginTop: 16,
    color: theme.white,
    fontFamily: SERIF,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyText: {
    marginTop: 8,
    color: theme.grey,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 24,
  },

  // Stats above the question
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginBottom: 28,
  },
  inlineStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inlineStatValue: {
    fontSize: 15,
    fontWeight: "700",
  },

  // Question
  questionText: {
    color: theme.white,
    fontFamily: SERIF,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: 28,
  },

  // Options
  optionsList: { gap: 10 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 14,
  },
  optionPressed: {
    borderColor: theme.neonDim,
    backgroundColor: theme.neonSoft,
  },
  optionCorrect: { borderColor: theme.neon, backgroundColor: theme.neonSoft },
  optionWrong: {
    borderColor: theme.danger,
    backgroundColor: "rgba(240,115,106,0.10)",
  },
  optionDimmed: { opacity: 0.4 },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.panelBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterCorrect: {
    borderColor: theme.neon,
    backgroundColor: theme.neon,
  },
  optionLetterWrong: {
    borderColor: theme.danger,
    backgroundColor: theme.danger,
  },
  optionLetterText: { color: theme.grey, fontWeight: "700", fontSize: 13 },
  optionLetterTextOnFill: { color: theme.bg },
  optionText: {
    color: theme.white,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "500",
    flexShrink: 1,
    flexGrow: 1,
  },
  resultMarkSlot: {
    width: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer with the Next button
  footer: {
    minHeight: 76,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: "center",
  },
  footerTablet: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 700,
    paddingHorizontal: 64,
  },

  // Buttons
  primaryButton: {
    backgroundColor: theme.neon,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 28,
    alignItems: "center",
    marginTop: 24,
  },
  fullWidthButton: { alignSelf: "stretch", marginTop: 0 },
  primaryButtonText: {
    color: theme.bg,
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryButton: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 8,
  },
  secondaryButtonText: {
    color: theme.grey,
    fontWeight: "600",
    fontSize: 15,
  },
  buttonPressed: { opacity: 0.8 },

  // Finished screen
  finishedBody: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 12,
  },
  finishedTitle: {
    color: theme.grey,
    fontSize: 15,
    fontWeight: "600",
  },
  finishedSummary: {
    marginTop: 6,
    color: theme.white,
    fontFamily: SERIF,
    fontSize: 38,
    fontWeight: "700",
    lineHeight: 46,
  },
  ledger: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: theme.panelBorder,
  },
  ledgerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
  },
  ledgerRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.panelBorder,
  },
  ledgerLabel: {
    flex: 1,
    color: theme.white,
    fontSize: 16,
  },
  ledgerValue: {
    fontSize: 18,
    fontWeight: "800",
  },
});