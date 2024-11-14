import { registerForPushNotificationsAsync, scheduleReminders } from "../services/registerNotification";
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

    const reminders = await scheduleReminders(reminderTimes, 'Time to take your medication!');

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(2);
    expect(Notifications.scheduleNotificationAsync).toHaveBeenNthCalledWith(1, {
      content: {
        title: 'Medication Reminder',
        body: 'Time to take your medication!',
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
});