import LibraryScreen from "./LibraryScreen";
import { initializeDatabase } from "@/database/database";
import { useEffect } from "react";
import FlashcardScreen from "./FlashcardScreen";
import ScheduleWizardScreen from "./ScheduleWizardScreen";
import ScheduledSessionsScreen from "./ScheduledSessionsScreen";

export default function index(){
  //initilize the sqlite database 
  useEffect(() => {
    initializeDatabase();
  },[]);

  return <LibraryScreen />;
  // return <FlashcardScreen />;
  // return <ScheduledSessionsScreen />
  // return <ScheduleWizardScreen/>

}