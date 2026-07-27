# Shared Contexts (`/client/src/shared/context`)

## 1. Purpose

This folder contains React context definitions and providers that manage global/cross-screen UI states in the Spacia mobile application. Utilizing React Context allows state sharing across deeply nested layout elements without passing props through multiple intermediary components (prop drilling).

---

## 2. Folder Structure

```text
client/src/shared/context/
├── AddFolderContext.tsx     # Context for controlling the visibility of the Add Folder Modal
└── README.md
```

---

## 3. File Responsibilities

* **`AddFolderContext.tsx`**: Defines `AddFolderContext`, its provider `AddFolderProvider`, and the consumer hook `useAddFolder`.
  * It stores a single boolean state `addModalVisible` that indicates whether the folder creation overlay should be displayed.
  * Allows any child component inside the app layout to trigger this modal from anywhere (e.g. from the BottomNav or a dashboard header).

---

## 4. Relationships

* **Provider Registration**: Registered at the root of the app in `client/src/app/_layout.tsx` to wrap all screens:
  ```tsx
  <AddFolderProvider>
    <Stack ... />
  </AddFolderProvider>
  ```
* **Consumers**:
  * Triggered by components like the add button inside the library feature screens.
  * Listened to by the `AddFolderModal` component to determine when to render itself on top of the active view.

---

## 5. Best Practices

* **Keep Context Small**: Context should only store UI state that is genuinely shared across different screen layers (like modal overlays, active themes, or authentication states). Frequent database updates or extensive data lists belong in custom hooks or database layers rather than React Context to avoid triggering global app rerenders.
* **Always Provide Hook Guard**: Always implement context checks in the custom consumer hook to throw a descriptive error if it is used outside of its provider:
  ```typescript
  if (!context) {
    throw new Error("useAddFolder must be used inside AddFolderProvider");
  }
  ```

---

## 6. AI Guidance

* **Purpose**: Manages global UI overlays and settings state.
* **Safe Areas to Modify**: 
  * You can safely add new shared settings (like user preference flags or theme overrides) by defining new contexts here.
* **Do NOT Modify**:
  * Do not bypass the `useAddFolder` hook validation check when consuming state.
