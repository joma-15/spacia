# Navigation Components (`/client/src/shared/components/navigation`)

## 1. Purpose

This folder contains shared UI components that handle the primary navigation layout of the Spacia application. The primary component here is the custom bottom navigation bar (`BottomNav`), which replaces the default Expo Router tab bar to provide a highly stylized, dark green themed, responsive navigation bar.

---

## 2. Folder Structure

```text
client/src/shared/components/navigation/
├── BottomNav.tsx            # Custom tab bar with active highlights and layout structure
└── README.md
```

---

## 3. File Responsibilities

* **`BottomNav.tsx`**: Renders the persistent bottom navigation tabs overlay.
  * It maps active route names (`library`, `game`, `streakcomingsoon`, `comingsoon`, `payment`) to custom icons (e.g. `card-multiple`, `google-controller`, `fire`, `credit-card`) and text labels.
  * Applies custom active/inactive color states in compliance with the Spacia design system.
  * Handles presses by resolving the appropriate path with the Expo `router`.

---

## 4. Relationships

* **Consumer**: Used by the tab navigator layout `client/src/app/(tabs)/_layout.tsx` via the `tabBar` render property:
  ```tsx
  tabBar={(props) => <BottomNav {...props} />}
  ```
* **Expo Router**: Relies on Expo Router's navigation state and descriptors passed through props to determine which route is active and execute navigation transitions.

---

## 5. Best Practices

* **Keep Tab Configurations Clean**: New tabs should be added inside the routing layout `(tabs)/_layout.tsx` first, then matched inside `BottomNav.tsx` with appropriate icons and display labels.
* **Layout and Padding**: Always wrap interactive tab items inside touch targets that are sufficiently large (minimum $44 \times 44$ density pixels) to meet accessibility standards.
* **Avoid Hardcoded Paths**: Coordinate paths directly with the routes registered in the `/app` folder to prevent broken link exceptions.

---

## 6. AI Guidance

* **Purpose**: Houses custom UI navigators.
* **Safe Areas to Modify**: 
  * Tab labels, icon changes, layout spacing, active/inactive color codes, border radius, and tap micro-animations.
* **Do NOT Modify**:
  * Do not change the routing path strings inside `BottomNav.tsx` without verifying that the corresponding file in `client/src/app/(tabs)` has been renamed/created first.
