import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  BackHandler,
  Easing,
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
const ANIMATION_DURATION = 260;

export default function ProfileSidebar() {
  const insets = useSafeAreaInsets();
  const { user, isRestoring, logout } = useAuth();
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [openLoginAfterClose, setOpenLoginAfterClose] = useState(false);
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSidebarOpen) {
      setIsMounted(true);
      translateX.setValue(-DRAWER_WIDTH);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (!isMounted) return;
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -DRAWER_WIDTH,
        duration: ANIMATION_DURATION - 40,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: ANIMATION_DURATION - 40,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setIsMounted(false);
      if (openLoginAfterClose) {
        setOpenLoginAfterClose(false);
        setLoginVisible(true);
      }
    });
  }, [backdropOpacity, isMounted, isSidebarOpen, openLoginAfterClose, translateX]);

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
        visible={isMounted}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeSidebar}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={closeSidebar} />
          </Animated.View>
          <Animated.View
            style={[
              styles.drawer,
              shadow.card,
              { paddingTop: insets.top + spacing.lg, transform: [{ translateX }] },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Profile</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close profile menu"
                onPress={closeSidebar}
                style={styles.closeButton}
              >
                <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.accountSection}>
              <MaterialCommunityIcons name="account-circle" size={82} color={colors.accent} />
              {isRestoring ? (
                <Text style={styles.statusText}>Loading your profile…</Text>
              ) : user ? (
                <>
                  <Text style={styles.userName}>{user.username}</Text>
                  {!!user.email && <Text style={styles.email}>{user.email}</Text>}
                </>
              ) : (
                <Text style={styles.statusText}>You&apos;re not logged in</Text>
              )}
            </View>

            {!isRestoring && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={user ? "Log out" : "Log in"}
                activeOpacity={0.85}
                onPress={user ? handleLogout : handleLogin}
                style={[styles.actionButton, user ? styles.logoutButton : styles.loginButton]}
              >
                <MaterialCommunityIcons
                  name={user ? "logout" : "login"}
                  size={20}
                  color={user ? colors.danger : colors.background}
                />
                <Text style={[styles.actionText, user ? styles.logoutText : styles.loginText]}>
                  {user ? "Log Out" : "Log In"}
                </Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </Modal>

      <AuthModal
        visible={loginVisible}
        onClose={() => setLoginVisible(false)}
        onAuthenticated={() => setLoginVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    position: "absolute",
    right: spacing.md,
    zIndex: 100,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13, 31, 23, 0.9)",
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
  },
  modalRoot: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: colors.overlay },
  drawer: {
    width: DRAWER_WIDTH,
    height: "100%",
    backgroundColor: colors.surfaceElevated,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
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
  accountSection: { alignItems: "center", paddingVertical: spacing.xxl },
  userName: { color: colors.textPrimary, fontSize: 20, fontWeight: "800", marginTop: spacing.md },
  email: { color: colors.textSecondary, fontSize: 14, marginTop: spacing.xs, textAlign: "center" },
  statusText: { color: colors.textSecondary, fontSize: 16, fontWeight: "600", marginTop: spacing.md },
  actionButton: {
    height: 52,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  loginButton: { backgroundColor: colors.accent },
  logoutButton: { backgroundColor: colors.dangerMuted, borderWidth: 1, borderColor: colors.danger },
  actionText: { fontSize: 16, fontWeight: "800" },
  loginText: { color: colors.background },
  logoutText: { color: colors.danger },
});
