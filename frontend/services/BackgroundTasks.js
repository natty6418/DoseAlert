
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { deactivateExpiredMedications } from './MedicationHandler';
import { cleanupOldReminders } from './ReminderHandler';
import { autoMarkMissedDoses } from './AdherenceTracker';
import { getStoredUser } from './UserHandler';

const DEACTIVATE_EXPIRED_TASK = 'deactivate-expired-meds-task';
const CLEANUP_REMINDERS_TASK = 'cleanup-old-reminders-task';
const AUTO_MARK_MISSED_TASK = 'auto-mark-missed-doses-task';

// Define tasks
TaskManager.defineTask(DEACTIVATE_EXPIRED_TASK, async () => {
  try {
    console.log('Running background task: deactivate expired medications...');
    const user = await getStoredUser();
    if (user && user.id) {
      await deactivateExpiredMedications(user.id);
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error (deactivate expired):', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask(CLEANUP_REMINDERS_TASK, async () => {
  try {
    console.log('Running background task: cleanup old reminders...');
    const user = await getStoredUser();
    if (user && user.id) {
      await cleanupOldReminders(user.id);
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error (cleanup reminders):', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

TaskManager.defineTask(AUTO_MARK_MISSED_TASK, async () => {
  try {
    console.log('Running background task: auto-mark missed doses...');
    const user = await getStoredUser();
    if (user && user.id) {
      await autoMarkMissedDoses(user.id);
    }
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    console.error('Background task error (auto-mark missed):', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register tasks
export async function registerBackgroundTasks() {
  try {
    if (!await TaskManager.isTaskRegisteredAsync(DEACTIVATE_EXPIRED_TASK)) {
      await BackgroundFetch.registerTaskAsync(DEACTIVATE_EXPIRED_TASK, {
        minimumInterval: 60 * 60 * 24, // 24 hours
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Registered background task: deactivate-expired-meds-task');
    }

    if (!await TaskManager.isTaskRegisteredAsync(CLEANUP_REMINDERS_TASK)) {
      await BackgroundFetch.registerTaskAsync(CLEANUP_REMINDERS_TASK, {
        minimumInterval: 60 * 60 * 24, // 24 hours
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Registered background task: cleanup-old-reminders-task');
    }

    if (!await TaskManager.isTaskRegisteredAsync(AUTO_MARK_MISSED_TASK)) {
      await BackgroundFetch.registerTaskAsync(AUTO_MARK_MISSED_TASK, {
        minimumInterval: 60 * 60, // 1 hour
        stopOnTerminate: false,
        startOnBoot: true,
      });
      console.log('Registered background task: auto-mark-missed-doses-task');
    }
  } catch (error) {
    console.error('Error registering background tasks:', error);
  }
}
