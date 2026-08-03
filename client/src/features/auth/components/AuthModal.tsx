import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import ForgotPasswordForm from "./ForgotPasswordForm";
import { colors, radius, shadow, spacing } from "../styles/styles";
import { MODAL_ANIM_DURATION_MS } from "../constants";
import { AuthMode } from "../types";

interface AuthModalProps {
  visible: boolean;
  initialMode?: AuthMode;
  notice?: string;
  onClose: () => void;
  onAuthenticated: () => void;
}

export default function AuthModal({
  visible,
  initialMode = "login",
  notice,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      animationRef.current?.stop();
      isClosingRef.current = false;
      setMode(initialMode);
      translateY.setValue(40);
      opacity.setValue(0);
      animationRef.current = Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: MODAL_ANIM_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: MODAL_ANIM_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
      animationRef.current.start();
    }
    return () => animationRef.current?.stop();
  }, [visible, initialMode, opacity, translateY]);

  const handleRequestClose = () => {
    Keyboard.dismiss();
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    animationRef.current?.stop();
    animationRef.current = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: MODAL_ANIM_DURATION_MS - 60,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 40,
        duration: MODAL_ANIM_DURATION_MS - 60,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animationRef.current.start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const handleSuccess = () => {
    Keyboard.dismiss();
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    animationRef.current?.stop();
    animationRef.current = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: MODAL_ANIM_DURATION_MS - 60,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 40,
        duration: MODAL_ANIM_DURATION_MS - 60,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    animationRef.current.start(({ finished }) => {
      if (finished) onAuthenticated();
    });
  };

  const titleForMode: Record<AuthMode, string> = {
    login: "Log In",
    register: "Create Account",
    forgotPassword: "Forgot Password",
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleRequestClose}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.backdrop, { opacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleRequestClose}
          />
        </Animated.View>

        <KeyboardAvoidingView
        style={styles.centerWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            styles.sheet,
            shadow.card,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{titleForMode[mode]}</Text>
              <TouchableOpacity
                onPress={handleRequestClose}
                style={styles.closeButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {!!notice && <Text style={styles.notice}>{notice}</Text>}
              {mode === "login" && (
                <LoginForm
                  onSwitchToRegister={() => setMode("register")}
                  onSwitchToForgotPassword={() => setMode("forgotPassword")}
                  onSuccess={handleSuccess}
                />
              )}
              {mode === "register" && (
                <RegisterForm
                  onSwitchToLogin={() => setMode("login")}
                  onSuccess={handleSuccess}
                />
              )}
              {mode === "forgotPassword" && (
                <ForgotPasswordForm onBackToLogin={() => setMode("login")} />
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: "88%",
  },
  safeArea: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  notice: {
    color: colors.textSecondary,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.md,
    textAlign: "center",
  },
});
