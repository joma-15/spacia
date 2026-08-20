import React, { useState, useMemo, useCallback } from "react";
import {
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
import { useRouter } from "expo-router";

/**
 * QUIZZY — single-file React Native + TypeScript multiple choice quiz game.
 * Theme: dark green / neon green "pixel arcade" style, matching the app banner.
 * Uses react-native-safe-area-context so it respects safe area insets on
 * both phones (notches/home indicator) and tablets.
 *
 * NOTE: requires `react-native-safe-area-context` to be installed and the
 * app root wrapped in a <SafeAreaProvider> (usually done in App root already).
 * Also requires `react-native-vector-icons` (or `@expo/vector-icons` on Expo).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type OptionKey = "A" | "B" | "C" | "D";

interface Question {
  id: number;
  question: string;
  options: Record<OptionKey, string>;
  correct: OptionKey;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What gas do plants absorb from the atmosphere?",
    options: { A: "Oxygen", B: "Carbon Dioxide", C: "Nitrogen", D: "Helium" },
    correct: "B",
  },
  {
    id: 2,
    question: "What is the powerhouse of the cell?",
    options: {
      A: "Nucleus",
      B: "Ribosome",
      C: "Mitochondria",
      D: "Golgi Body",
    },
    correct: "C",
  },
  {
    id: 3,
    question: "What is the chemical symbol for gold?",
    options: { A: "Ag", B: "Gd", C: "Go", D: "Au" },
    correct: "D",
  },
  {
    id: 4,
    question: "How many bones are in the adult human body?",
    options: { A: "206", B: "186", C: "215", D: "250" },
    correct: "A",
  },
  {
    id: 5,
    question: "What planet is known as the Red Planet?",
    options: { A: "Venus", B: "Mars", C: "Jupiter", D: "Saturn" },
    correct: "B",
  },
  {
    id: 6,
    question: "What is the largest ocean on Earth?",
    options: {
      A: "Atlantic",
      B: "Indian",
      C: "Arctic",
      D: "Pacific",
    },
    correct: "D",
  },
  {
    id: 7,
    question: "What force pulls objects toward the Earth?",
    options: { A: "Magnetism", B: "Gravity", C: "Friction", D: "Tension" },
    correct: "B",
  },
  {
    id: 8,
    question: "What is H2O more commonly known as?",
    options: { A: "Salt", B: "Hydrogen", C: "Water", D: "Oxygen" },
    correct: "C",
  },
];

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
// Component
// ---------------------------------------------------------------------------

type AnswerState = "idle" | "correct" | "wrong";

export default function Quizzy(): React.JSX.Element {
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

  const question = MOCK_QUESTIONS[questionIndex];
  const totalQuestions = MOCK_QUESTIONS.length;

  const handleSelect = useCallback(
    (key: OptionKey) => {
      if (answerState !== "idle") return; // lock after first pick

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
    },
    [answerState, question],
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

  // Placeholder handlers — wire up real navigation later.
  const handleBack = useCallback(() => {
    router.replace("/(tabs)/game")
    console.log("Back button pressed");
  }, []);

  const handleChangeFolder = useCallback(() => {
    // console.log("Change folder pressed");
    router.navigate({
      pathname: "/games/SelectionWizard",
      params: { gameRoute: "/games/Quizzy" }
    });
  }, [router]);

  const progressDots = useMemo(
    () => Array.from({ length: totalQuestions }, (_, i) => i),
    [totalQuestions],
  );

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

    // Decide which mark (if any) applies to this option once answered
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
          {
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>QUIZZY</Text>
          <Text style={styles.tagline}>THINK. CHOOSE. SCORE.</Text>
        </View>

        {/* Question card */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionLabel}>
              QUESTION {questionIndex + 1}
            </Text>
            <View style={styles.dotsRow}>
              {progressDots.map((i) => (
                <View
                  key={i}
                  style={[styles.dot, i <= questionIndex && styles.dotActive]}
                />
              ))}
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

        {/* Stats footer */}
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
  safeArea: {
    flex: 1,
    backgroundColor: theme.bg,
  },
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
  container: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  containerTablet: {
    paddingHorizontal: 64,
    alignSelf: "center",
    width: "100%",
    maxWidth: 700,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
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

  // Question card
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
  dotsRow: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.panelBorder,
  },
  dotActive: {
    backgroundColor: theme.neon,
  },
  questionText: {
    color: theme.white,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 27,
    marginBottom: 20,
  },

  optionsList: {
    gap: 12,
  },
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
  optionCorrect: {
    borderColor: theme.neon,
    backgroundColor: theme.neonSoft,
  },
  optionWrong: {
    borderColor: theme.danger,
    backgroundColor: "rgba(255,92,92,0.10)",
  },
  optionDisabled: {
    opacity: 0.45,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: theme.neonDim,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetterActive: {
    borderColor: theme.neon,
    backgroundColor: theme.neon,
  },
  optionLetterWrong: {
    borderColor: theme.danger,
    backgroundColor: theme.danger,
  },
  optionLetterText: {
    color: theme.white,
    fontWeight: "800",
    fontSize: 13,
  },
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

  // Stats footer / result screen
  statsFooter: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 28,
  },
  statBlock: {
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "900",
  },
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
