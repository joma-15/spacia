import * as Notifications from "expo-notifications";
import { router } from "expo-router";

// 1. Notification Presentation Settings:
// Define how notifications should behave when they arrive while the app is currently OPEN.
// Here we choose to show the top banner, show in system tray list, and play the default sound.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


/**
 * Configure system channels.
 * Android requires developer-defined channels to display notifications. 
 * The channel dictates importance settings and sounds.
 */
export async function configureNotifications() {
  console.log("configure function was being configured");
  await Notifications.setNotificationChannelAsync("study-reminders-test", {
    name: "Study Reminders Test",
    importance: Notifications.AndroidImportance.MAX, // Max priority pops it on screen
    sound: "alarm.wav",
  });
}

/**
 * Ask the device (iOS or Android) for permission to send local notifications.
 * If the user rejects the popup request, we throw an error message.
 */
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Notification permission was not granted.");
  }
}


// 2. Notification Tap Listener:
// This listens for when the user physically clicks/taps on a notification popup.
// When tapped, it automatically routes the user directly to the Flashcard page.
Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;

  // Navigate to CardScreen
  router.push({
    pathname: "/CardScreen",
  });
});


/**
 * Test function that schedules a local notification.
 * It computes the current date/time, adds 10 seconds, and registers a scheduled task
 * with the phone system to run.
 */
export async function ScheduleNotification() {
  console.log("the schedule notification was being triggered");
  const date = new Date(); 

  // Set the trigger time to be exactly 10 seconds from now
  date.setSeconds(date.getSeconds() + 10);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎉 Test Notification",
      body : "review your FlashcardScreen",
      sound: "alarm.wav",
    },

    trigger: {
      type : Notifications.SchedulableTriggerInputTypes.DATE, 
      date
    }
  });
}
