import { StreakDashboardScreen } from "@/features/streak/Streakdashboard.single";
import StreakAuthGate from "@/features/auth/StreakAuthGate";

export default function Streak(){
    return(
        <StreakAuthGate>
            <StreakDashboardScreen/>
        </StreakAuthGate>
    );
}