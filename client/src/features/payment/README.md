# Payment Feature (`/client/src/features/payment`)

## 1. Purpose

The Payment module handles the Premium subscription flows for the Spacia application. It presents users with the benefits of upgrading (unlimited card creation, advanced AI textbook extraction, and custom study reminder frequencies), manages monthly and annual subscription plan selections, and triggers the checkout process.

---

## 2. Folder Structure

```text
client/src/features/payment/
├── components/                 # Presentation components for subscription details
│   ├── BottomNav.tsx           # Feature-specific bottom navigator layout
│   ├── CtaButton.tsx           # Sticky checkout action button with pulse animation
│   ├── FeatureDivider.tsx      # Stylized "Everything included" text divider
│   ├── GlowDot.tsx             # Pulsing indicator dot highlighting annual discounts
│   ├── PageHeader.tsx          # Crown icon and upgrade headings
│   ├── PerkList.tsx            # Renders lists of premium benefits
│   ├── PerkSection.tsx         # Layout block representing a single benefit item
│   ├── PlanCard.tsx            # Card displaying details for a pricing model
│   ├── PlanSelector.tsx        # Toggle selector matching Monthly vs Annual billing
│   └── SavingsCallout.tsx      # Banner highlighting annual plan savings
├── hooks/
│   └── usePaymentScreen.ts     # Animation configurations, dimensions, and purchase triggers
├── screens/
│   └── PaymentScreen.tsx       # Assembles components and handles layout offset sizes
├── colors.ts                   # Custom colors for glowing backgrounds
├── constants.ts                # Pricing values, durations, and details
├── types.ts                    # TypeScript definitions (PlanTypes, NavTabs)
└── README.md
```

---

## 3. File Responsibilities

* **`screens/PaymentScreen.tsx`**: Organizes layout layers. It calculates height offsets dynamically depending on tablet/mobile screens to prevent the sticky purchase button from overlaying text items.
* **`hooks/usePaymentScreen.ts`**:
  * Calculates tablet-width thresholds (`isTablet = windowWidth >= 768`) to adjust visual spacing.
  * Manages monthly/annual selectors and checkout states.
  * Powers entry animations using React Native's `Animated` engine (header opacity fade-in, checkout slide-in, and infinite CTA button breathing glow loop).
* **`components/PlanSelector.tsx`**: Renders pricing selector cards. Monthly and annual options displays price tags, discount callouts, and glow elements.
* **`constants.ts`**: Defines the `PRICING` structure (pricing options, trial durations, and discount rates) to keep configurations decoupled from visual elements.

---

## 4. Relationships

* **Routes**: Loaded as the primary payment settings page by `client/src/app/(tabs)/payment.tsx` and custom billing triggers.
* **Navigation**: Triggered by limits checks in the flashcard feature (e.g. `PremiumModal` routing users to payment options when they exceed folder creation sizes).

---

## 5. Best Practices

* **Tablet Adaptability**: Layouts must dynamically support tablet scaling. The `isTablet` boolean calculation should trigger wider scroll boundaries and larger CTA button sizes.
* **Fluid Entry Animations**: UI entrance animations should use native driver paths (`useNativeDriver: true`) to avoid CPU-based render locks and ensure smooth 60fps frame rates.
* **Avoid Hardcoded Prices**: Bind values directly from the centralized `PRICING` definition in `constants.ts` to ensure pricing changes automatically propagate to billing selectors, headings, and buttons.

---

## 6. AI Guidance

* **Purpose**: Manages premium features presentation, subscription selection, and checkout triggers.
* **Safe Areas to Modify**: 
  * Layout elements inside `PerkSection.tsx`, pricing strings inside `constants.ts`, crown graphics styling, checkmarks color codes, and animation transition rates.
* **Do NOT Modify**:
  * Do not disable the native animation drivers (`useNativeDriver: true`) unless utilizing unsupported properties (e.g. width/height animations).
  * Ensure the checkout loading blocker is cleared properly in the final callbacks.
