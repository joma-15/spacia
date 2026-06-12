/**
 * types.ts
 * ─────────────────────────────────────────────
 * All shared TypeScript types for the Payment feature.
 *
 * Keeping types here means if you ever change a shape,
 * TypeScript will immediately tell you every file that
 * needs to be updated.
 */

/** The two available subscription billing intervals */
export type PlanType = "monthly" | "annual";

/** The five tabs in the bottom navigation bar */
export type NavTab = "profile" | "streak" | "add" | "popup" | "stats";

/** Shape of a single pricing plan */
export interface PricingPlan {
  amount: number;    // raw number used for calculations, e.g. 2.5
  display: string;   // formatted string shown to user, e.g. "$2.50/mo"
  perMonth?: string; // only shown on annual plan, e.g. "$2.08/mo"
}

/** Shape of a single perks/features section */
export interface Perk {
  emoji: string;    // icon shown next to the title
  title: string;    // section heading
  items: string[];  // list of individual feature bullet points
}