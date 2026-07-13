import { Tabs } from "expo-router";
import BottomNav from "@/shared/components/navigation/BottomNav";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "none",
      }}
      tabBar={(props) => <BottomNav {...props} />}
    >
      <Tabs.Screen name="library" />
      <Tabs.Screen name="payment" />
      <Tabs.Screen name="streakcomingsoon" />
      <Tabs.Screen name="game" />
    </Tabs>
  );
}
