import { Redirect } from "expo-router";
import { useEffect } from "react";
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
  }, []);

  return <Redirect href="/(tabs)/library" />;
}
