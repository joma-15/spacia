import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import {
  useSafeAreaInsets,
  SafeAreaView,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";

// --- Pricing (fixed USD) ---
const PRICING = {
  monthly: { amount: 2.5, display: "$2.50/mo" },
  annual: { amount: 25.0, display: "$25.00/yr", perMonth: "$2.08/mo" },
};
const SAVINGS_PERCENT = Math.round(((2.5 * 12 - 25) / (2.5 * 12)) * 100); // 17%

// --- Color tokens ---
const COLORS = {
  bg: "#0f1f18",
  surface: "#172a1f",
  card: "#1c3127",
  cardHighlight: "#1f3a2c",
  border: "#2a4a38",
  borderGlow: "#3d7a57",
  accent: "#4ade80",
  accentDim: "#2d6b47",
  accentText: "#6ee7a0",
  gold: "#f59e0b",
  goldDim: "#78350f",
  text: "#e8f5ee",
  textMuted: "#6b9a7c",
  textDim: "#3d6b50",
  navBg: "#111e17",
  navBorder: "#1e3828",
  white: "#ffffff",
};

// --- Perks ---
const PERKS = [
  {
    emoji: "🤖",
    title: "AI-Powered Learning",
    items: [
      "Unlimited AI Flashcard Generation",
      "Generate up to 50 flashcards at once",
      "Regenerate flashcards anytime",
      "Higher quality AI flashcards",
    ],
  },
  {
    emoji: "📄",
    title: "Study From Any Material",
    items: [
      "Import PDFs",
      "Turn lecture notes into flashcards",
      "Convert study guides into quizzes",
      "Extract key concepts automatically",
    ],
  },
  {
    emoji: "🧠",
    title: "Smarter Studying",
    items: [
      "Spaced Repetition System",
      "Smart Review Recommendations",
      "Progress Tracking",
      "Study Streaks",
    ],
  },
];

// --- Nav ---
type NavTab = "profile" | "streak" | "add" | "popup" | "stats";

const NAV_ITEMS: {
  id: NavTab;
  label: string;
  emoji: string;
  isCenter?: boolean;
}[] = [
  { id: "profile", label: "Profile", emoji: "👤" },
  { id: "streak", label: "Streak", emoji: "🔥" },
  { id: "add", label: "", emoji: "+", isCenter: true },
  { id: "popup", label: "Library", emoji: "📂" },
  { id: "stats", label: "Premium", emoji: "👑" },
];

// --- GlowDot ---
const GlowDot = ({ color }: { color: string }) => (
  <View
    style={[styles.glowDot, { backgroundColor: color, shadowColor: color }]}
  />
);

// --- PerkSection ---
interface PerkSectionProps {
  emoji: string;
  title: string;
  items: string[];
  delay: number;
}

const PerkSection: React.FC<PerkSectionProps> = ({
  emoji,
  title,
  items,
  delay,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.perkSection,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.perkHeader}>
        <Text style={styles.perkEmoji}>{emoji}</Text>
        <Text style={styles.perkTitle}>{title}</Text>
      </View>
      {items.map((item, i) => (
        <View key={i} style={styles.perkRow}>
          <GlowDot color={COLORS.accent} />
          <Text style={styles.perkItem}>{item}</Text>
        </View>
      ))}
    </Animated.View>
  );
};

// --- PlanCard ---
interface PlanCardProps {
  label: string;
  price: string;
  perMonth?: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}

const PlanCard: React.FC<PlanCardProps> = ({
  label,
  price,
  perMonth,
  badge,
  selected,
  onSelect,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
    onSelect();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.planCard,
          selected && styles.planCardSelected,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        {badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <View style={[styles.planRadio, selected && styles.planRadioSelected]}>
          {selected && <View style={styles.planRadioDot} />}
        </View>
        <Text style={[styles.planLabel, selected && styles.planLabelSelected]}>
          {label}
        </Text>
        <Text style={[styles.planPrice, selected && styles.planPriceSelected]}>
          {price}
        </Text>
        {perMonth && <Text style={styles.planPerMonth}>{perMonth}</Text>}
      </Animated.View>
    </TouchableOpacity>
  );
};

// --- BottomNav ---
interface BottomNavProps {
  activeTab: NavTab;
  onTabPress: (tab: NavTab) => void;
  bottomInset: number;
}

const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabPress,
  bottomInset,
}) => (
  <View
    style={[styles.navContainer, { paddingBottom: Math.max(bottomInset, 8) }]}
  >
    <View style={styles.navInner}>
      {NAV_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        if (item.isCenter) {
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onTabPress(item.id)}
              style={styles.navCenterWrap}
              activeOpacity={0.85}
            >
              <View style={styles.navCenterBtn}>
                <Text style={styles.navCenterIcon}>+</Text>
              </View>
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            key={item.id}
            onPress={() => onTabPress(item.id)}
            style={styles.navItem}
            activeOpacity={0.7}
          >
            <Text style={[styles.navEmoji, isActive && styles.navEmojiActive]}>
              {item.emoji}
            </Text>
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
              {item.label}
            </Text>
            {isActive && <View style={styles.navActiveDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

// --- Main Screen ---
export default function PaymentScreen() {
  const router = useRouter();

  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "annual">(
    "annual",
  );
  const [loadingPurchase, setLoadingPurchase] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("stats");

  const insets = useSafeAreaInsets();
  const { width: winWidth } = useWindowDimensions();
  const isTablet = winWidth >= 768;

  const headerFade = useRef(new Animated.Value(0)).current;
  const buttonSlide = useRef(new Animated.Value(40)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerFade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    Animated.parallel([
      Animated.timing(buttonFade, {
        toValue: 1,
        duration: 500,
        delay: 800,
        useNativeDriver: true,
      }),
      Animated.timing(buttonSlide, {
        toValue: 0,
        duration: 500,
        delay: 800,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const handlePurchase = () => {
    setLoadingPurchase(true);
    setTimeout(() => setLoadingPurchase(false), 2000);
  };

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.85, 1, 0.85],
  });

  const NAV_BAR_HEIGHT = isTablet ? 72 : 64;
  const bottomOffset = NAV_BAR_HEIGHT + Math.max(insets.bottom, 8);
  const CTA_HEIGHT = 110;
  const scrollBottom = bottomOffset + CTA_HEIGHT;

  const ctaLabel =
    selectedPlan === "annual"
      ? `Start Annual — ${PRICING.annual.display}`
      : `Start Monthly — ${PRICING.monthly.display}`;

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingHorizontal: isTablet ? 40 : 20,
            paddingBottom: scrollBottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={styles.crownRow}>
            <Text style={styles.crownEmoji}>👑</Text>
            <View style={styles.premiumBadgeWrap}>
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </View>
          <Text style={[styles.headline, isTablet && styles.headlineTablet]}>
            Unlock Your{"\n"}Full Potential
          </Text>
          <Text style={styles.subheadline}>
            Study smarter, not harder — with AI that{"\n"}works as hard as you
            do.
          </Text>
        </Animated.View>

        {/* Plan selector */}
        <View style={[styles.plansRow, isTablet && styles.plansRowTablet]}>
          <PlanCard
            label="Monthly"
            price={PRICING.monthly.display}
            selected={selectedPlan === "monthly"}
            onSelect={() => setSelectedPlan("monthly")}
          />
          <PlanCard
            label="Annual"
            price={PRICING.annual.display}
            perMonth={PRICING.annual.perMonth}
            badge={`SAVE ${SAVINGS_PERCENT}%`}
            selected={selectedPlan === "annual"}
            onSelect={() => setSelectedPlan("annual")}
          />
        </View>

        {/* Savings callout */}
        {selectedPlan === "annual" && (
          <View style={styles.savingsCallout}>
            <Text style={styles.savingsEmoji}>🎉</Text>
            <Text style={styles.savingsText}>
              You're saving $5.00 a year vs monthly!
            </Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>Everything included</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Perks */}
        {PERKS.map((p, i) => (
          <PerkSection key={i} {...p} delay={300 + i * 150} />
        ))}

        <Text style={styles.footerNote}>
          Cancel anytime. No hidden fees.{"\n"}Billed as a single payment for
          annual plans.
        </Text>
      </ScrollView>

      {/* Sticky CTA */}
      <Animated.View
        style={[
          styles.ctaWrap,
          {
            bottom: bottomOffset,
            opacity: buttonFade,
            transform: [{ translateY: buttonSlide }],
            paddingHorizontal: isTablet ? 40 : 20,
          },
        ]}
      >
        <Animated.View style={{ opacity: shimmerOpacity, width: "100%" }}>
          <TouchableOpacity
            style={[styles.ctaButton, isTablet && styles.ctaButtonTablet]}
            onPress={handlePurchase}
            activeOpacity={0.88}
            disabled={loadingPurchase}
          >
            {loadingPurchase ? (
              <ActivityIndicator color={COLORS.bg} />
            ) : (
              <>
                <Text style={styles.ctaText}>{ctaLabel}</Text>
                <Text style={styles.ctaSub}>
                  7-day free trial · cancel anytime
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.ctaLegal}>
          Secure payment · Subscriptions auto-renew
        </Text>
      </Animated.View>

      {/* Bottom Nav */}
      <BottomNav
        activeTab={activeTab}
        onTabPress={(tab) => {
          setActiveTab(tab);

          if (tab === "popup") {
            router.push("/LibraryScreen");
          }
        }}
        bottomInset={insets.bottom}
      />
    </SafeAreaView>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingTop: 20 },

  header: { marginBottom: 28 },
  crownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  crownEmoji: { fontSize: 28 },
  premiumBadgeWrap: {
    backgroundColor: COLORS.goldDim,
    borderColor: COLORS.gold,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  premiumBadgeText: {
    color: COLORS.gold,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.8,
  },
  headline: {
    color: COLORS.text,
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 41,
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  headlineTablet: { fontSize: 42, lineHeight: 50 },
  subheadline: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },

  plansRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  plansRowTablet: { gap: 20 },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.cardHighlight,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  badge: {
    position: "absolute",
    top: -1,
    right: -1,
    backgroundColor: COLORS.accent,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: COLORS.bg,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  planRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: COLORS.textDim,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  planRadioSelected: { borderColor: COLORS.accent },
  planRadioDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  planLabel: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  planLabelSelected: { color: COLORS.accentText },
  planPrice: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  planPriceSelected: { color: COLORS.white },
  planPerMonth: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },

  savingsCallout: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.accentDim,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 24,
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.borderGlow,
  },
  savingsEmoji: { fontSize: 16 },
  savingsText: { color: COLORS.accentText, fontSize: 13, fontWeight: "600" },

  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  perkSection: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  perkHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  perkEmoji: { fontSize: 20 },
  perkTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
  perkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  glowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 2,
  },
  perkItem: {
    color: COLORS.textMuted,
    fontSize: 13.5,
    flex: 1,
    lineHeight: 19,
  },

  footerNote: {
    color: COLORS.textDim,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 20,
  },

  ctaWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  ctaButton: {
    width: "100%",
    backgroundColor: COLORS.accent,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButtonTablet: { paddingVertical: 18, borderRadius: 20 },
  ctaText: {
    color: COLORS.bg,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  ctaSub: {
    color: COLORS.accentDim,
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  ctaLegal: {
    color: COLORS.textDim,
    fontSize: 11,
    marginTop: 8,
    textAlign: "center",
  },

  navContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.navBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.navBorder,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  navInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
    gap: 3,
    position: "relative",
  },
  navEmoji: { fontSize: 22, opacity: 0.45 },
  navEmojiActive: { opacity: 1 },
  navLabel: { color: COLORS.textDim, fontSize: 10, fontWeight: "500" },
  navLabelActive: { color: COLORS.accent, fontWeight: "700" },
  navActiveDot: {
    position: "absolute",
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.accent,
  },
  navCenterWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  navCenterBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
    marginTop: -16,
  },
  navCenterIcon: {
    color: COLORS.bg,
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 32,
    marginTop: -2,
  },
});
