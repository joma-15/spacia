import { authenticatedFetch } from "@/shared/services/authenticatedFetch";
import { readResource, writeResource } from "@/shared/database/resourceCacheRepository";
import { FetchPolicy, loadResource } from "@/shared/services/resourceStore";
import type { Achievement, CalendarDay, Challenge, DailyGoal, Folder, Statistics, StreakInfo } from "../types";
import { daysInMonth, toISODate } from "../utils/date";

interface DashboardResponse {
  streak: { current_streak: number; longest_streak: number; last_active_date: string | null };
  statistics: { cards_reviewed: number; games_played: number; study_time_minutes: number; xp_earned: number };
  daily_goal: { target: number; completed: number };
  calendar: string[];
  folders: { id: string; title: string; color: string; total_cards: number; understood_cards: number }[];
  achievements: { id: string; title: string; description: string; icon: string; progress: number; target: number }[];
  challenge: { id: string; title: string; description: string; reward_xp: number; progress: number; target: number; completed: boolean };
}

export interface DashboardData {
  streak: StreakInfo;
  statistics: Statistics;
  dailyGoal: DailyGoal;
  calendar: CalendarDay[];
  folders: Folder[];
  achievements: Achievement[];
  challenge: Challenge;
}

function makeCalendar(completedDates: string[]): CalendarDay[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const completed = new Set(completedDates);
  const today = toISODate(now);

  return Array.from({ length: daysInMonth(year, month) }, (_, index) => {
    const date = new Date(year, month, index + 1);
    const dateString = toISODate(date);
    return {
      date: dateString,
      day: index + 1,
      status: completed.has(dateString) ? "completed" : dateString === today ? "today" : date > now ? "future" : "missed",
    };
  });
}

function mapDashboard(response: DashboardResponse): DashboardData {
  return {
    streak: { currentStreak: response.streak.current_streak, longestStreak: response.streak.longest_streak, lastActiveDate: response.streak.last_active_date ?? "", freezesAvailable: 0 },
    statistics: { cardsReviewed: response.statistics.cards_reviewed, gamesPlayed: response.statistics.games_played, studyTimeMinutes: response.statistics.study_time_minutes, xpEarned: response.statistics.xp_earned },
    dailyGoal: { target: response.daily_goal.target, completed: response.daily_goal.completed },
    calendar: makeCalendar(response.calendar),
    folders: response.folders.map((folder) => ({ id: folder.id, title: folder.title, color: folder.color, icon: "folder-outline", totalCards: folder.total_cards, reviewCards: folder.total_cards - folder.understood_cards, understoodCards: folder.understood_cards, lastStudied: "" })),
    achievements: response.achievements.map((achievement) => ({ ...achievement, locked: achievement.progress < achievement.target })),
    challenge: { id: response.challenge.id, title: response.challenge.title, description: response.challenge.description, rewardXP: response.challenge.reward_xp, progress: response.challenge.progress, target: response.challenge.target, completed: response.challenge.completed },
  };
}

export const DashboardService = {
  getCachedDashboard(userId: string): DashboardData | null {
    return readResource<DashboardData>(userId, "streak-dashboard")?.data ?? null;
  },

  async getDashboard(userId: string, policy: FetchPolicy = "stale-while-revalidate"): Promise<DashboardData> {
    return loadResource({
      userId, resource: "streak-dashboard", staleTime: 2 * 60 * 1000, policy,
      readLocal: () => readResource<DashboardData>(userId, "streak-dashboard"),
      writeLocal: (data, updatedAt) => writeResource(userId, "streak-dashboard", data, updatedAt),
      fetchRemote: async () => {
        const response = await authenticatedFetch("/streak/dashboard");
        return mapDashboard((await response.json()) as DashboardResponse);
      },
    });
  },
};
