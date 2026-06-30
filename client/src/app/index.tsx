import { Redirect } from "expo-router";
import { initializeDatabase } from '../database/database';
import { useEffect } from "react";

export default function Index() {
  useEffect(() => {
    initializeDatabase();
  },[]);
  
  return <Redirect href="/(tabs)/library" />;
}