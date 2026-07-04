import { Redirect } from "expo-router";
import { useEffect } from "react";
import { initializeDatabase } from "../database/database";
import { requestNotificationPermission, configureNotifications } from "../services/NotificationService";

export default function Index() {
  useEffect(() => {
    initializeDatabase();
    configureNotifications();
    requestNotificationPermission().catch(console.error);
  }, []);

  return <Redirect href="/(tabs)/library" />;
}
