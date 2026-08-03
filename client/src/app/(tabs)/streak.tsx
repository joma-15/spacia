import StreakAuthGate from "@/features/auth/StreakAuthGate";
import StreakDashboardScreen from "../StreakScreen";

export default function Streak() {
  return (
    <StreakAuthGate>
      <StreakDashboardScreen />
    </StreakAuthGate>
  );
}
