import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    throw new Error("Notification permission was not granted.");
  }
}


export async function sendTestNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🎉 Test Notification",
      body: "putang ina gumagana na!",
    },
    trigger: null,
  });
}

import { router } from "expo-router";

Notifications.addNotificationResponseReceivedListener((response) => {
  const data = response.notification.request.content.data;

  router.push({
    pathname: "/FlashcardScreen",
  });
});