import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AddFolderProvider } from "@/shared/context/AddFolderContext";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AddFolderProvider>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </AddFolderProvider>
    </SafeAreaProvider>
  );
}
