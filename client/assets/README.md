# Media Assets (`/client/assets`)

## 1. Purpose

This folder contains all static media files and graphics used throughout the Spacia mobile application. This includes general application graphics (launch icons, splash screens), sound effect resources, and specific game visual assets (spaceship sprites, asteroid explosion sheets). 

Grouping media assets here allows Expo to easily bundle and compile assets during production packaging, and enables optimization (compression, scaling) to reduce the final app size.

---

## 2. Folder Structure

```text
client/assets/
├── expo.icon/              # Config settings for the launcher icon
├── images/                 # PNG/JPG graphic resources
│   ├── icon.png            # Launcher icon
│   ├── splash.png          # App startup splash screen
│   ├── flip-sort.png       # Thumbnail image for the Flip & Sort game card
│   ├── spaceblast.png      # Thumbnail image for the Space Blast game card
│   ├── spaceship.png       # Player ship sprite used in Space Blast
│   ├── explosion-correct.png # Success blast graphic for Space Blast
│   ├── explosion-wrong.png   # Incorrect answer blast graphic for Space Blast
│   └── *.jpg               # Team/developer portraits
├── sounds/                 # Audio files
│   └── alarm.wav           # Study reminder alarm audio
└── README.md
```

---

## 3. File Responsibilities

* **`images/icon.png`**: The app launcher icon displayed on the mobile system dashboard.
* **`images/splash.png`**: The loading splash image shown while Expo boots up the React Native runtime.
* **`images/spaceblast.png` / `flip-sort.png`**: Catalog thumbnails displayed on the `GameCatalog` screen to select a game mode.
* **`images/spaceship.png`**: The player's space vessel sprite loaded dynamically during the Space Blast game.
* **`images/explosion-correct.png` / `explosion-wrong.png`**: Graphical overlays spawned at the impact coordinate when an answer asteroid is shot.
* **`sounds/alarm.wav`**: Standard notification sound registered to Android channels and scheduled reminders.

---

## 4. Relationships

* **Imported By SpaceBlast**: The game `client/src/features/games/SpaceBlast/SpaceBlast.tsx` imports these assets directly using `require()`:
  ```typescript
  const EXPLOSION_IMAGE_CORRECT = require("@/assets/images/explosion-correct.png");
  const EXPLOSION_IMAGE_WRONG = require("@/assets/images/explosion-wrong.png");
  const SPACESHIP_IMAGE = require("@/assets/images/spaceship.png");
  ```
  It preloads them using Expo `Asset.loadAsync()` on mount to avoid visual lag when they first render.
* **Imported By NotificationService**: `client/src/shared/services/NotificationService.ts` references `alarm.wav` to play custom audio when an alarm triggers.
* **App Config**: `client/app.json` references `assets/images/icon.png` and `assets/images/splash.png` to configure launcher styles.

---

## 5. Best Practices

* **Always Preload Game Assets**: When rendering graphics dynamically in animations (like game sprites), always trigger preloading routines (using `Asset.loadAsync`) before allowing the game loop to begin. Otherwise, the image may show as a blank white space during the first animation frame.
* **Optimize File Sizes**: Game sprites (like `spaceship.png` and explosion sheets) can be quite large (1.5MB+). To maintain small app bundles and fast load times, always run assets through compression tools before saving them here.

---

## 6. AI Guidance

* **Purpose**: Static image and audio asset storage.
* **Safe Areas to Modify**: 
  * You can safely replace or edit any asset file (e.g. skinning the spaceship or changing the alarm sound) as long as you keep the filenames and extensions exactly the same.
* **Do NOT Modify**:
  * Do not delete these files without updating their matching `require()` path statements in the game code, otherwise TypeScript compile errors will occur.
