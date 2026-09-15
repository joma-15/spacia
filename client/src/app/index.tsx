import { Redirect } from "expo-router";
import { useEffect } from "react";
import mobileAds from "react-native-google-mobile-ads";
import { initializeDatabase } from "@/shared/database/database";
import {
  configureNotifications,
  requestNotificationPermission,
} from "@/shared/services/NotificationService";

export default function Index() {
  useEffect(() => {
    initializeDatabase();
    configureNotifications();
    requestNotificationPermission().catch(console.error);

    mobileAds()
      .initialize()
      .then(() => {
        console.log("AdMob initialized");
      })
      .catch((error) => {
        console.error("AdMob initialization failed:", error);
      });
  }, []);

  return <Redirect href="/(tabs)/library" />;
}