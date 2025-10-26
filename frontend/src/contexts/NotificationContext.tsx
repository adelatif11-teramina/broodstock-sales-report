'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  persistent?: boolean;
  autoClose?: number; // milliseconds
  actions?: NotificationAction[];
  category?: 'system' | 'batch' | 'inventory' | 'financial' | 'order' | 'customer';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  source?: string;
  data?: any;
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  isConnected: boolean;
}

interface NotificationPreferences {
  enabled: boolean;
  categories: {
    system: boolean;
    batch: boolean;
    inventory: boolean;
    financial: boolean;
    order: boolean;
    customer: boolean;
  };
  priorities: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  channels: {
    browser: boolean;
    email: boolean;
    sms: boolean;
  };
  autoClose: boolean;
  sound: boolean;
  desktop: boolean;
}

type NotificationAction_Type =
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'CLEAR_ALL' }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<NotificationPreferences> }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'LOAD_NOTIFICATIONS'; payload: Notification[] };

const initialPreferences: NotificationPreferences = {
  enabled: true,
  categories: {
    system: true,
    batch: true,
    inventory: true,
    financial: true,
    order: true,
    customer: true,
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    critical: true,
  },
  channels: {
    browser: true,
    email: false,
    sms: false,
  },
  autoClose: true,
  sound: true,
  desktop: true,
};

const initialState: NotificationState = {
  notifications: [],
  preferences: initialPreferences,
  isConnected: false,
};

function notificationReducer(state: NotificationState, action: NotificationAction_Type): NotificationState {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 100), // Keep max 100 notifications
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'MARK_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        ),
      };

    case 'MARK_ALL_AS_READ':
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, read: true })),
      };

    case 'CLEAR_ALL':
      return {
        ...state,
        notifications: [],
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload },
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload,
      };

    case 'LOAD_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
      };

    default:
      return state;
  }
}

interface NotificationContextType {
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  getUnreadCount: () => number;
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsByPriority: (priority: string) => Notification[];
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Generate unique ID for notifications
  const generateId = (): string => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: generateId(),
      timestamp: new Date(),
      read: false,
    };

    // Check if notification should be shown based on preferences
    if (!state.preferences.enabled) return;
    if (notification.category && !state.preferences.categories[notification.category]) return;
    if (notification.priority && !state.preferences.priorities[notification.priority]) return;

    dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });

    // Show browser notification if enabled
    if (state.preferences.desktop && state.preferences.channels.browser) {
      showBrowserNotification(newNotification);
    }

    // Play sound if enabled
    if (state.preferences.sound) {
      playNotificationSound(newNotification.type);
    }

    // Auto-close if specified and enabled
    if (notification.autoClose && state.preferences.autoClose) {
      setTimeout(() => {
        dispatch({ type: 'REMOVE_NOTIFICATION', payload: newNotification.id });
      }, notification.autoClose);
    }
  };

  // Remove notification
  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  // Mark as read
  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
  };

  // Mark all as read
  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  // Clear all notifications
  const clearAll = () => {
    dispatch({ type: 'CLEAR_ALL' });
  };

  // Update preferences
  const updatePreferences = (preferences: Partial<NotificationPreferences>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
    // Persist to localStorage
    const updatedPreferences = { ...state.preferences, ...preferences };
    localStorage.setItem('notification-preferences', JSON.stringify(updatedPreferences));
  };

  // Get unread count
  const getUnreadCount = (): number => {
    return state.notifications.filter(n => !n.read).length;
  };

  // Get notifications by category
  const getNotificationsByCategory = (category: string): Notification[] => {
    return state.notifications.filter(n => n.category === category);
  };

  // Get notifications by priority
  const getNotificationsByPriority = (priority: string): Notification[] => {
    return state.notifications.filter(n => n.priority === priority);
  };

  // Browser notification
  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'critical',
      });

      browserNotification.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto-close browser notification
      if (notification.autoClose) {
        setTimeout(() => {
          browserNotification.close();
        }, notification.autoClose);
      }
    }
  };

  // Play notification sound
  const playNotificationSound = (type: string) => {
    const audio = new Audio();
    switch (type) {
      case 'error':
        audio.src = 'data:audio/wav;base64,UklGRvIEAABXQVZFZm10IBAAAAABAAABAC...'; // Error sound
        break;
      case 'success':
        audio.src = 'data:audio/wav;base64,UklGRvIEAABXQVZFZm10IBAAAAABAAABAC...'; // Success sound
        break;
      case 'warning':
        audio.src = 'data:audio/wav;base64,UklGRvIEAABXQVZFZm10IBAAAAABAAABAC...'; // Warning sound
        break;
      default:
        audio.src = 'data:audio/wav;base64,UklGRvIEAABXQVZFZm10IBAAAAABAAABAC...'; // Default sound
    }
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore errors - user might not have interacted with page yet
    });
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notification-preferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }

    // Request notification permission
    requestNotificationPermission();
  }, []);

  // Mock WebSocket connection for real-time notifications
  useEffect(() => {
    // Simulate WebSocket connection
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: true });

    // Mock real-time notifications
    const mockNotifications = [
      {
        type: 'warning' as const,
        title: 'Low Stock Alert',
        message: 'Premium Shrimp Feed (2mm) is running low - only 85kg remaining',
        category: 'inventory' as const,
        priority: 'high' as const,
        autoClose: 10000,
        source: 'Inventory System',
      },
      {
        type: 'info' as const,
        title: 'Batch Update',
        message: 'Batch B-2025-001 has reached 93% survival rate',
        category: 'batch' as const,
        priority: 'medium' as const,
        autoClose: 8000,
        source: 'Batch Monitor',
      },
      {
        type: 'success' as const,
        title: 'Order Completed',
        message: 'Order #ORD-2025-089 has been successfully processed',
        category: 'order' as const,
        priority: 'low' as const,
        autoClose: 5000,
        source: 'Order System',
      },
    ];

    // Send mock notifications at intervals
    const intervals = mockNotifications.map((notification, index) => {
      return setTimeout(() => {
        addNotification(notification);
      }, (index + 1) * 5000); // Stagger notifications
    });

    // Cleanup
    return () => {
      intervals.forEach(clearTimeout);
    };
  }, []);

  const contextValue: NotificationContextType = {
    state,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    updatePreferences,
    getUnreadCount,
    getNotificationsByCategory,
    getNotificationsByPriority,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};