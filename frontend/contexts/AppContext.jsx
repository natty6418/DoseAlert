import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMedications, deleteMedication, addMedication as saveMedicationToDb, updateMedication as updateMedicationInDb } from '../services/MedicationHandler';
import { setupDatabase } from '../services/database';
import { useAuth } from './AuthContext';
import { fullSync } from '../services/sync';

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState([]);
  const [appSettings, setAppSettings] = useState({
    soundEnabled: true,
    vibrationEnabled: true,
    notificationsEnabled: true,
    language: 'en',
    demoMedicationsDismissed: false,
  });
  const [isAppSettingsLoaded, setIsAppSettingsLoaded] = useState(false);

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
  const { user, isGuest } = useAuth();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await setupDatabase();
        await loadAppSettings();
        console.log('App initialized');
      } catch (error) {
        console.error('App initialization failed:', error);
        setError('Failed to initialize app');
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Load medications when user and app settings are available
  useEffect(() => {
    const syncAndLoadData = async () => {
      if (user?.id && isAppSettingsLoaded) {
        // For authenticated (non-guest) users, perform a full sync
        if (!isGuest) {
          setIsLoading(true);
          setError(null);
          try {
            console.log(`Authenticated user detected (ID: ${user.id}). Starting full data sync.`);
            await fullSync(user.id);
            console.log('Sync complete. Loading synced data from local database.');
            // After sync, loadMedications will read the fresh data from the local DB
            await loadMedications();
          } catch (error) {
            console.error('Full sync and data load failed:', error);
            setError('Failed to sync your data. Please check your connection and try again.');
            // Optionally, load local data as a fallback
            await loadMedications();
          } finally {
            setIsLoading(false);
          }
        } else {
          // For guest users, just load whatever is in the local DB
          console.log('Guest user detected. Loading local data.');
          await loadMedications();
        }
      }
    };

    syncAndLoadData();
  }, [user?.id, isGuest, isAppSettingsLoaded]);

  const loadAppSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setAppSettings(prev => ({ ...prev, ...parsedSettings }));
      }
    } catch (error) {
      console.error('Failed to load app settings:', error);
    } finally {
      setIsAppSettingsLoaded(true);
    }
  };

  const saveAppSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...appSettings, ...newSettings };
      await AsyncStorage.setItem('appSettings', JSON.stringify(updatedSettings));
      setAppSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to save app settings:', error);
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
  const updateAppSettings = async (newSettings) => {
    await saveAppSettings(newSettings);
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
  const addMedication = async (medication) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Save to database using MedicationHandler
      const savedMedication = await saveMedicationToDb(user.id, medication);
      
      // Update local state with the saved medication
      setMedications(prev => [...prev, savedMedication]);
      if (savedMedication.isActive) {
        setActiveMedications(prev => [...prev, savedMedication]);
      }
      
      return savedMedication;
    } catch (error) {
      console.error('Error adding medication:', error);
      throw new Error(`Failed to save medication: ${error.message}`);
    }
  };

  const updateMedication = async (id, updates) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Update in database
      const updatedMedication = await updateMedicationInDb(user.id, id, updates);
      
      // Update local state
      setMedications(prev => prev.map(med => 
        med.id === id ? updatedMedication : med
      ));
      setActiveMedications(prev => prev.map(med => 
        med.id === id ? updatedMedication : med
      ));
      
      return updatedMedication;
    } catch (error) {
      console.error('Error updating medication:', error);
      throw new Error(`Failed to update medication: ${error.message}`);
    }
  };

  const removeMedication = async (id) => {
    try {
      // Find the medication to check if it's a demo medication
      const medication = medications.find(med => med.id === id);
      
      if (medication && user?.id) {
        // Only delete from database if it's not a demo medication and user is authenticated
        await deleteMedication(user.id, id);
      }
      
      // Update local state (remove from both real and demo medications)
      setMedications(prev => prev.filter(med => med.id !== id));
      setActiveMedications(prev => prev.filter(med => med.id !== id));
      setMedicationHistory(prev => [...prev, ...prev.filter(med => med.id === id)]);
    } catch (error) {
      console.error('Error removing medication:', error);
      showError('Failed to delete medication. Please try again.');
    }
  };

  const deactivateMedication = (id) => {
    updateMedication(id, { isActive: false, deactivatedAt: new Date().toISOString() });
    setActiveMedications(prev => prev.filter(med => med.id !== id));
  };

  const loadMedications = async () => {
    try {
      setIsLoading(true);
      console.log('Loading medications for user:', user?.id);
      
      if (user?.id) {
        // Fetch medications from local SQLite database
        const meds = await getMedications(user.id);
        console.log('Loaded medications:', meds.length, 'medications');
        
        // If no medications found, load demo medications for better UX (unless user dismissed them)
        if (meds.length === 0 && !appSettings.demoMedicationsDismissed) {
          console.log('No medications found, loading demo medications');
          loadDemoMedications();
        } else {
          setMedications(meds.filter(med => !med.isDeleted));
          setActiveMedications(meds.filter(med => med.isActive));
        }
      } else if (!appSettings.demoMedicationsDismissed) {
        console.log('No user ID available, loading demo medications for guest');
        loadDemoMedications();
      }
    } catch (error) {
      console.error('Failed to load medications:', error);
      setError('Failed to load medications');
      // Load demo medications as fallback (unless user dismissed them)
      if (!appSettings.demoMedicationsDismissed) {
        console.log('Loading demo medications as fallback');
        loadDemoMedications();
      }
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

    // Demo/Instructional Medications
  const createDemoMedications = () => {
    const demoMedications = [
      {
        name: 'Vitamin D',
        directions: 'Take with food for better absorption',
        side_effects: [],
        purpose: 'Bone health and immune support',
        warnings: 'Consult doctor if taking blood thinners',
        dosage_amount: '1000',
        dosage_unit: 'IU',
        frequency: 'Daily',
        notes: 'This is a demo medication to help you learn how DoseAlert works. Feel free to delete it!',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        
      },
      {
        name: 'Omega-3',
        directions: 'Take with meals',
        side_effects: [],
        purpose: 'Heart and brain health',
        warnings: 'May increase bleeding risk',
        dosage_amount: '1000',
        dosage_unit: 'mg',
        frequency: 'Twice daily',
        notes: 'Example supplement - you can edit or delete this anytime.',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 60 days from now
      },
      {
        name: 'Multivitamin',
        directions: 'Take with breakfast',
        side_effects: [],
        purpose: 'General nutritional support',
        warnings: 'Contains iron - keep away from children',
        dosage_amount: '1',
        dosage_unit: 'tablet',
        frequency: 'Daily',
        notes: 'Sample daily supplement. Try adding reminder times to see how notifications work!',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      },
    ];
    return demoMedications;
  };

  const loadDemoMedications = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available for demo medications');
        return;
      }

      // Check if demo medications already exist
      const existingMedications = await getMedications(user.id);
      const hasDemos = existingMedications.some(med => 
        med.notes && (
          med.notes.includes('demo medication') || 
          med.notes.includes('Example supplement') ||
          med.notes.includes('Sample daily supplement')
        )
      );
      
      if (hasDemos) {
        console.log('Demo medications already exist, skipping creation');
        return;
      }
      if (!appSettings.demoMedicationsDismissed) {
          const demoMeds = createDemoMedications();
          console.log('Creating demo medications in database...');
          
          // Add each demo medication to the database
          for (const demoMed of demoMeds) {
            try {
              await addMedication(demoMed);
            } catch (error) {
              console.error('Failed to add demo medication:', demoMed.name, error);
            }
          }
      } 
      // Reload medications from database to get the saved demo medications
      await loadMedications();
      console.log('Demo medications loaded successfully');
    } catch (error) {
      console.error('Error loading demo medications:', error);
    }
  };

  const clearDemoMedications = async () => {
    try {
      if (!user?.id) {
        console.log('No user ID available to clear demo medications');
        return;
      }

      // Get all medications and filter out demo ones
      const allMedications = await getMedications(user.id);
      const demoMeds = allMedications.filter(med => 
        med.notes && (
          med.notes.includes('demo medication') || 
          med.notes.includes('Example supplement') ||
          med.notes.includes('Sample daily supplement')
        )
      );

      // Delete demo medications from database
      for (const demoMed of demoMeds) {
        try {
          await removeMedication(demoMed.id);
        } catch (error) {
          console.error('Failed to delete demo medication:', demoMed.name, error);
        }
      }

      // Mark demo medications as dismissed so they don't auto-load again
      await saveAppSettings({ demoMedicationsDismissed: true });

      console.log('Demo medications cleared');
    } catch (error) {
      console.error('Error clearing demo medications:', error);
    }
  };

  const hasDemoMedications = () => {
    return medications.some(med => 
      med.notes && (
        med.notes.includes('demo medication') || 
        med.notes.includes('Example supplement') ||
        med.notes.includes('Sample daily supplement')
      )
    );
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
    loadDemoMedications,
    clearDemoMedications,
    hasDemoMedications,

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
