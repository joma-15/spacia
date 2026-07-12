import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


export async function configureNotifications() {
 const channel = console.log("configure function was being configured");
  await Notifications.setNotificationChannelAsync("study-reminders-test", {
  name: "Study Reminders Test",
  importance: Notifications.AndroidImportance.MAX,
  sound: "alarm.wav",
});
console.log(channel);
}

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Notification permission was not granted.");
  }
}


import { router } from "expo-router";

Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;

  router.push({
    pathname: "/CardScreen",
  });
});


export async function ScheduleNotification() {
  console.log("the schedule notification was being triggered");
  const date = new Date(); 

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
