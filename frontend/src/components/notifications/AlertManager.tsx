'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  Bell,
  BellOff,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  Search,
  Calendar,
  Clock,
  User,
  Tag,
  ExternalLink,
  Download,
  RefreshCw
} from 'lucide-react';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow, format } from 'date-fns';
import Button from '@/components/ui/Button';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  lastTriggered?: Date;
  triggerCount: number;
}

interface AlertCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
  value: string | number;
}

interface AlertAction {
  type: 'notification' | 'email' | 'webhook';
  config: any;
}

export default function AlertManager() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'rules' | 'settings'>('notifications');
  const [filter, setFilter] = useState({
    category: 'all',
    priority: 'all',
    status: 'all',
    search: '',
    dateRange: '7d',
  });
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const { 
    state, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll,
    updatePreferences,
    addNotification
  } = useNotifications();

  // Mock alert rules
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'Low Stock Alert',
      description: 'Trigger when inventory items fall below minimum threshold',
      category: 'inventory',
      priority: 'high',
      enabled: true,
      conditions: [
        { field: 'currentStock', operator: 'less_than', value: 100 },
      ],
      actions: [
        { type: 'notification', config: { message: 'Stock is running low' } },
        { type: 'email', config: { recipients: ['admin@example.com'] } },
      ],
      frequency: 'immediate',
      lastTriggered: new Date('2025-01-15T14:30:00Z'),
      triggerCount: 15,
    },
    {
      id: '2',
      name: 'Batch Health Critical',
      description: 'Alert when batch health status becomes critical',
      category: 'batch',
      priority: 'critical',
      enabled: true,
      conditions: [
        { field: 'healthStatus', operator: 'equals', value: 'critical' },
      ],
      actions: [
        { type: 'notification', config: { message: 'Batch health is critical' } },
        { type: 'email', config: { recipients: ['operations@example.com'] } },
      ],
      frequency: 'immediate',
      lastTriggered: new Date('2025-01-14T09:15:00Z'),
      triggerCount: 3,
    },
    {
      id: '3',
      name: 'High Revenue Day',
      description: 'Notify when daily revenue exceeds target',
      category: 'financial',
      priority: 'medium',
      enabled: true,
      conditions: [
        { field: 'dailyRevenue', operator: 'greater_than', value: 50000 },
      ],
      actions: [
        { type: 'notification', config: { message: 'Daily revenue target exceeded!' } },
      ],
      frequency: 'daily',
      lastTriggered: new Date('2025-01-13T18:00:00Z'),
      triggerCount: 8,
    },
    {
      id: '4',
      name: 'Order Payment Overdue',
      description: 'Alert for orders with overdue payments',
      category: 'order',
      priority: 'high',
      enabled: false,
      conditions: [
        { field: 'paymentStatus', operator: 'equals', value: 'overdue' },
        { field: 'daysSinceOrder', operator: 'greater_than', value: 30 },
      ],
      actions: [
        { type: 'notification', config: { message: 'Payment is overdue' } },
        { type: 'email', config: { recipients: ['finance@example.com'] } },
      ],
      frequency: 'weekly',
      triggerCount: 0,
    },
  ]);

  // Filter notifications
  const filteredNotifications = state.notifications.filter(notification => {
    if (filter.category !== 'all' && notification.category !== filter.category) return false;
    if (filter.priority !== 'all' && notification.priority !== filter.priority) return false;
    if (filter.status === 'read' && !notification.read) return false;
    if (filter.status === 'unread' && notification.read) return false;
    if (filter.search && !notification.title.toLowerCase().includes(filter.search.toLowerCase()) &&
        !notification.message.toLowerCase().includes(filter.search.toLowerCase())) return false;
    
    // Date range filter
    const now = new Date();
    const notificationDate = notification.timestamp;
    const daysDiff = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60 * 60 * 24));
    
    switch (filter.dateRange) {
      case '1d': return daysDiff <= 1;
      case '7d': return daysDiff <= 7;
      case '30d': return daysDiff <= 30;
      case 'all': return true;
      default: return true;
    }
  });

  // Filter alert rules
  const filteredRules = alertRules.filter(rule => {
    if (filter.category !== 'all' && rule.category !== filter.category) return false;
    if (filter.priority !== 'all' && rule.priority !== filter.priority) return false;
    if (filter.search && !rule.name.toLowerCase().includes(filter.search.toLowerCase()) &&
        !rule.description.toLowerCase().includes(filter.search.toLowerCase())) return false;
    return true;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
      default: return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'system': return 'text-gray-600 bg-gray-100';
      case 'batch': return 'text-green-600 bg-green-100';
      case 'inventory': return 'text-orange-600 bg-orange-100';
      case 'financial': return 'text-blue-600 bg-blue-100';
      case 'order': return 'text-purple-600 bg-purple-100';
      case 'customer': return 'text-pink-600 bg-pink-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleBulkAction = (action: 'read' | 'delete' | 'archive') => {
    selectedNotifications.forEach(id => {
      switch (action) {
        case 'read':
          markAsRead(id);
          break;
        case 'delete':
          removeNotification(id);
          break;
        case 'archive':
          // Implement archive functionality
          break;
      }
    });
    setSelectedNotifications([]);
  };

  const toggleRule = (ruleId: string) => {
    setAlertRules(rules =>
      rules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    );
  };

  const testRule = (rule: AlertRule) => {
    addNotification({
      type: 'info',
      title: `Test Alert: ${rule.name}`,
      message: `This is a test notification for the alert rule "${rule.name}"`,
      category: rule.category as any,
      priority: rule.priority,
      autoClose: 5000,
      source: 'Alert Manager',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Management</h1>
          <p className="text-gray-600">Manage notifications, alerts, and system messaging</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'notifications', label: 'Notifications', count: state.notifications.length },
            { id: 'rules', label: 'Alert Rules', count: alertRules.length },
            { id: 'settings', label: 'Settings', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="system">System</option>
              <option value="batch">Batch</option>
              <option value="inventory">Inventory</option>
              <option value="financial">Financial</option>
              <option value="order">Order</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={filter.priority}
              onChange={(e) => setFilter({ ...filter, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1d">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                placeholder="Search notifications..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-700">
                  {selectedNotifications.length} notification(s) selected
                </span>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('read')}>
                    Mark as Read
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkAction('delete')}>
                    Delete
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setSelectedNotifications([])}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="bg-white rounded-lg border border-gray-200">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-500">Try adjusting your filters or check back later.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedNotifications([...selectedNotifications, notification.id]);
                          } else {
                            setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                          }
                        }}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      <div className="flex-shrink-0 mt-0.5">
                        {getTypeIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center space-x-2">
                            {notification.priority && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.priority)}`}>
                                {notification.priority}
                              </span>
                            )}
                            {notification.category && (
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                                {notification.category}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                            {notification.source && (
                              <span className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {notification.source}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Mark as read"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          {/* Alert Rules List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Alert Rules</h3>
                <Button size="sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Create Rule
                </Button>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {filteredRules.map((rule) => (
                <div key={rule.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          rule.enabled ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            rule.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.description}</p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rule.priority)}`}>
                            {rule.priority}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(rule.category)}`}>
                            {rule.category}
                          </span>
                          <span className="text-xs text-gray-500">
                            Triggered {rule.triggerCount} times
                          </span>
                          {rule.lastTriggered && (
                            <span className="text-xs text-gray-500">
                              Last: {formatDistanceToNow(rule.lastTriggered, { addSuffix: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => testRule(rule)}>
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Notification Preferences */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
            
            <div className="space-y-6">
              {/* Global Settings */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Global Settings</h4>
                <div className="space-y-3">
                  {[
                    { key: 'enabled', label: 'Enable notifications', checked: state.preferences.enabled },
                    { key: 'autoClose', label: 'Auto-close notifications', checked: state.preferences.autoClose },
                    { key: 'sound', label: 'Play sound', checked: state.preferences.sound },
                    { key: 'desktop', label: 'Desktop notifications', checked: state.preferences.desktop },
                  ].map((setting) => (
                    <label key={setting.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={setting.checked}
                        onChange={(e) => updatePreferences({ [setting.key]: e.target.checked })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{setting.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Categories</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(state.preferences.categories).map(([category, enabled]) => (
                    <label key={category} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updatePreferences({
                          categories: { ...state.preferences.categories, [category]: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Priorities */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Priorities</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(state.preferences.priorities).map(([priority, enabled]) => (
                    <label key={priority} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={(e) => updatePreferences({
                          priorities: { ...state.preferences.priorities, [priority]: e.target.checked }
                        })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}