'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { useNotifications } from '@/contexts/NotificationContext';
import Toast from './Toast';

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  maxToasts?: number;
}

export default function ToastContainer({ 
  position = 'top-right', 
  maxToasts = 5 
}: ToastContainerProps) {
  const { state, removeNotification } = useNotifications();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 flex flex-col space-y-3 pointer-events-none';
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'bottom-right':
        return `${baseClasses} bottom-4 right-4 flex-col-reverse`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4 flex-col-reverse`;
      case 'top-center':
        return `${baseClasses} top-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseClasses} bottom-4 left-1/2 transform -translate-x-1/2 flex-col-reverse`;
      default:
        return `${baseClasses} top-4 right-4`;
    }
  };

  // Filter notifications that should be shown as toasts
  const toastNotifications = state.notifications
    .filter(notification => !notification.persistent)
    .slice(0, maxToasts);

  if (toastNotifications.length === 0) {
    return null;
  }

  const containerElement = (
    <div className={getPositionClasses()}>
      {toastNotifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <Toast
            notification={notification}
            onClose={removeNotification}
          />
        </div>
      ))}
    </div>
  );

  return createPortal(containerElement, document.body);
}