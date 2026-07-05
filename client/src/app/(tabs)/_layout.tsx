import { Tabs } from "expo-router";
import BottomNav from "../../../components/common/BottomNav";
export default function TabsLayout() {
  return (
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
        tabBar={(props) => <BottomNav {...props} />}
      >
        <Tabs.Screen name="library" />
        <Tabs.Screen name="payment" />
        <Tabs.Screen name="streakcomingsoon"/>
        <Tabs.Screen name="game"/>
      </Tabs>
  );
}