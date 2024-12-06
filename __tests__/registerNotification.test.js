import { registerForPushNotificationsAsync, scheduleReminders, cancelReminders } from "../services/registerNotification";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

// Mock the external modules
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  AndroidImportance: {
    MAX: 'max',
  },
}));

jest.mock('expo-device', () => ({
  isDevice: true,
}));

jest.mock('expo-constants', () => ({
  easConfig: {
    projectId: 'mocked-project-id',
  },
}));

jest.mock('react-native', () => ({
  Platform: {
    OS: 'android',
  },
  Alert: {
    alert: jest.fn(),
  },
}));

beforeAll(() => {
  global.alert = jest.fn(); // Mock the global alert function
  jest.useFakeTimers('modern'); // Mock Date globally to ensure consistent dates
  jest.setSystemTime(new Date('2024-01-01T00:00:00'));
});

afterAll(() => {
  jest.useRealTimers(); // Restore real timers after the tests
});

describe('registerForPushNotificationsAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should request permissions and return a push token when permissions are granted', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValueOnce({ data: 'mocked-token' });

    const token = await registerForPushNotificationsAsync();

    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'mocked-project-id' });
    expect(token).toEqual('mocked-token');
  });

  it('should return undefined if permissions are not granted', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    const token = await registerForPushNotificationsAsync();

    expect(Notifications.getPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(token).toBeUndefined();
    expect(global.alert).toHaveBeenCalledWith("Failed to get push token for push notification!");
  });

//   it('should alert the user if the device is not a physical device', async () => {
//     Device.isDevice = false;
    
//     const token = await registerForPushNotificationsAsync();

//     expect(token).toBeUndefined();
//     expect(global.alert).toHaveBeenCalledWith("Must use physical device for Push Notifications");
//   });
});

describe('scheduleReminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should schedule notifications at specified times', async () => {
    const reminderTimes = [new Date('2024-01-01T09:00:00'), new Date('2024-01-01T18:00:00')];
    Notifications.scheduleNotificationAsync.mockResolvedValueOnce('reminder-1');
    Notifications.scheduleNotificationAsync.mockResolvedValueOnce('reminder-2');

    const reminders = await scheduleReminders(reminderTimes, 'Time to take your medication!', 'medication-1');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, {
      content: {
        title: 'Medication Reminder',
        body: 'Time to take your medication!',
        data: { medicationId: 'medication-1' },
      },
      trigger: {
        hour: 9,
        minute: 0,
        repeats: true,
      },

    });
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(2, {
      content: {
        title: 'Medication Reminder',
        body: 'Time to take your medication!',
        data: { medicationId: 'medication-1' },
      },
      trigger: {
        hour: 18,
        minute: 0,
        repeats: true,
      },
    });

    expect(reminders).toEqual([
      { id: 'reminder-1', time: new Date('2024-01-01T09:00:00') },
      { id: 'reminder-2', time: new Date('2024-01-01T18:00:00') },
    ]);
  });
  it("should cancel all notifications successfully", async () => {
    const mockReminders = [
      { id: "reminder1" },
      { id: "reminder2" },
    ];
  
    const cancelScheduledNotificationAsync = require('expo-notifications').cancelScheduledNotificationAsync;
    cancelScheduledNotificationAsync.mockResolvedValueOnce(); // Mock successful cancellation
  
    await cancelReminders(mockReminders);
  
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("reminder1");
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("reminder2");
  });
  it("should handle empty reminders array without errors", async () => {
    const cancelScheduledNotificationAsync = require('expo-notifications').cancelScheduledNotificationAsync;
  
    await cancelReminders([]); // Call with an empty array
  
    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalled(); // No cancellation calls should be made
  });
  it("should throw an error if cancelling a notification fails", async () => {
    const mockReminders = [
      { id: "reminder1" },
    ];
  
    const cancelScheduledNotificationAsync = require('expo-notifications').cancelScheduledNotificationAsync;
    cancelScheduledNotificationAsync.mockRejectedValueOnce(new Error("Cancellation failed"));
  
    await expect(cancelReminders(mockReminders))
      .rejects.toThrow("Error cancelling notifications:");
  });
  
});