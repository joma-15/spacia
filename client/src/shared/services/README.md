# Client Shared Services (`/client/src/shared/services`)

## 1. Purpose

This folder contains shared service classes and utilities that interface with device-level APIs and system features in the Spacia mobile application. These services act as helper libraries that encapsulate complex device operations (such as push notification registration, background tasks, local storage keys, and hardware hooks) so that screens and feature hooks can trigger them with simple, clean function calls.

---

## 2. Folder Structure

```text
client/src/shared/services/
├── NotificationService.ts   # Device push notification setups, listeners, channels, & test scheduling
└── README.md
```

---

## 3. File Responsibilities

* **`NotificationService.ts`**:
  * Integrates with `expo-notifications` to manage the app's push notification reminders.
  * Configures foreground notification handlers (setting banner, list view, sound options for when notifications arrive while the app is active).
  * Registers Android channels (`study-reminders-test`) with high-priority visual importance and customized alarm audio (`alarm.wav`).
  * Initiates device-level system permission requests (`requestNotificationPermission`).
  * Registers global click-response listeners (`addNotificationResponseReceivedListener`) that catch notification tap events and automatically redirect the user to `/CardScreen` via the Expo router.
  * Provides testing helpers (`ScheduleNotification`) that programmatically fire a reminder exactly 10 seconds into the future.

---

## 4. Relationships

* **App Initialization**: Imported and called by `client/src/app/index.tsx` during startup (`configureNotifications()`, `requestNotificationPermission()`) to ensure notification capabilities are verified immediately.
* **Reminder Schedules**: Coordinates with the database schedule repositories to map reminder parameters onto device trigger timings.
* **Routing**: Uses `router` from `expo-router` to transition to specific screens when a user taps a study reminder bubble in their notification drawer.

---

## 5. Best Practices

* **Handle Permissions Gracefully**: Always wrap permission requests in try-catch structures. If permission is denied, log the event or report it through error boundaries instead of allowing the app thread to crash.
* **Android Channel Registration**: Always register notification channels (via `setNotificationChannelAsync`) on Android devices before attempting to schedule or trigger reminders. Android will ignore requests to fire alerts if they are not associated with a registered channel.
* **Keep Listeners Global**: System listeners (like tap-response callbacks) should be declared at the module level in the service or in the root router layout. Do not initialize them repeatedly inside screen hooks, as this leads to duplicate listeners and memory leaks.

---

## 6. AI Guidance

* **Purpose**: Coordinates device-level integrations (specifically local notifications).
* **Safe Areas to Modify**: 
  * You can safely change reminder message text templates, customize notification sound configurations, adjust trigger timings, or create new service files for other device features (e.g. camera, haptic feedback, or connectivity statuses).
* **Do NOT Modify**:
  * Do not duplicate or delete the notification response listener (`addNotificationResponseReceivedListener`) without ensuring alternative navigation routing is handled elsewhere.
