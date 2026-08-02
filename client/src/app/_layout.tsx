import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { AddFolderProvider } from "@/shared/context/AddFolderContext";
import { SidebarProvider } from "@/shared/context/SidebarContext";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SidebarProvider>
          <AddFolderProvider>
            <Stack
              screenOptions={{
                headerShown: false,
              }}
            />
          </AddFolderProvider>
        </SidebarProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
