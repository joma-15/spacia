import { Tabs } from "expo-router";
import BottomNav from "@/shared/components/navigation/BottomNav";
import ProfileSidebar from "@/shared/components/navigation/ProfileSidebar";
import { StyleSheet, View } from "react-native";

import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

export default function TabsLayout() {
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
        tabBar={(props) => {
          const activeTab = props.state.routes[props.state.index].name;

          return (
            <>
              {activeTab === "library" && (
                <View style={styles.adContainer}>
                  <BannerAd
                    unitId={TestIds.BANNER}
                    size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
                  />
                </View>
              )}

              <BottomNav {...props} />
            </>
          );
        }}
      >
        <Tabs.Screen name="library" />
        <Tabs.Screen name="ai" />
        <Tabs.Screen name="streak" />
        <Tabs.Screen name="game" />
      </Tabs>

      <ProfileSidebar />
    </>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
});
