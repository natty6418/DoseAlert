// Scheduler.js
// Handles medication schedule CRUD via SQLite database and local notification scheduling

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getDatabase, isDatabaseInitialized, setupDatabase, schedules, medications  } from './database.js';
import { eq, and,  isNull, or } from 'drizzle-orm';

// Ensure database is initialized before any operations
const ensureDbInitialized = async () => {
  let retryCount = 0;
  const maxRetries = 3;
  
  while (retryCount < maxRetries) {
    try {
      if (!isDatabaseInitialized()) {
        await setupDatabase();
      }
      return getDatabase();
    } catch (error) {
      retryCount++;
      console.error(`Database initialization error (attempt ${retryCount}):`, error);
      
      if (retryCount < maxRetries) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 200 * retryCount));
      } else {
        throw error;
      }
    }
  }
};

// --- SQLite database integration for schedule CRUD ---

// Create a new schedule
export async function addSchedule(userId, schedule) {
  try {
    const db = await ensureDbInitialized();
    
    const result = await db.insert(schedules).values({
      medicationId: schedule.medication_id,
      timeOfDay: schedule.time_of_day || '08:00:00',
      daysOfWeek: schedule.days_of_week || 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
      timezone: schedule.timezone || 'UTC',
      active: schedule.active !== false,
      reminderEnabled: schedule.reminderEnabled !== false, // Default to true for reminders
      isDirty: true // Mark for sync
    }).returning();
    
    return result[0];
  } catch (error) {
    console.error('Error adding schedule:', error);
    throw new Error(`Failed to add schedule: ${error.message}`);
  }
}

// Get all schedules for authenticated user
export async function getSchedules(userId) {
  try {
    const db = await ensureDbInitialized();
    
    const scheduleResults = await db
      .select({
        id: schedules.id,
        backendId: schedules.backendId,
        medicationId: schedules.medicationId,
        timeOfDay: schedules.timeOfDay,
        daysOfWeek: schedules.daysOfWeek,
        timezone: schedules.timezone,
        active: schedules.active,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
        medicationName: medications.name
      })
      .from(schedules)
      .innerJoin(medications, eq(schedules.medicationId, medications.id))
      .where(and(
        eq(medications.userId, userId),
        or(eq(schedules.isDeleted, false), isNull(schedules.isDeleted))
      ))
      .orderBy(schedules.timeOfDay);
    
    return scheduleResults;
  } catch (error) {
    console.error('Error getting schedules:', error);
    throw new Error(`Failed to get schedules: ${error.message}`);
  }
}

// Get a specific schedule
export async function getSchedule(userId, scheduleId) {
  try {
    const db = await ensureDbInitialized();
    
    const scheduleResults = await db
      .select({
        id: schedules.id,
        backendId: schedules.backendId,
        medicationId: schedules.medicationId,
        timeOfDay: schedules.timeOfDay,
        daysOfWeek: schedules.daysOfWeek,
        timezone: schedules.timezone,
        active: schedules.active,
        createdAt: schedules.createdAt,
        updatedAt: schedules.updatedAt,
        medicationName: medications.name
      })
      .from(schedules)
      .innerJoin(medications, eq(schedules.medicationId, medications.id))
      .where(and(
        eq(schedules.id, scheduleId),
        eq(medications.userId, userId)
      ));
    
    if (!scheduleResults || scheduleResults.length === 0) {
      throw new Error('Schedule not found');
    }
    
    return scheduleResults[0];
  } catch (error) {
    console.error('Error getting schedule:', error);
    throw new Error(`Failed to get schedule: ${error.message}`);
  }
}

// Update a schedule
export async function updateSchedule(userId, scheduleId, updates) {
  try {
    const db = await ensureDbInitialized();
    
    // First verify the schedule belongs to the user
    const existing = await db
      .select()
      .from(schedules)
      .innerJoin(medications, eq(schedules.medicationId, medications.id))
      .where(and(
        eq(schedules.id, scheduleId),
        eq(medications.userId, userId)
      ));
    
    if (!existing || existing.length === 0) {
      throw new Error('Schedule not found');
    }
    
    const result = await db
      .update(schedules)
      .set({
        timeOfDay: updates.time_of_day || updates.timeOfDay,
        daysOfWeek: updates.days_of_week || updates.daysOfWeek,
        timezone: updates.timezone,
        active: updates.active !== false,
        updatedAt: new Date().toISOString(),
        isDirty: true // Mark for sync
      })
      .where(eq(schedules.id, scheduleId))
      .returning();
    
    return result[0];
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw new Error(`Failed to update schedule: ${error.message}`);
  }
}

// Delete a schedule
export async function deleteSchedule(userId, scheduleId) {
  try {
    const db = await ensureDbInitialized();
    
    // First verify the schedule belongs to the user
    const existing = await db
      .select()
      .from(schedules)
      .innerJoin(medications, eq(schedules.medicationId, medications.id))
      .where(and(
        eq(schedules.id, scheduleId),
        eq(medications.userId, userId)
      ));
    
    if (!existing || existing.length === 0) {
      throw new Error('Schedule not found');
    }
    
    // Soft delete the schedule
    await db
      .update(schedules)
      .set({
        isDeleted: true,
        updatedAt: new Date().toISOString(),
        isDirty: true // Mark for sync
      })
      .where(eq(schedules.id, scheduleId));
    
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