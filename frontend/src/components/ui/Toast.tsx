'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Notification } from '@/contexts/NotificationContext';

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  onAction?: (action: () => void) => void;
}

export default function Toast({ notification, onClose, onAction }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-close if specified
    if (notification.autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.autoClose);
      return () => clearTimeout(timer);
    }
  }, [notification.autoClose]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300); // Match animation duration
  };

  const getToastStyles = () => {
    const baseClasses = `
      relative max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 transform transition-all duration-300 ease-in-out
      ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
    `;

    const borderColors = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500',
    };

    return `${baseClasses} ${borderColors[notification.type]}`;
  };

  const getIcon = () => {
    const iconClasses = 'h-5 w-5';
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case 'error':
        return <AlertCircle className={`${iconClasses} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClasses} text-yellow-500`} />;
      case 'info':
        return <Info className={`${iconClasses} text-blue-500`} />;
      default:
        return <Info className={`${iconClasses} text-gray-500`} />;
    }
  };

  const getPriorityIndicator = () => {
    if (!notification.priority || notification.priority === 'low') return null;
    
    const indicators = {
      medium: 'bg-yellow-400',
      high: 'bg-orange-500',
      critical: 'bg-red-600 animate-pulse',
    };

    return (
      <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${indicators[notification.priority]}`} />
    );
  };

  const formatTime = (timestamp: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(timestamp);
  };

  return (
    <div className={getToastStyles()}>
      {getPriorityIndicator()}
      
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 w-0 flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 pr-2">
                {notification.title}
              </h4>
              <button
                onClick={handleClose}
                className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-full p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="mt-1 text-sm text-gray-700">
              {notification.message}
            </p>
            
            {notification.source && (
              <p className="mt-1 text-xs text-gray-500">
                From: {notification.source}
              </p>
            )}
            
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatTime(notification.timestamp)}
              </span>
              
              {notification.category && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  notification.category === 'system' ? 'bg-gray-100 text-gray-800' :
                  notification.category === 'batch' ? 'bg-green-100 text-green-800' :
                  notification.category === 'inventory' ? 'bg-orange-100 text-orange-800' :
                  notification.category === 'financial' ? 'bg-blue-100 text-blue-800' :
                  notification.category === 'order' ? 'bg-purple-100 text-purple-800' :
                  notification.category === 'customer' ? 'bg-pink-100 text-pink-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {notification.category}
                </span>
              )}
            </div>
            
            {notification.actions && notification.actions.length > 0 && (
              <div className="mt-3 flex space-x-2">
                {notification.actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action();
                      if (onAction) onAction(action.action);
                      handleClose();
                    }}
                    className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      action.style === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                      action.style === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                      'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar for auto-close */}
      {notification.autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
          <div 
            className={`h-full transition-all ease-linear ${
              notification.type === 'success' ? 'bg-green-500' :
              notification.type === 'error' ? 'bg-red-500' :
              notification.type === 'warning' ? 'bg-yellow-500' :
              'bg-blue-500'
            }`}
            style={{
              width: '100%',
              animation: `shrink ${notification.autoClose}ms linear forwards`,
            }}
          />
        </div>
      )}
      
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}