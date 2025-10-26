'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Sankey,
  ComposedChart
} from 'recharts';
import {
  Activity,
  Clock,
  ShoppingCart,
  MousePointer,
  Eye,
  Users,
  TrendingUp,
  Filter,
  Calendar,
  Map,
  Smartphone,
  Monitor,
  Tablet,
  Navigation,
  Package,
  Star,
  MessageCircle,
  Heart
} from 'lucide-react';
import { format, subDays, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';

interface CustomerAction {
  id: string;
  customerId: string;
  action: 'page_view' | 'product_view' | 'add_to_cart' | 'purchase' | 'search' | 'review' | 'support_contact';
  timestamp: Date;
  page?: string;
  productId?: string;
  category?: string;
  device: 'desktop' | 'mobile' | 'tablet';
  duration?: number;
  value?: number;
  metadata?: Record<string, any>;
}

interface CustomerJourney {
  customerId: string;
  touchpoints: Array<{
    channel: string;
    action: string;
    timestamp: Date;
    value?: number;
  }>;
  conversionPath: string[];
  totalValue: number;
  journeyDuration: number;
}

interface BehaviorMetrics {
  avgSessionDuration: number;
  bounceRate: number;
  pagesPerSession: number;
  conversionRate: number;
  cartAbandonmentRate: number;
  repeatPurchaseRate: number;
  avgTimeBetweenPurchases: number;
  customerSatisfactionScore: number;
}

export default function CustomerBehaviorTracking() {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'journeys' | 'engagement' | 'devices'>('overview');

  // Mock customer actions data
  const customerActions: CustomerAction[] = useMemo(() => {
    const actions: CustomerAction[] = [];
    const actionTypes: CustomerAction['action'][] = [
      'page_view', 'product_view', 'add_to_cart', 'purchase', 'search', 'review', 'support_contact'
    ];
    const devices: CustomerAction['device'][] = ['desktop', 'mobile', 'tablet'];
    const categories = ['Broodstock', 'Feed', 'Equipment', 'Health', 'Monitoring'];

    for (let i = 0; i < 2000; i++) {
      actions.push({
        id: `action_${i}`,
        customerId: `customer_${Math.floor(Math.random() * 150) + 1}`,
        action: actionTypes[Math.floor(Math.random() * actionTypes.length)],
        timestamp: subDays(new Date(), Math.floor(Math.random() * 30)),
        page: Math.random() > 0.5 ? `/page/${Math.floor(Math.random() * 20)}` : undefined,
        productId: Math.random() > 0.6 ? `product_${Math.floor(Math.random() * 50)}` : undefined,
        category: categories[Math.floor(Math.random() * categories.length)],
        device: devices[Math.floor(Math.random() * devices.length)],
        duration: Math.floor(Math.random() * 600) + 30,
        value: Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 50 : undefined,
        metadata: {}
      });
    }

    return actions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, []);

  // Calculate behavior metrics
  const behaviorMetrics: BehaviorMetrics = useMemo(() => {
    const sessions = new (globalThis.Map)<string, CustomerAction[]>();
    
    // Group actions by customer and session (actions within 30 minutes)
    customerActions.forEach(action => {
      const key = `${action.customerId}_${Math.floor(action.timestamp.getTime() / (30 * 60 * 1000))}`;
      if (!sessions.has(key)) {
        sessions.set(key, []);
      }
      sessions.get(key)!.push(action);
    });

    const sessionArray = Array.from(sessions.values());
    const totalSessions = sessionArray.length;
    const bouncedSessions = sessionArray.filter(session => session.length === 1).length;
    const conversions = customerActions.filter(action => action.action === 'purchase').length;
    const cartAdds = customerActions.filter(action => action.action === 'add_to_cart').length;

    return {
      avgSessionDuration: sessionArray.reduce((sum, session) => 
        sum + session.reduce((total, action) => total + (action.duration || 0), 0), 0) / totalSessions,
      bounceRate: bouncedSessions / totalSessions,
      pagesPerSession: sessionArray.reduce((sum, session) => sum + session.length, 0) / totalSessions,
      conversionRate: conversions / totalSessions,
      cartAbandonmentRate: 1 - (conversions / Math.max(cartAdds, 1)),
      repeatPurchaseRate: 0.35, // Mock value
      avgTimeBetweenPurchases: 45, // Mock value in days
      customerSatisfactionScore: 4.2 // Mock value out of 5
    };
  }, [customerActions]);

  // User journey data
  const userJourneys = useMemo(() => {
    const journeySteps = [
      'Social Media',
      'Search Engine',
      'Email Campaign',
      'Website',
      'Product Page',
      'Cart',
      'Checkout',
      'Purchase'
    ];

    return Array.from({ length: 100 }, (_, i) => {
      const pathLength = Math.floor(Math.random() * 5) + 3;
      const path = [];
      let currentStep = 0;
      
      for (let j = 0; j < pathLength; j++) {
        if (currentStep < journeySteps.length - 1) {
          path.push(journeySteps[currentStep]);
          currentStep += Math.floor(Math.random() * 2) + 1;
        }
      }
      
      return {
        id: `journey_${i}`,
        path,
        converted: Math.random() > 0.7,
        value: Math.floor(Math.random() * 1000) + 100,
        duration: Math.floor(Math.random() * 7) + 1 // days
      };
    });
  }, []);

  // Device usage data
  const deviceData = useMemo(() => {
    const deviceStats = customerActions.reduce((acc, action) => {
      acc[action.device] = (acc[action.device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(deviceStats).map(([device, count]) => ({
      device,
      count,
      percentage: (count / customerActions.length) * 100
    }));
  }, [customerActions]);

  // Engagement over time
  const engagementData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      const dayActions = customerActions.filter(action => 
        format(action.timestamp, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
      );

      const uniqueUsers = new Set(dayActions.map(action => action.customerId)).size;
      const pageViews = dayActions.filter(action => action.action === 'page_view').length;
      const purchases = dayActions.filter(action => action.action === 'purchase').length;
      const avgSessionTime = dayActions.reduce((sum, action) => sum + (action.duration || 0), 0) / dayActions.length || 0;

      return {
        date: format(date, 'MMM dd'),
        fullDate: date,
        uniqueUsers,
        pageViews,
        purchases,
        avgSessionTime,
        totalActions: dayActions.length,
        conversionRate: purchases / Math.max(uniqueUsers, 1) * 100
      };
    });

    return days;
  }, [customerActions]);

  // Funnel data
  const funnelData = useMemo(() => {
    const totalUsers = new Set(customerActions.map(a => a.customerId)).size;
    const productViewers = new Set(customerActions.filter(a => a.action === 'product_view').map(a => a.customerId)).size;
    const cartAdders = new Set(customerActions.filter(a => a.action === 'add_to_cart').map(a => a.customerId)).size;
    const purchasers = new Set(customerActions.filter(a => a.action === 'purchase').map(a => a.customerId)).size;

    return [
      { stage: 'Visitors', users: totalUsers, percentage: 100 },
      { stage: 'Product Views', users: productViewers, percentage: (productViewers / totalUsers) * 100 },
      { stage: 'Add to Cart', users: cartAdders, percentage: (cartAdders / totalUsers) * 100 },
      { stage: 'Purchase', users: purchasers, percentage: (purchasers / totalUsers) * 100 }
    ];
  }, [customerActions]);

  // Heatmap data for popular categories/actions
  const categoryActionData = useMemo(() => {
    const categories = ['Broodstock', 'Feed', 'Equipment', 'Health', 'Monitoring'];
    const actionTypes = ['page_view', 'product_view', 'add_to_cart', 'purchase'];

    return categories.flatMap(category =>
      actionTypes.map(action => ({
        category,
        action,
        count: customerActions.filter(a => a.category === category && a.action === action).length
      }))
    );
  }, [customerActions]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const exportData = {
    title: 'Customer Behavior Analysis',
    subtitle: 'User engagement, journeys, and behavioral insights',
    data: customerActions,
    dateRange: { from: format(subDays(new Date(), 30), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    summary: [
      { label: 'Avg Session Duration', value: formatDuration(behaviorMetrics.avgSessionDuration) },
      { label: 'Conversion Rate', value: formatPercentage(behaviorMetrics.conversionRate * 100) },
      { label: 'Bounce Rate', value: formatPercentage(behaviorMetrics.bounceRate * 100) },
      { label: 'Cart Abandonment', value: formatPercentage(behaviorMetrics.cartAbandonmentRate * 100) }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Behavior Tracking</h2>
          <p className="text-gray-600">Analyze customer engagement and interaction patterns</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {[
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'journeys', label: 'Journeys', icon: Navigation },
              { key: 'engagement', label: 'Engagement', icon: Heart },
              { key: 'devices', label: 'Devices', icon: Smartphone }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 ${
                  viewMode === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <ExportButton exportData={exportData} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Avg Session Duration',
            value: formatDuration(behaviorMetrics.avgSessionDuration),
            change: '+12.5%',
            trend: 'up',
            icon: Clock,
            color: 'blue'
          },
          {
            label: 'Conversion Rate',
            value: formatPercentage(behaviorMetrics.conversionRate * 100),
            change: '+0.8%',
            trend: 'up',
            icon: TrendingUp,
            color: 'green'
          },
          {
            label: 'Bounce Rate',
            value: formatPercentage(behaviorMetrics.bounceRate * 100),
            change: '-2.1%',
            trend: 'up',
            icon: Eye,
            color: 'orange'
          },
          {
            label: 'Pages per Session',
            value: behaviorMetrics.pagesPerSession.toFixed(1),
            change: '+0.3',
            trend: 'up',
            icon: MousePointer,
            color: 'purple'
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Engagement Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Engagement Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={engagementData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="uniqueUsers" fill="#3B82F6" name="Unique Users" />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#10B981" strokeWidth={2} name="Conversion Rate %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
            <div className="space-y-4">
              {funnelData.map((stage, index) => (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                    <span className="text-sm text-gray-500">{stage.users} users ({formatPercentage(stage.percentage)})</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${stage.percentage}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-medium">
                      {stage.users}
                    </div>
                  </div>
                  {index < funnelData.length - 1 && (
                    <div className="text-center text-xs text-gray-500 mt-1">
                      {formatPercentage((funnelData[index + 1].users / stage.users) * 100)} conversion
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Popular Categories */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Engagement Heatmap</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryActionData
                    .reduce((acc, item) => {
                      const existing = acc.find(a => a.category === item.category);
                      if (existing) {
                        existing[item.action] = item.count;
                      } else {
                        acc.push({
                          category: item.category,
                          [item.action]: item.count
                        });
                      }
                      return acc;
                    }, [] as any[])}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="page_view" stackId="a" fill="#3B82F6" name="Page Views" />
                  <Bar dataKey="product_view" stackId="a" fill="#10B981" name="Product Views" />
                  <Bar dataKey="add_to_cart" stackId="a" fill="#F59E0B" name="Add to Cart" />
                  <Bar dataKey="purchase" stackId="a" fill="#EF4444" name="Purchases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Customer Activities</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {customerActions.slice(0, 10).map((action) => (
                <div key={action.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-lg ${
                    action.action === 'purchase' ? 'bg-green-100' :
                    action.action === 'add_to_cart' ? 'bg-yellow-100' :
                    action.action === 'product_view' ? 'bg-blue-100' :
                    'bg-gray-100'
                  }`}>
                    {action.action === 'purchase' && <ShoppingCart className="h-4 w-4 text-green-600" />}
                    {action.action === 'add_to_cart' && <Package className="h-4 w-4 text-yellow-600" />}
                    {action.action === 'product_view' && <Eye className="h-4 w-4 text-blue-600" />}
                    {action.action === 'page_view' && <MousePointer className="h-4 w-4 text-gray-600" />}
                    {action.action === 'search' && <Filter className="h-4 w-4 text-purple-600" />}
                    {action.action === 'review' && <Star className="h-4 w-4 text-orange-600" />}
                    {action.action === 'support_contact' && <MessageCircle className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {action.customerId} {action.action.replace('_', ' ')}
                    </p>
                    <p className="text-xs text-gray-500">
                      {action.category} • {format(action.timestamp, 'MMM dd, HH:mm')} • {action.device}
                    </p>
                  </div>
                  {action.value && (
                    <div className="text-sm font-medium text-green-600">
                      ${action.value}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'journeys' && (
        <div className="space-y-6">
          {/* Journey Length Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Journey Length Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={userJourneys
                    .reduce((acc, journey) => {
                      const length = journey.path.length;
                      const existing = acc.find(item => item.steps === length);
                      if (existing) {
                        existing.count += 1;
                        existing.converted += journey.converted ? 1 : 0;
                      } else {
                        acc.push({
                          steps: length,
                          count: 1,
                          converted: journey.converted ? 1 : 0
                        });
                      }
                      return acc;
                    }, [] as any[])
                    .map(item => ({
                      ...item,
                      conversionRate: (item.converted / item.count) * 100
                    }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="steps" label={{ value: 'Journey Steps', position: 'insideBottom', offset: -10 }} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3B82F6" name="Number of Journeys" />
                  <Line yAxisId="right" type="monotone" dataKey="conversionRate" stroke="#10B981" name="Conversion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Conversion Paths */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Conversion Paths</h3>
            <div className="space-y-4">
              {userJourneys
                .filter(journey => journey.converted)
                .slice(0, 8)
                .map((journey, index) => (
                  <div key={journey.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-900">Journey #{index + 1}</span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500">{journey.duration} days</span>
                        <span className="text-sm font-medium text-green-600">${journey.value}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 overflow-x-auto">
                      {journey.path.map((step, stepIndex) => (
                        <React.Fragment key={stepIndex}>
                          <div className="flex-shrink-0 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                            {step}
                          </div>
                          {stepIndex < journey.path.length - 1 && (
                            <div className="text-gray-400">→</div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Journey Value Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Journey Value vs Duration</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={userJourneys.filter(j => j.converted)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="duration" 
                    name="Duration"
                    label={{ value: 'Journey Duration (days)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="value" 
                    name="Value"
                    label={{ value: 'Order Value ($)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'duration' ? `${value} days` : `$${value}`,
                      name === 'duration' ? 'Duration' : 'Value'
                    ]}
                  />
                  <Scatter name="Journeys" data={userJourneys.filter(j => j.converted)} fill="#8B5CF6" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'engagement' && (
        <div className="space-y-6">
          {/* Engagement by Time of Day */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement by Time of Day</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={Array.from({ length: 24 }, (_, hour) => {
                    const hourActions = customerActions.filter(action => 
                      action.timestamp.getHours() === hour
                    );
                    return {
                      hour: `${hour}:00`,
                      actions: hourActions.length,
                      uniqueUsers: new Set(hourActions.map(a => a.customerId)).size,
                      avgDuration: hourActions.reduce((sum, a) => sum + (a.duration || 0), 0) / hourActions.length || 0
                    };
                  })}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="actions" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Total Actions" />
                  <Area type="monotone" dataKey="uniqueUsers" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Unique Users" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Engagement Pattern */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Engagement Pattern</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                    const dayActions = customerActions.filter(action => 
                      action.timestamp.getDay() === (index + 1) % 7
                    );
                    return {
                      day,
                      actions: dayActions.length,
                      purchases: dayActions.filter(a => a.action === 'purchase').length,
                      sessions: Math.floor(dayActions.length / 3) // Approximate sessions
                    };
                  })}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="actions" fill="#3B82F6" name="Total Actions" />
                  <Bar dataKey="purchases" fill="#10B981" name="Purchases" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Session Duration Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Session Duration Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { range: '0-30s', count: customerActions.filter(a => (a.duration || 0) <= 30).length },
                    { range: '31s-1m', count: customerActions.filter(a => (a.duration || 0) > 30 && (a.duration || 0) <= 60).length },
                    { range: '1-3m', count: customerActions.filter(a => (a.duration || 0) > 60 && (a.duration || 0) <= 180).length },
                    { range: '3-5m', count: customerActions.filter(a => (a.duration || 0) > 180 && (a.duration || 0) <= 300).length },
                    { range: '5m+', count: customerActions.filter(a => (a.duration || 0) > 300).length }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'devices' && (
        <div className="space-y-6">
          {/* Device Usage Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {deviceData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#3B82F6', '#10B981', '#F59E0B'][index % 3]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any, name: any, props: any) => [
                      `${value} (${props.payload.percentage.toFixed(1)}%)`,
                      props.payload.device
                    ]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Performance</h3>
              <div className="space-y-4">
                {deviceData.map((device, index) => {
                  const deviceActions = customerActions.filter(a => a.device === device.device);
                  const purchases = deviceActions.filter(a => a.action === 'purchase').length;
                  const conversionRate = purchases / deviceActions.length;
                  const avgDuration = deviceActions.reduce((sum, a) => sum + (a.duration || 0), 0) / deviceActions.length;
                  
                  const IconComponent = device.device === 'desktop' ? Monitor : 
                                     device.device === 'mobile' ? Smartphone : Tablet;

                  return (
                    <div key={device.device} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <IconComponent className="h-6 w-6 text-gray-600" />
                          <span className="font-medium text-gray-900 capitalize">{device.device}</span>
                        </div>
                        <span className="text-sm text-gray-500">{formatPercentage(device.percentage)}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Conversion</p>
                          <p className="font-medium">{formatPercentage(conversionRate * 100)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Avg Duration</p>
                          <p className="font-medium">{formatDuration(avgDuration)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Sessions</p>
                          <p className="font-medium">{Math.floor(device.count / 3)}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Device Trends Over Time */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Usage Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={engagementData.map(day => {
                    const dayActions = customerActions.filter(action => 
                      format(action.timestamp, 'MMM dd') === day.date
                    );
                    return {
                      date: day.date,
                      desktop: dayActions.filter(a => a.device === 'desktop').length,
                      mobile: dayActions.filter(a => a.device === 'mobile').length,
                      tablet: dayActions.filter(a => a.device === 'tablet').length
                    };
                  })}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="desktop" stroke="#3B82F6" strokeWidth={2} name="Desktop" />
                  <Line type="monotone" dataKey="mobile" stroke="#10B981" strokeWidth={2} name="Mobile" />
                  <Line type="monotone" dataKey="tablet" stroke="#F59E0B" strokeWidth={2} name="Tablet" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}