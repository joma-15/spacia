import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AuthModal from "@/features/auth/components/AuthModal";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { colors, radius, shadow, spacing } from "@/features/auth/styles/styles";
import { useSidebar } from "@/shared/context/SidebarContext";

const DRAWER_WIDTH = 304;
const DRAWER_DISMISS_MS = 280;

export default function ProfileSidebar() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { user, isRestoring, logout } = useAuth();
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [loginVisible, setLoginVisible] = useState(false);
  const [openLoginAfterClose, setOpenLoginAfterClose] = useState(false);
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMainTab = ["/library", "/game", "/streakcomingsoon", "/payment"].some(
    (route) => pathname === route || pathname.endsWith(`(tabs)${route}`),
  );

  useEffect(() => {
    if (!isMainTab) {
      closeSidebar();
      setLoginVisible(false);
      setOpenLoginAfterClose(false);
    }
  }, [closeSidebar, isMainTab]);

  // Switching from the drawer to AuthModal used to run two independent
  // animation lifecycles. Wait until the native drawer has fully dismissed,
  // then mount a fresh auth sheet exactly once.
  useEffect(() => {
    if (isSidebarOpen || !openLoginAfterClose) return;
    loginTimerRef.current = setTimeout(() => {
      setOpenLoginAfterClose(false);
      setLoginVisible(true);
    }, DRAWER_DISMISS_MS);
    return () => {
      if (loginTimerRef.current) clearTimeout(loginTimerRef.current);
    };
  }, [isSidebarOpen, openLoginAfterClose]);

  useEffect(() => {
    if (!isSidebarOpen || Platform.OS === "web") return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      closeSidebar();
      return true;
    });
    return () => subscription.remove();
  }, [closeSidebar, isSidebarOpen]);

  const handleLogin = () => {
    setOpenLoginAfterClose(true);
    closeSidebar();
  };

  const handleLogout = async () => {
    await logout();
    closeSidebar();
  };

  if (!isMainTab) return null;

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Open profile menu"
        activeOpacity={0.8}
        hitSlop={10}
        onPress={openSidebar}
        style={[styles.profileButton, { top: insets.top + spacing.sm }]}
      >
        <MaterialCommunityIcons name="account-circle" size={34} color={colors.accent} />
      </TouchableOpacity>

      <Modal
        visible={isSidebarOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={closeSidebar}
      >
        <View style={styles.modalRoot}>
          <View style={styles.backdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
          </View>
          <View
            style={[
              styles.drawer,
              shadow.card,
              { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Profile</Text>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close profile menu" onPress={closeSidebar} style={styles.closeButton}>
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.accountSection}>
              <MaterialCommunityIcons name="account-circle" size={82} color={colors.accent} />
              {isRestoring ? <Text style={styles.statusText}>Loading your profile…</Text> : user ? (
                <>
                  <Text style={styles.userName}>{user.username}</Text>
                  {!!user.email && <Text style={styles.email}>{user.email}</Text>}
                </>
              ) : <Text style={styles.statusText}>You&apos;re not logged in</Text>}
            </View>

            {!isRestoring && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={user ? "Log out" : "Log in"}
                activeOpacity={0.85}
                onPress={user ? handleLogout : handleLogin}
                style={[styles.actionButton, user ? styles.logoutButton : styles.loginButton]}
              >
                <MaterialCommunityIcons name={user ? "logout" : "login"} size={20} color={user ? colors.danger : colors.background} />
                <Text style={[styles.actionText, user ? styles.logoutText : styles.loginText]}>{user ? "Log Out" : "Log In"}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <AuthModal
        key={loginVisible ? "auth-open" : "auth-closed"}
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onAuthenticated={() => setLoginVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profileButton: { position: "absolute", right: spacing.md, zIndex: 100, width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(13, 31, 23, 0.9)", borderWidth: 1, borderColor: colors.border, elevation: 6 },
  modalRoot: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  drawer: { width: DRAWER_WIDTH, height: "100%", backgroundColor: colors.surfaceElevated, borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg, paddingHorizontal: spacing.lg },
  drawerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  drawerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
  closeButton: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  accountSection: { alignItems: "center", paddingVertical: spacing.xxl },
  userName: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: spacing.md },
  email: { color: colors.textSecondary, fontSize: 14, marginTop: spacing.xs, textAlign: "center" },
  statusText: { color: colors.textSecondary, fontSize: 16, fontWeight: "600", marginTop: spacing.md },
  actionButton: { height: 52, borderRadius: radius.md, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: spacing.sm },
  loginButton: { backgroundColor: colors.accent },
  logoutButton: { backgroundColor: colors.dangerMuted, borderWidth: 1, borderColor: colors.danger },
  actionText: { fontSize: 16, fontWeight: "800" },
  loginText: { color: colors.background },
  logoutText: { color: colors.danger },
});
