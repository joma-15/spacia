import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AchievementCard } from "./components/AchievementCard";
import { CalendarCard } from "./components/CalendarCard";
import { ChallengeCard } from "./components/ChallengeCard";
import { DailyGoalCard } from "./components/DailyGoalCard";
import { FolderCard } from "./components/FolderCard";
import { Header } from "./components/Header";
import { QuoteCard } from "./components/QuoteCard";
import { SectionHeader } from "./components/SectionHeader";
import { SkeletonCard } from "./components/SkeletonCard";
import { StatisticsCard } from "./components/StatisticsCard";

import { colors, spacing } from "./constants/theme";
import { useAchievements } from "./hooks/useAchievements";
import { useCalendar } from "./hooks/useCalendar";
import { useDailyChallenge } from "./hooks/useDailyChallenge";
import { useDailyGoal } from "./hooks/useDailyGoal";
import { useFolders } from "./hooks/useFolders";
import { useQuote } from "./hooks/useQuote";
import { useStatistics } from "./hooks/useStatistics";
import { useStreak } from "./hooks/useStreak";
import { formatXP } from "./utils/xp";

/** Formats minutes as e.g. "7h 45m" or "45m" for the Study Time stat card. */
function formatStudyTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

export default function StreakDashboardScreen() {
  const streak = useStreak();
  const dailyGoal = useDailyGoal();
  const statistics = useStatistics();
  const calendar = useCalendar();
  const achievements = useAchievements();
  const folders = useFolders();
  const challenge = useDailyChallenge();
  const { quote, nextQuote } = useQuote();

  const [manualRefreshing, setManualRefreshing] = useState(false);

  const isAnyRefreshing =
    manualRefreshing ||
    streak.refreshing ||
    dailyGoal.refreshing ||
    statistics.refreshing ||
    calendar.refreshing ||
    achievements.refreshing ||
    folders.refreshing ||
    challenge.refreshing;

  const handleRefresh = useCallback(async () => {
    setManualRefreshing(true);
    nextQuote();
    await Promise.all([
      streak.refresh(),
      dailyGoal.refresh(),
      statistics.refresh(),
      calendar.refresh(),
      achievements.refresh(),
      folders.refresh(),
      challenge.refresh(),
    ]);
    setManualRefreshing(false);
  }, [
    achievements,
    calendar,
    challenge,
    dailyGoal,
    folders,
    nextQuote,
    statistics,
    streak,
  ]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isAnyRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* 1. Greeting */}
        <Header streakDays={streak.data?.currentStreak ?? 0} />

        {/* 2. Daily Goal */}
        <View style={styles.sectionSpacing}>
          {dailyGoal.loading ? (
            <SkeletonCard height={160} />
          ) : (
            dailyGoal.data && (
              <DailyGoalCard
                target={dailyGoal.data.target}
                completed={dailyGoal.data.completed}
                percent={dailyGoal.percent}
                remaining={dailyGoal.remaining}
                isComplete={dailyGoal.isComplete}
                message={dailyGoal.message}
              />
            )
          )}
        </View>

        {/* 3. Statistics */}
        <View style={styles.sectionSpacing}>
          <SectionHeader title="Statistics" />
          {statistics.loading ? (
            <View style={styles.statsGrid}>
              <SkeletonCard height={92} width="48%" />
              <SkeletonCard height={92} width="48%" />
              <SkeletonCard height={92} width="48%" />
              <SkeletonCard height={92} width="48%" />
            </View>
          ) : (
            statistics.data && (
              <View style={styles.statsGrid}>
                <StatisticsCard
                  icon="cards-outline"
                  label="Cards Reviewed"
                  value={statistics.data.cardsReviewed.toLocaleString()}
                  accentColor={colors.primary}
                />
                <StatisticsCard
                  icon="gamepad-variant-outline"
                  label="Games Played"
                  value={`${statistics.data.gamesPlayed}`}
                  accentColor={colors.info}
                />
                <StatisticsCard
                  icon="clock-outline"
                  label="Study Time"
                  value={formatStudyTime(statistics.data.studyTimeMinutes)}
                  accentColor={colors.accent}
                />
                <StatisticsCard
                  icon="star-four-points-outline"
                  label="XP Earned"
                  value={formatXP(statistics.data.xpEarned)}
                  accentColor={colors.xpGold}
                />
              </View>
            )
          )}
        </View>

        {/* 4. Study Calendar */}
        <View style={styles.sectionSpacing}>
          <SectionHeader title="Study Calendar" />
          {calendar.loading ? (
            <SkeletonCard height={280} />
          ) : (
            calendar.data && <CalendarCard days={calendar.data} />
          )}
        </View>

        {/* 5. Achievements */}
        <View style={styles.sectionSpacing}>
          <SectionHeader title="Achievements" />
          {achievements.loading ? (
            <View style={styles.achievementsRow}>
              <SkeletonCard height={150} width={168} />
              <SkeletonCard height={150} width={168} />
              <SkeletonCard height={150} width={168} />
            </View>
          ) : (
            achievements.data && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.achievementsRow}
              >
                {achievements.data.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </ScrollView>
            )
          )}
        </View>

        {/* 6. Continue Studying */}
        <View style={styles.sectionSpacing}>
          <SectionHeader title="Continue Studying" />
          {folders.loading ? (
            <View style={styles.foldersGrid}>
              <SkeletonCard height={140} width="48%" />
              <SkeletonCard height={140} width="48%" />
              <SkeletonCard height={140} width="48%" />
              <SkeletonCard height={140} width="48%" />
            </View>
          ) : (
            folders.data && (
              <View style={styles.foldersGrid}>
                {folders.data.map((folder) => (
                  <FolderCard key={folder.id} folder={folder} />
                ))}
              </View>
            )
          )}
        </View>

        {/* 7. Daily Challenge */}
        <View style={styles.sectionSpacing}>
          <SectionHeader title="Daily Challenge" />
          {challenge.loading ? (
            <SkeletonCard height={190} />
          ) : (
            challenge.data && (
              <ChallengeCard
                challenge={challenge.data}
                starting={challenge.starting}
                onStart={challenge.startChallenge}
              />
            )
          )}
        </View>

        {/* 8. Motivational Quote */}
        <View style={styles.sectionSpacing}>
          <QuoteCard quote={quote} />
        </View>

        {/* Extra bottom padding so content clears the tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionSpacing: {
    marginBottom: spacing.xl,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  achievementsRow: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  foldersGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  bottomSpacer: {
    height: 96,
  },
});
