import { Redirect } from "expo-router";
import { initializeDatabase } from '../database/database';
import { useEffect } from "react";
import { requestNotificationPermission } from "../../services/NotificationService";

export default function Index() {
  useEffect(() => {
    initializeDatabase();
    requestNotificationPermission().catch(console.error);
  },[]);
  
  return <Redirect href="/(tabs)/library" />;
}