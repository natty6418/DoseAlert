// Scheduler.js
// Handles medication schedule CRUD via Django backend API and local notification scheduling

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const BASE_URL = 'http://localhost:8000/api';

function getAuthHeaders(token) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// --- Django backend API integration for schedule CRUD ---

// Create a new schedule
export async function addSchedule(token, schedule) {
  const res = await fetch(`${BASE_URL}/schedules/`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(schedule),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get all schedules for authenticated user
export async function getSchedules(token) {
  const res = await fetch(`${BASE_URL}/schedules/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Get a specific schedule
export async function getSchedule(token, scheduleId) {
  const res = await fetch(`${BASE_URL}/schedules/${scheduleId}/`, {
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Update a schedule
export async function updateSchedule(token, scheduleId, updates) {
  const res = await fetch(`${BASE_URL}/schedules/${scheduleId}/`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return res.json();
}

// Delete a schedule
export async function deleteSchedule(token, scheduleId) {
  const res = await fetch(`${BASE_URL}/schedules/${scheduleId}/`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(JSON.stringify(error));
  }
  return true;
}

// --- Local notification scheduling logic ---

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

export const scheduleReminders = async (reminderTimes, message, medicationId) => {
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

export const cancelReminders = async (reminders) => {
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

export { registerForPushNotificationsAsync, Notifications };