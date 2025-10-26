'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package,
  Clock,
  AlertTriangle,
  CheckCircle,
  Target
} from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon: React.ReactNode;
  status?: 'normal' | 'warning' | 'critical';
}

function KPICard({ title, value, change, icon, status = 'normal' }: KPICardProps) {
  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4" />;
      case 'down': return <TrendingDown className="h-4 w-4" />;
      default: return null;
    }
  };

  return (
    <div
      className={`surface-card rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl border-0 ${
        status === 'warning'
          ? 'ring-1 ring-[var(--brand-red)]/30'
          : status === 'critical'
          ? 'ring-1 ring-[var(--brand-red)]/50'
          : ''
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 p-3 rounded-xl bg-[var(--brand-blue)]/12 text-[var(--brand-blue)]">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--text-secondary)]">
            {title}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[var(--text-primary)]">{value}</p>
          {change && (
            <p className={`mt-2 text-sm font-medium flex items-center gap-1 ${getTrendColor(change.trend)}`}>
              {getTrendIcon(change.trend)}
              <span>{Math.abs(change.value).toFixed(1)}% {change.period}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface DashboardStatsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

export default function ExecutiveKPICards({ timeRange = '30d' }: DashboardStatsProps) {
  // Fetch dashboard stats from API
  const { 
    data: dashboardData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['dashboard-stats', timeRange],
    queryFn: () => apiClient.getDashboardStats(timeRange),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });

  // Fallback to mock data if API fails or while loading
  const fallbackData = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const currentPeriodSales = 487500;
    const previousPeriodSales = 425800;
    const currentCustomers = 47;
    const previousCustomers = 44;
    const avgOrderValue = 8750;
    const previousAvgOrderValue = 8200;
    const pendingShipments = 12;
    const totalOrders = 156;
    const previousOrders = 142;
    const onTimeDeliveries = 148;

    return {
      totalSales: currentPeriodSales,
      totalSalesChange: ((currentPeriodSales - previousPeriodSales) / previousPeriodSales) * 100,
      activeCustomers: currentCustomers,
      customersChange: ((currentCustomers - previousCustomers) / previousCustomers) * 100,
      avgOrderSize: avgOrderValue,
      avgOrderChange: ((avgOrderValue - previousAvgOrderValue) / previousAvgOrderValue) * 100,
      pendingShipments: pendingShipments,
      totalOrders: totalOrders,
      ordersChange: ((totalOrders - previousOrders) / previousOrders) * 100,
      onTimeRate: (onTimeDeliveries / totalOrders) * 100,
      credentialIssues: 5
    };
  }, []);

  // Use API data if available, otherwise fallback to mock data
  const stats = dashboardData?.stats || {};
  const data = useMemo(() => {
    if (dashboardData) {
      return {
        totalSales: stats.revenue?.current || 0,
        totalSalesChange: stats.revenue?.change || 0,
        activeCustomers: stats.customers?.current || 0,
        customersChange: stats.customers?.change || 0,
        avgOrderSize: stats.averageOrderValue?.current || 0,
        avgOrderChange: stats.averageOrderValue?.change || 0,
        pendingShipments: stats.pendingShipments?.current || 0,
        totalOrders: stats.orders?.current || 0,
        ordersChange: stats.orders?.change || 0,
        // qualityIssues: stats.qualityIssues?.current || 0, // Removed undefined property
      };
    }
    return fallbackData;
  }, [dashboardData, fallbackData, stats]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="surface-card rounded-2xl p-6 animate-pulse border-0">
            <div className="h-4 bg-gray-200/70 rounded w-3/4 mb-3"></div>
            <div className="h-8 bg-gray-200/70 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  // Show error state with fallback data
  if (error) {
    console.warn('Dashboard API error, using fallback data:', error);
  }

  const kpiCards = [
    {
      title: 'Total Sales (Period)',
      value: `$${data.totalSales.toLocaleString()}`,
      change: {
        value: data.totalSalesChange,
        trend: data.totalSalesChange > 0 ? 'up' as const : 'down' as const,
        period: 'vs last period'
      },
      icon: <DollarSign className="h-6 w-6 text-blue-600" />,
      status: 'normal' as const
    },
    {
      title: 'Active Customers',
      value: data.activeCustomers.toString(),
      change: {
        value: data.customersChange,
        trend: data.customersChange > 0 ? 'up' as const : 'down' as const,
        period: 'vs last period'
      },
      icon: <Users className="h-6 w-6 text-green-600" />,
      status: 'normal' as const
    },
    {
      title: 'Average Order Size',
      value: `$${data.avgOrderSize.toLocaleString()}`,
      change: {
        value: data.avgOrderChange,
        trend: data.avgOrderChange > 0 ? 'up' as const : 'down' as const,
        period: 'vs last period'
      },
      icon: <ShoppingCart className="h-6 w-6 text-purple-600" />,
      status: 'normal' as const
    },
    {
      title: 'Pending Shipments',
      value: data.pendingShipments.toString(),
      icon: <Package className="h-6 w-6 text-orange-600" />,
      status: data.pendingShipments > 15 ? 'warning' as const : 'normal' as const
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toString(),
      change: {
        value: data.ordersChange,
        trend: data.ordersChange > 0 ? 'up' as const : 'down' as const,
        period: 'vs last period'
      },
      icon: <Target className="h-6 w-6 text-indigo-600" />,
      status: 'normal' as const
    },
    {
      title: 'On-Time Delivery Rate',
      value: `${95.2}%`, // Fixed percentage for delivery rate
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      status: 'normal' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
            <p className="text-sm text-yellow-700">
              Using fallback data - API connection issue. Database may need Railway setup.
            </p>
          </div>
        </div>
      )}
      
      {dashboardData && (
        <div className="bg-green-50 border-l-4 border-green-400 p-3">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-sm text-green-700">
              Live data from API • Last updated: {new Date(dashboardData.lastUpdated || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
            status={kpi.status}
          />
        ))}
      </div>

      {/* Executive Summary Section */}
      <div className="surface-card rounded-2xl shadow-sm border-0 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Executive Summary</h3>
          <span className="text-sm text-gray-500">Current Period</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Highlights */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Top Highlights
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Sales up {data.totalSalesChange.toFixed(1)}% from last period</li>
              <li>• {data.activeCustomers} active customers ({data.customersChange > 0 ? '+' : ''}{data.customersChange.toFixed(1)}%)</li>
              <li>• Average order value: ${data.avgOrderSize.toLocaleString()}</li>
              <li>• 95.2% on-time delivery rate</li>
            </ul>
          </div>

          {/* Areas Requiring Attention */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-600" />
              Attention Required
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• {data.pendingShipments} orders awaiting shipment</li>
              <li>• 3 customers with credential issues</li>
              <li>• Monthly target: ${(data.totalSales * 1.15).toLocaleString()}</li>
              <li>• Quality monitoring for 3 recent batches</li>
            </ul>
          </div>

          {/* Quick Action Items */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-blue-600" />
              Action Items
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Process {data.pendingShipments} pending shipments</li>
              <li>• Follow up on 8 overdue payments</li>
              <li>• Credential renewal reminders needed</li>
              <li>• Quarterly compliance review due</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
