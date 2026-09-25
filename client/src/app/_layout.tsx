import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/features/auth/hooks/useAuth";
import { AddFolderProvider } from "@/shared/context/AddFolderContext";
import { SidebarProvider } from "@/shared/context/SidebarContext";
import { SubscriptionProvider } from "@/shared/context/SubscriptionContext";

export default function Layout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <SidebarProvider>
            <AddFolderProvider>
              <Stack
                screenOptions={{
                  headerShown: false,
                }}
              />
            </AddFolderProvider>
          </SidebarProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
