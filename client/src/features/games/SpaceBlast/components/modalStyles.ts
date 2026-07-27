import { StyleSheet } from "react-native";
import { THEME } from "../colors";

/**
 * Styles shared by every full-screen popup (the "not enough cards"
 * modal, the win modal, and the game-over modal) so they all look
 * consistent without repeating the same style object three times.
 */
export const modalStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    backgroundColor: THEME.overlayBg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  card: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: THEME.panelBg,
    borderWidth: 1,
    borderColor: THEME.panelBorder,
    borderRadius: THEME.radiusMd,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: THEME.primary,
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 0 },
  },
  badge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.primaryGlow,
    borderWidth: 1,
    borderColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    color: THEME.textWhite,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 8,
  },
  subtitle: {
    color: THEME.textMid,
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 22,
  },
  button: {
    width: "100%",
    height: 46,
    borderRadius: THEME.radiusFull,
    backgroundColor: THEME.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: THEME.bg,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.6,
  },
});
