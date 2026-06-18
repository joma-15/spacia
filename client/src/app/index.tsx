import LibraryScreen from "./LibraryScreen";
import { initializeDatabase } from "@/database/database";
import { useEffect } from "react";

export default function index(){
  //initilize the sqlite database 
  useEffect(() => {
    initializeDatabase();
  },[]);

  return <LibraryScreen />;
}