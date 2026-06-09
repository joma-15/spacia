/**
 * HomeScreen.tsx
 *
 * Main home screen for the Flashcard Learning App.
 * Professional dark-green theme — high contrast, clean, modern.
 *
 * Break this file down into:
 *   - components/FolderCard.tsx
 *   - components/BottomNavBar.tsx
 *   - components/PopupToggleBanner.tsx
 *   - constants/theme.ts
 */

import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ─────────────────────────────────────────────
// 🎨 THEME — move to constants/theme.ts
// ─────────────────────────────────────────────
const THEME = {
  // Palette — dark, professional, high contrast
  bg: "#0F1F17", // Very dark forest green background
  bgCard: "#162B1E", // Slightly lighter card surface
  bgElevated: "#1C3527", // Elevated surface (nav, banners)
  primary: "#3DDC84", // Vivid green — primary actions & highlights
  primaryDim: "#2AAF63", // Slightly muted green for secondary elements
  primaryGlow: "#3DDC8430", // Transparent green for glow effects
  accent: "#FFD166", // Warm gold — streak & badges
  accentDim: "#FFD16620", // Transparent gold for chip backgrounds
  textWhite: "#F0FFF6", // Near-white headings
  textMid: "#A8C5B0", // Medium grey-green for body
  textMuted: "#5A7A65", // Muted for labels / subtitles
  border: "#243D2C", // Subtle dark border
  borderBright: "#2E5438", // Brighter border for interactive elements

  // Folder accent colors — vivid but contained
  folderBlue: "#4A90D9",
  folderGreen: "#3DDC84",
  folderRed: "#E05C7A",
  folderGold: "#FFD166",

  // Spacing & radii
  radiusSm: 10,
  radiusMd: 16,
  radiusLg: 22,
  radiusFull: 999,

  // Shadows
  cardShadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  glowShadow: {
    shadowColor: "#3DDC84",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
};

// ─────────────────────────────────────────────
// 📁 FOLDER CARD — move to components/FolderCard.tsx
// Displays a subject folder with name, card count, and overflow menu.
// ─────────────────────────────────────────────
interface FolderCardProps {
  subject: string;
  cardCount: number;
  accentColor?: string;
}

const FolderCard: React.FC<FolderCardProps> = ({
  subject,
  cardCount,
  accentColor = THEME.folderGreen,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.folderCard, THEME.cardShadow]}
    >
      {/* ⋮ overflow menu */}
      <TouchableOpacity
        style={styles.folderOverflow}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Text style={styles.folderOverflowDots}>⋮</Text>
      </TouchableOpacity>

      {/* Folder icon built with Views */}
      <View style={styles.folderIconWrap}>
        <View style={[styles.folderTab, { backgroundColor: accentColor }]} />
        <View
          style={[
            styles.folderBody,
            {
              backgroundColor: accentColor + "28",
              borderColor: accentColor + "55",
              borderWidth: 1,
            },
          ]}
        >
          {/* Folder icon glyph */}
          <Text style={[styles.folderEmoji, { color: accentColor }]}>📂</Text>
        </View>
      </View>

      {/* Subject name */}
      <Text style={styles.folderTitle}>{subject}</Text>

      {/* Card count pill */}
      <View
        style={[
          styles.cardCountBadge,
          {
            backgroundColor: accentColor + "22",
            borderColor: accentColor + "55",
          },
        ]}
      >
        <Text style={[styles.cardCountText, { color: accentColor }]}>
          {cardCount} cards
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// 🔲 NAV ITEM — sub-component inside BottomNavBar
// A single tab button in the bottom navigation.
// ─────────────────────────────────────────────
interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  accent?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, accent }) => {
  const color = active
    ? THEME.primary
    : accent
      ? THEME.accent
      : THEME.textMuted;

  return (
    <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
      {/* Active indicator dot above icon */}
      {active && <View style={styles.navActiveDot} />}
      <Text style={[styles.navIcon, { color }]}>{icon}</Text>
      <Text style={[styles.navLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────
// 🧭 BOTTOM NAV BAR — move to components/BottomNavBar.tsx
// Fixed bottom bar with five tabs and a center FAB.
// ─────────────────────────────────────────────
const BottomNavBar: React.FC = () => {
  return (
    <View style={styles.navBar}>
      <NavItem icon="👤" label="Profile" active />
      <NavItem icon="🔥" label="Streak" accent />

      {/* Center Floating Action Button */}
      <TouchableOpacity
        style={[styles.fab, THEME.glowShadow]}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </TouchableOpacity>

      <NavItem icon="🔔" label="Pop-up" />
      <NavItem icon="📊" label="Stats" />
    </View>
  );
};

// ─────────────────────────────────────────────
// 🔔 POPUP TOGGLE BANNER — move to components/PopupToggleBanner.tsx
// Toggle to enable flashcard pop-ups on device unlock.
// ─────────────────────────────────────────────
interface PopupToggleBannerProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

const PopupToggleBanner: React.FC<PopupToggleBannerProps> = ({
  enabled,
  onToggle,
}) => {
  return (
    <View style={styles.popupBanner}>
      {/* Lock icon */}
      <View style={styles.popupIconWrap}>
        <Text style={styles.popupIcon}>🔒</Text>
      </View>

      {/* Text description */}
      <View style={styles.popupTextWrap}>
        <Text style={styles.popupTitle}>Flashcards will pop up</Text>
        <Text style={styles.popupSubtitle}>when you unlock your device</Text>
      </View>

      {/* Toggle switch */}
      <Switch
        value={enabled}
        onValueChange={onToggle}
        trackColor={{ false: THEME.border, true: THEME.primaryDim }}
        thumbColor={enabled ? THEME.primary : THEME.textMuted}
        ios_backgroundColor={THEME.border}
      />
    </View>
  );
};

// ─────────────────────────────────────────────
// 🏠 HOME SCREEN — root screen component
// Composes all sub-components into the full home view.
// ─────────────────────────────────────────────

// Folder data — replace with your real data source or API
const FOLDERS = [
  { id: "1", subject: "Physics", cardCount: 24, accentColor: THEME.folderBlue },
  { id: "2", subject: "Math", cardCount: 18, accentColor: THEME.folderGreen },
  { id: "3", subject: "Biology", cardCount: 32, accentColor: THEME.folderRed },
  { id: "4", subject: "Science", cardCount: 27, accentColor: THEME.folderGold },
];

export default function HomeScreen() {
  // Controls the pop-up flashcard toggle state
  const [popupEnabled, setPopupEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bg} />

      {/* ── Scrollable page content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Top action bar ──
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.createFolderBtn} activeOpacity={0.8}>
            <Text style={styles.createFolderLabel}>＋  Create Folder</Text>
          </TouchableOpacity>
        </View>
        */}

        {/* ── Greeting header ── */}
        <View style={[styles.greetingWrap, { marginTop: 24 }]}>
          <Text style={styles.greetingSub}>Welcome back,</Text>
          <Text style={styles.greetingMain}>Let's keep learning.</Text>
          {/* Streak badge */}
          <View style={styles.streakChip}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakText}>7-day streak</Text>
          </View>
        </View>

        {/* ── Section title row ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Subjects</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>See all →</Text>
          </TouchableOpacity>
        </View>

        {/* ── 2-column folder grid ── */}
        <View style={styles.folderGrid}>
          {FOLDERS.map((folder) => (
            <FolderCard
              key={folder.id}
              subject={folder.subject}
              cardCount={folder.cardCount}
              accentColor={folder.accentColor}
            />
          ))}
        </View>

        {/* ── In Review chip ──
        <TouchableOpacity style={styles.inReviewChip} activeOpacity={0.8}>
          <Text style={styles.inReviewIcon}>🃏</Text>
          <Text style={styles.inReviewText}>In Review</Text>
        </TouchableOpacity> */}

        {/* ── Pop-up toggle banner ── */}
        <PopupToggleBanner enabled={popupEnabled} onToggle={setPopupEnabled} />

        {/* Bottom spacer so content clears the nav bar */}
        <View style={{ height: 8 }} />
      </ScrollView>

      {/* ── Fixed bottom navigation bar ── */}
      <BottomNavBar />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────
// 💅 STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  // ── Root layout ─────────────────────────────
  safeArea: {
    flex: 1,
    backgroundColor: THEME.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 20 : 8,
  },

  // ── Top bar ─────────────────────────────────
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 24,
  },
  createFolderBtn: {
    backgroundColor: THEME.bgElevated,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: THEME.radiusFull,
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  createFolderLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.primary,
    letterSpacing: 0.3,
  },

  // ── Greeting ─────────────────────────────────
  greetingWrap: {
    marginBottom: 30,
  },
  greetingSub: {
    fontSize: 14,
    color: THEME.textMuted,
    fontWeight: "500",
    marginBottom: 30,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  greetingMain: {
    fontSize: 30,
    fontWeight: "800",
    color: THEME.textWhite,
    letterSpacing: -0.8,
    marginBottom: 14,
  },
  streakChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: THEME.accentDim,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.accent + "55",
  },
  streakEmoji: {
    fontSize: 13,
  },
  streakText: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.accent,
    letterSpacing: 0.3,
  },

  // ── Section header ───────────────────────────
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.textWhite,
    letterSpacing: 0.1,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.primary,
  },

  // ── Folder grid ──────────────────────────────
  folderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginBottom: 22,
  },

  // ── Folder card ──────────────────────────────
  folderCard: {
    width: "47%",
    backgroundColor: THEME.bgCard,
    borderRadius: THEME.radiusMd,
    padding: 16,
    paddingTop: 12,
    position: "relative",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  folderOverflow: {
    position: "absolute",
    top: 10,
    right: 12,
    zIndex: 1,
  },
  folderOverflowDots: {
    fontSize: 18,
    color: THEME.textMuted,
    fontWeight: "700",
  },
  folderIconWrap: {
    marginTop: 6,
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  folderTab: {
    width: 28,
    height: 8,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    marginBottom: -1,
    opacity: 0.85,
  },
  folderBody: {
    width: 62,
    height: 48,
    borderRadius: 8,
    borderTopLeftRadius: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  folderEmoji: {
    fontSize: 22,
  },
  folderTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 6,
  },
  cardCountBadge: {
    alignSelf: "flex-start",
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
  },
  cardCountText: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  // ── In Review chip ───────────────────────────
  inReviewChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    alignSelf: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusFull,
    paddingHorizontal: 22,
    paddingVertical: 11,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.primary + "55",
  },
  inReviewIcon: {
    fontSize: 16,
  },
  inReviewText: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.primary,
    letterSpacing: 0.3,
  },

  // ── Pop-up toggle banner ─────────────────────
  popupBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.bgElevated,
    borderRadius: THEME.radiusMd,
    padding: 14,
    gap: 12,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: THEME.borderBright,
  },
  popupIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: THEME.bg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.border,
  },
  popupIcon: {
    fontSize: 18,
  },
  popupTextWrap: {
    flex: 1,
  },
  popupTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.textWhite,
    marginBottom: 2,
  },
  popupSubtitle: {
    fontSize: 12,
    color: THEME.textMuted,
  },

  // ── Bottom nav bar ───────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: THEME.bgElevated,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 24 : 14,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  navItem: {
    alignItems: "center",
    gap: 3,
    flex: 1,
    position: "relative",
  },
  navActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.primary,
    marginBottom: 2,
  },
  navIcon: {
    fontSize: 20,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  // ── FAB ──────────────────────────────────────
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: THEME.primary,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
  },
  fabIcon: {
    fontSize: 28,
    color: THEME.bg,
    lineHeight: 34,
    fontWeight: "400",
  },
});
