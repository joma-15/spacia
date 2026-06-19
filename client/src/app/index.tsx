import LibraryScreen from "./LibraryScreen";
import { initializeDatabase } from "@/database/database";
import { useEffect } from "react";
import FlashcardScreen from "./FlashcardScreen";

export default function index(){
  //initilize the sqlite database 
  useEffect(() => {
    initializeDatabase();
  },[]);

  // return <LibraryScreen />;
  return <FlashcardScreen />;
}