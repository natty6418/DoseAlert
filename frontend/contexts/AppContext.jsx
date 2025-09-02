import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getMedications } from '../services/MedicationHandler';
import { setupDatabase } from '../services/database';
import { useAuth } from './AuthContext';

const AppContext = createContext({});

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

const AppProvider = ({ children }) => {
  // App-wide state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState([]);
  const [appSettings, setAppSettings] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
    language: 'en',
  });

  // Medication management state
  const [medications, setMedications] = useState([]);
  const [activeMedications, setActiveMedications] = useState([]);
  const [medicationHistory, setMedicationHistory] = useState([]);

  // Schedule management state
  const [schedules, setSchedules] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState([]);

  // Reminder management state
  const [reminders, setReminders] = useState([]);
  const [activeReminders, setActiveReminders] = useState([]);
  const [overdueReminders, setOverdueReminders] = useState([]);

  // Adherence tracking state
  const [adherenceData, setAdherenceData] = useState({
    daily: [],
    weekly: [],
    monthly: [],
    streak: 0,
    percentage: 0,
  });
  const [dosageLogs, setDosageLogs] = useState([]);
  const [missedDoses, setMissedDoses] = useState([]);

  // App initialization
  const { user } = useAuth();

  useEffect(() => {
    setupDatabase();
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      setIsLoading(true);
      // Load app settings, check permissions, etc.
      // You can add your app initialization logic here
      console.log('App initialized');
    } catch (error) {
      console.error('App initialization failed:', error);
      setError('Failed to initialize app');
    } finally {
      setIsLoading(false);
    }
  };

  // Global error handling
  const showError = (message) => {
    setError(message);
  };

  const clearError = () => {
    setError(null);
  };

  // Global loading state
  const showLoading = () => {
    setIsLoading(true);
  };

  const hideLoading = () => {
    setIsLoading(false);
  };

  // App settings management
  const updateAppSettings = (newSettings) => {
    setAppSettings(prev => ({ ...prev, ...newSettings }));
    // You might want to persist these to AsyncStorage
  };

  // Notification management
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Theme management
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // ===== MEDICATION MANAGEMENT =====
  const addMedication = (medication) => {
    const newMedication = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isActive: true,
      ...medication,
    };
    setMedications(prev => [...prev, newMedication]);
    if (newMedication.isActive) {
      setActiveMedications(prev => [...prev, newMedication]);
    }
    return newMedication;
  };

  const updateMedication = (id, updates) => {
    setMedications(prev => prev.map(med => 
      med.id === id ? { ...med, ...updates } : med
    ));
    setActiveMedications(prev => prev.map(med => 
      med.id === id ? { ...med, ...updates } : med
    ));
  };

  const removeMedication = (id) => {
    setMedications(prev => prev.filter(med => med.id !== id));
    setActiveMedications(prev => prev.filter(med => med.id !== id));
    setMedicationHistory(prev => [...prev, ...prev.filter(med => med.id === id)]);
  };

  const deactivateMedication = (id) => {
    updateMedication(id, { isActive: false, deactivatedAt: new Date().toISOString() });
    setActiveMedications(prev => prev.filter(med => med.id !== id));
  };

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      
      if (user?.id) {
        // Fetch medications from local SQLite database
        const meds = await getMedications(user.id);
        setMedications(meds);
        setActiveMedications(meds.filter(med => med.isActive));
      }
    } catch (error) {
      console.error('Failed to load medications:', error);
      setError('Failed to load medications');
    } finally {
      setIsLoading(false);
    }
  };

  // ===== SCHEDULE MANAGEMENT =====
  const addSchedule = (schedule) => {
    const newSchedule = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isActive: true,
      ...schedule,
    };
    setSchedules(prev => [...prev, newSchedule]);
    return newSchedule;
  };

  const updateSchedule = (id, updates) => {
    setSchedules(prev => prev.map(schedule => 
      schedule.id === id ? { ...schedule, ...updates } : schedule
    ));
  };

  const removeSchedule = (id) => {
    setSchedules(prev => prev.filter(schedule => schedule.id !== id));
  };

  const loadTodaySchedule = () => {
    const today = new Date().toDateString();
    const todaySchedules = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledTime).toDateString();
      return scheduleDate === today && schedule.isActive;
    });
    setTodaySchedule(todaySchedules);
  };

  const loadUpcomingSchedules = (days = 7) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + (days * 24 * 60 * 60 * 1000));
    
    const upcoming = schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.scheduledTime);
      return scheduleDate > now && scheduleDate <= futureDate && schedule.isActive;
    });
    setUpcomingSchedules(upcoming);
  };

  // ===== REMINDER MANAGEMENT =====
  const addReminder = (reminder) => {
    const newReminder = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      isActive: true,
      status: 'pending',
      ...reminder,
    };
    setReminders(prev => [...prev, newReminder]);
    if (newReminder.isActive) {
      setActiveReminders(prev => [...prev, newReminder]);
    }
    return newReminder;
  };

  const updateReminder = (id, updates) => {
    setReminders(prev => prev.map(reminder => 
      reminder.id === id ? { ...reminder, ...updates } : reminder
    ));
    setActiveReminders(prev => prev.map(reminder => 
      reminder.id === id ? { ...reminder, ...updates } : reminder
    ));
  };

  const markReminderCompleted = (id) => {
    updateReminder(id, { 
      status: 'completed', 
      completedAt: new Date().toISOString() 
    });
    setActiveReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const markReminderMissed = (id) => {
    updateReminder(id, { 
      status: 'missed', 
      missedAt: new Date().toISOString() 
    });
    setActiveReminders(prev => prev.filter(reminder => reminder.id !== id));
  };

  const loadOverdueReminders = () => {
    const now = new Date();
    const overdue = activeReminders.filter(reminder => {
      const reminderTime = new Date(reminder.scheduledTime);
      return reminderTime < now && reminder.status === 'pending';
    });
    setOverdueReminders(overdue);
  };

  // ===== ADHERENCE TRACKING =====
  const logDosage = (dosageLog) => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...dosageLog,
    };
    setDosageLogs(prev => [...prev, newLog]);
    
    // Update adherence data
    calculateAdherence();
    return newLog;
  };

  const logMissedDose = (missedDose) => {
    const newMissedDose = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...missedDose,
    };
    setMissedDoses(prev => [...prev, newMissedDose]);
    
    // Update adherence data
    calculateAdherence();
    return newMissedDose;
  };

  const calculateAdherence = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Calculate daily adherence (last 30 days)
    const dailyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayLogs = dosageLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === date.toDateString();
      });
      
      const dayMissed = missedDoses.filter(missed => {
        const missedDate = new Date(missed.timestamp);
        return missedDate.toDateString() === date.toDateString();
      });
      
      const totalScheduled = dayLogs.length + dayMissed.length;
      const taken = dayLogs.length;
      const adherencePercentage = totalScheduled > 0 ? (taken / totalScheduled) * 100 : 100;
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        taken,
        missed: dayMissed.length,
        scheduled: totalScheduled,
        adherence: adherencePercentage,
      });
    }
    
    // Calculate overall percentage and streak
    const totalTaken = dosageLogs.length;
    const totalMissed = missedDoses.length;
    const totalScheduled = totalTaken + totalMissed;
    const overallPercentage = totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 100;
    
    // Calculate current streak
    let streak = 0;
    for (let i = dailyData.length - 1; i >= 0; i--) {
      if (dailyData[i].adherence === 100 && dailyData[i].scheduled > 0) {
        streak++;
      } else {
        break;
      }
    }
    
    setAdherenceData({
      daily: dailyData,
      weekly: calculateWeeklyAdherence(dailyData),
      monthly: calculateMonthlyAdherence(dailyData),
      streak,
      percentage: overallPercentage,
    });
  };

  const calculateWeeklyAdherence = (dailyData) => {
    const weeklyData = [];
    for (let i = 0; i < dailyData.length; i += 7) {
      const weekData = dailyData.slice(i, i + 7);
      const totalTaken = weekData.reduce((sum, day) => sum + day.taken, 0);
      const totalScheduled = weekData.reduce((sum, day) => sum + day.scheduled, 0);
      const adherence = totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 100;
      
      weeklyData.push({
        week: Math.floor(i / 7) + 1,
        taken: totalTaken,
        scheduled: totalScheduled,
        adherence,
        startDate: weekData[0]?.date,
        endDate: weekData[weekData.length - 1]?.date,
      });
    }
    return weeklyData;
  };

  const calculateMonthlyAdherence = (dailyData) => {
    const totalTaken = dailyData.reduce((sum, day) => sum + day.taken, 0);
    const totalScheduled = dailyData.reduce((sum, day) => sum + day.scheduled, 0);
    const adherence = totalScheduled > 0 ? (totalTaken / totalScheduled) * 100 : 100;
    
    return [{
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      taken: totalTaken,
      scheduled: totalScheduled,
      adherence,
    }];
  };

  // ===== DATA SYNC AND REFRESH =====
  const refreshAllData = async () => {
    loadTodaySchedule();
    loadUpcomingSchedules();
    loadOverdueReminders();
    calculateAdherence();
  };

  const clearAllData = () => {
    setMedications([]);
    setActiveMedications([]);
    setMedicationHistory([]);
    setSchedules([]);
    setTodaySchedule([]);
    setUpcomingSchedules([]);
    setReminders([]);
    setActiveReminders([]);
    setOverdueReminders([]);
    setDosageLogs([]);
    setMissedDoses([]);
    setAdherenceData({
      daily: [],
      weekly: [],
      monthly: [],
      streak: 0,
      percentage: 0,
    });
  };

  const value = {
    // General App State
    isLoading,
    error,
    theme,
    notifications,
    appSettings,
    
    // General App Actions
    showError,
    clearError,
    showLoading,
    hideLoading,
    updateAppSettings,
    addNotification,
    removeNotification,
    clearAllNotifications,
    toggleTheme,
    initializeApp,

    // Medication State
    medications,
    activeMedications,
    medicationHistory,

    // Medication Actions
    addMedication,
    updateMedication,
    removeMedication,
    deactivateMedication,
    loadMedications,

    // Schedule State
    schedules,
    todaySchedule,
    upcomingSchedules,

    // Schedule Actions
    addSchedule,
    updateSchedule,
    removeSchedule,
    loadTodaySchedule,
    loadUpcomingSchedules,

    // Reminder State
    reminders,
    activeReminders,
    overdueReminders,

    // Reminder Actions
    addReminder,
    updateReminder,
    markReminderCompleted,
    markReminderMissed,
    loadOverdueReminders,

    // Adherence State
    adherenceData,
    dosageLogs,
    missedDoses,

    // Adherence Actions
    logDosage,
    logMissedDose,
    calculateAdherence,

    // Global Data Actions
    refreshAllData,
    clearAllData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

AppProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AppProvider;
