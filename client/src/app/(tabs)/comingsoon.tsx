import ComingSoonScreen from "@/features/coming-soon/screens/ComingSoonScreen";
import StreakAuthGate from "@/features/auth/StreakAuthGate";

export default function ComingSoon(){
    return (
        <StreakAuthGate>
            <ComingSoonScreen/>
        </StreakAuthGate>
    );
}
