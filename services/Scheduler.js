import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  })
});

async function registerForPushNotificationsAsync() {
    let token;
  
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }
  
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        alert("Failed to get push token for push notification!");
        return;
      }
      // Learn more about projectId:
      // https://docs.expo.dev/push-notifications/push-notifications-setup/#configure-projectid
  
      if (Constants.easConfig?.projectId) {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId: Constants.easConfig.projectId, // you can hard code project id if you dont want to use expo Constants
          })
        ).data;
        console.log(token);
      }
    } else {
      alert("Must use physical device for Push Notifications");
    }
  
    return token;
  }

const scheduleReminders = async (reminderTimes, message, medicationId) => {
    const reminders = [];
    for (const time of reminderTimes) {
        const triggerDate = new Date();
        triggerDate.setHours(time.getHours(), time.getMinutes(), 0, 0);
        
        // Schedule notification at the specified time, daily
        const id = await Notifications.scheduleNotificationAsync({
            content: {
                title: "Medication Reminder",
                body: message,
                data: {medicationId}
            },
            trigger: {
                hour: triggerDate.getHours(),
                minute: triggerDate.getMinutes(),
                repeats: true,
            },
        });
        reminders.push({ id, time: triggerDate });
    }
    return reminders;
};
const cancelReminders = async (reminders) => {
  try {
    const notificationIds = reminders.filter(reminder=>reminder.id).map((reminder) => reminder.id);
    for (const id of notificationIds) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
    console.log('Cancelled notifications:', notificationIds);
  } catch (error) {
    throw new Error('Error cancelling notifications:', error);
  }
};

export { registerForPushNotificationsAsync, cancelReminders, scheduleReminders, Notifications };