// Scheduler.js
// Handles medication schedule CRUD via SQLite database and local notification scheduling

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDatabase, isDatabaseInitialized, setupDatabase } from './database.js';

// Ensure database is initialized before any operations
const ensureDbInitialized = async () => {
  if (!isDatabaseInitialized()) {
    await setupDatabase();
  }
  return getDatabase();
};

// --- SQLite database integration for schedule CRUD ---

// Create a new schedule
export async function addSchedule(userId, schedule) {
  try {
    const db = await ensureDbInitialized();
    
    const result = await db.runAsync(
      `INSERT INTO reminders (medication_id, time, is_active) 
       VALUES (?, ?, ?)`,
      [
        schedule.medication_id,
        schedule.time_of_day || '08:00:00',
        schedule.active !== false ? 1 : 0
      ]
    );
    
    // Get the created reminder
    const reminder = await db.getFirstAsync(
      'SELECT * FROM reminders WHERE id = ?',
      [result.lastInsertRowId]
    );
    
    return reminder;
  } catch (error) {
    console.error('Error adding schedule:', error);
    throw new Error(`Failed to add schedule: ${error.message}`);
  }
}

// Get all schedules for authenticated user
export async function getSchedules(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const schedules = await db.getAllAsync(
      `SELECT r.*, m.name as medication_name 
       FROM reminders r 
       JOIN medications m ON r.medication_id = m.id 
       WHERE m.user_id = ? 
       ORDER BY r.time`,
      [userId]
    );
    
    return schedules;
  } catch (error) {
    console.error('Error getting schedules:', error);
    throw new Error(`Failed to get schedules: ${error.message}`);
  }
}

// Get a specific schedule
export async function getSchedule(userId, scheduleId) {
  try {
    const db = await ensureDbInitialized();
    
    const schedule = await db.getFirstAsync(
      `SELECT r.*, m.name as medication_name 
       FROM reminders r 
       JOIN medications m ON r.medication_id = m.id 
       WHERE r.id = ? AND m.user_id = ?`,
      [scheduleId, userId]
    );
    
    if (!schedule) {
      throw new Error('Schedule not found');
    }
    
    return schedule;
  } catch (error) {
    console.error('Error getting schedule:', error);
    throw new Error(`Failed to get schedule: ${error.message}`);
  }
}

// Update a schedule
export async function updateSchedule(userId, scheduleId, updates) {
  try {
    const db = await ensureDbInitialized();
    
    await db.runAsync(
      `UPDATE reminders SET 
        time = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND medication_id IN (
         SELECT id FROM medications WHERE user_id = ?
       )`,
      [
        updates.time_of_day || '08:00:00',
        updates.active !== false ? 1 : 0,
        scheduleId,
        userId
      ]
    );
    
    // Get the updated reminder
    const updatedSchedule = await db.getFirstAsync(
      'SELECT * FROM reminders WHERE id = ?',
      [scheduleId]
    );
    
    return updatedSchedule;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw new Error(`Failed to update schedule: ${error.message}`);
  }
}

// Delete a schedule
export async function deleteSchedule(userId, scheduleId) {
  try {
    const db = await ensureDbInitialized();
    
    await db.runAsync(
      `DELETE FROM reminders 
       WHERE id = ? AND medication_id IN (
         SELECT id FROM medications WHERE user_id = ?
       )`,
      [scheduleId, userId]
    );
    
    return true;
  } catch (error) {
    console.error('Error deleting schedule:', error);
    throw new Error(`Failed to delete schedule: ${error.message}`);
  }
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