import { MaterialCommunityIcons } from "@expo/vector-icons";
import { usePathname, router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
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
  const [pendingLogout, setPendingLogout] = useState(false);
  const loginTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [slideAnim] = useState(() => new Animated.Value(DRAWER_WIDTH));
  const [fadeAnim] = useState(() => new Animated.Value(0));

  const isMainTab = [
    "/library",
    "/game",
    "/streak",
    "/streakcomingsoon",
    "/ai",
  ].some((route) => pathname === route || pathname.endsWith(`(tabs)${route}`));

  const handleClose = React.useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      closeSidebar();
    });
  }, [closeSidebar, slideAnim, fadeAnim]);

  // Trigger slide-in animation when the sidebar opens
  useEffect(() => {
    if (isSidebarOpen) {
      slideAnim.setValue(DRAWER_WIDTH);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isSidebarOpen, slideAnim, fadeAnim]);

  useEffect(() => {
    if (!isMainTab) {
      closeSidebar();
      // Defer state resets to the next microtask tick to avoid triggering cascading synchronous renders.
      Promise.resolve().then(() => {
        setLoginVisible(false);
        setOpenLoginAfterClose(false);
        setPendingLogout(false);
      });
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
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

  // Delay logout state changes until the native sidebar has fully finished
  // its close transition to prevent overlay rendering conflicts on the native stack.
  useEffect(() => {
    if (isSidebarOpen || !pendingLogout) return;
    logoutTimerRef.current = setTimeout(async () => {
      setPendingLogout(false);
      await logout();
    }, DRAWER_DISMISS_MS);
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [isSidebarOpen, pendingLogout, logout]);

  useEffect(() => {
    if (!isSidebarOpen || Platform.OS === "web") return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        handleClose();
        return true;
      },
    );
    return () => subscription.remove();
  }, [isSidebarOpen, handleClose]);

  const handleLogin = () => {
    setOpenLoginAfterClose(true);
    handleClose();
  };

  const handleLogout = () => {
    setPendingLogout(true);
    handleClose();
  };

  if (!isMainTab) return null;

  return (
    <>
      {/* ── Top Header Actions: Pro Button + Profile Button ── */}
      <View
        style={[
          styles.topActionsContainer,
          { top: insets.top + (Platform.OS === "android" ? 6 : 6) },
        ]}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Upgrade to Spacia Pro"
          activeOpacity={0.85}
          hitSlop={8}
          onPress={() => router.push("/payment")}
          style={styles.proButton}
        >
          <View style={styles.proIconContainer}>
            <MaterialCommunityIcons name="crown" size={15} color="#FFD54A" />
          </View>

          <Text style={styles.proBadgeText}>PRO</Text>

          <MaterialCommunityIcons
            name="arrow-right"
            size={15}
            color={colors.background}
          />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open profile menu"
          activeOpacity={0.8}
          hitSlop={6}
          onPress={openSidebar}
          style={styles.profileButton}
        >
          <MaterialCommunityIcons
            name="account-circle"
            size={30}
            color={colors.accent}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isSidebarOpen}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              shadow.card,
              {
                paddingTop: insets.top + spacing.lg,
                paddingBottom: insets.bottom + spacing.lg,
                transform: [{ translateX: slideAnim }],
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Profile</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close profile menu"
                onPress={handleClose}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.accountSection}>
              <MaterialCommunityIcons
                name="account-circle"
                size={82}
                color={colors.accent}
              />
              {isRestoring ? (
                <Text style={styles.statusText}>Loading your profile…</Text>
              ) : user ? (
                <>
                  <Text style={styles.userName}>{user.username}</Text>
                  {!!user.email && (
                    <Text style={styles.email}>{user.email}</Text>
                  )}
                </>
              ) : (
                <Text style={styles.statusText}>You&apos;re not logged in</Text>
              )}
            </View>

            {/* ── Upgrade to Pro Card inside drawer ── */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                handleClose();
                router.push("/payment");
              }}
              style={styles.drawerProCard}
            >
              <View style={styles.drawerProHeader}>
                <View style={styles.drawerProIconWrap}>
                  <MaterialCommunityIcons
                    name="credit-card-outline"
                    size={20}
                    color={colors.accent}
                  />
                </View>
                <View style={styles.drawerProTextWrap}>
                  <Text style={styles.drawerProTitle}>Spacia Premium</Text>
                  <Text style={styles.drawerProSubtitle}>
                    Unlimited AI & study tools
                  </Text>
                </View>
              </View>
              <View style={styles.drawerProBadge}>
                <Text style={styles.drawerProBadgeText}>UPGRADE</Text>
              </View>
            </TouchableOpacity>

            {!isRestoring && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={user ? "Log out" : "Log in"}
                activeOpacity={0.85}
                onPress={user ? handleLogout : handleLogin}
                style={[
                  styles.actionButton,
                  user ? styles.logoutButton : styles.loginButton,
                ]}
                disabled={pendingLogout}
              >
                <MaterialCommunityIcons
                  name={user ? "logout" : "login"}
                  size={20}
                  color={user ? colors.danger : colors.background}
                />
                <Text
                  style={[
                    styles.actionText,
                    user ? styles.logoutText : styles.loginText,
                  ]}
                >
                  {user ? "Log Out" : "Log In"}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
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
  topActionsContainer: {
    position: "absolute",
    right: spacing.md,
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 31, 23, 0.95)",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
  },
  proButton: {
    height: 37,
    minWidth: 84,
    paddingHorizontal: 7,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    elevation: 8,
    shadowColor: colors.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  proIconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.20)",
  },
  proBadgeText: {
    color: colors.background,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 1,
  },
  modalRoot: { flex: 1, flexDirection: "row", justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  drawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  drawerTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "800" },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  accountSection: { alignItems: "center", paddingVertical: spacing.xl },
  userName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  email: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  drawerProCard: {
    backgroundColor: "rgba(52, 211, 153, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(52, 211, 153, 0.3)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  drawerProHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  drawerProIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(52, 211, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  drawerProTextWrap: {
    flex: 1,
  },
  drawerProTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  drawerProSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
  drawerProBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  drawerProBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  actionButton: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  loginButton: { backgroundColor: colors.accent },
  logoutButton: {
    backgroundColor: colors.dangerMuted,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  actionText: { fontSize: 16, fontWeight: "800" },
  loginText: { color: colors.background },
  logoutText: { color: colors.danger },
});
