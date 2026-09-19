import { Tabs } from "expo-router";
import BottomNav from "@/shared/components/navigation/BottomNav";
import ProfileSidebar from "@/shared/components/navigation/ProfileSidebar";
import { StyleSheet, View } from "react-native";

import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
import { useState } from "react";
import { AdProvider } from "@/shared/context/AdContext";

export default function TabsLayout() {
  //check if the ad is visible or not 
  const [isadVisible, setIsAdVisible] = useState(false);

  return (
    <>
      <AdProvider isAdVisible={isadVisible}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: "none",
        }}
        tabBar={(props) => {
          const activeTab = props.state.routes[props.state.index].name;

          return (
            <>
              {/* {activeTab === "library" && (
                <View style={styles.adContainer}>
                  <BannerAd
                    unitId={TestIds.BANNER}
                    size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
                  />
                </View>
              )} */}

              {/* <View style={styles.adContainer}>
                <BannerAd
                  unitId={TestIds.BANNER}
                  size={BannerAdSize.LARGE_ANCHORED_ADAPTIVE_BANNER}
                  onAdLoaded={() => setIsAdVisible(true)}
                  onAdFailedToLoad={() => {setIsAdVisible(false)}}
                />
              </View> */}

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
        </AdProvider>
    </>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: "center",
    marginVertical: 16,
  },
});
