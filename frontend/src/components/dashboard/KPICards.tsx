'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package,
  MapPin,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency, formatNumber, formatPercentage, calculatePercentageChange } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
    period: string;
  };
  icon: React.ReactNode;
  loading?: boolean;
  error?: boolean;
}

function KPICard({ title, value, change, icon, loading, error }: KPICardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="p-3 bg-gray-100 rounded-lg animate-pulse">
              {icon}
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
            <p className="text-sm text-red-600">Error loading data</p>
          </div>
        </div>
      </div>
    );
  }

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="p-3 bg-blue-50 rounded-lg">
            {icon}
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-sm flex items-center ${getTrendColor(change.trend)}`}>
              {getTrendIcon(change.trend)}
              <span className="ml-1">
                {formatPercentage(Math.abs(change.value))} {change.period}
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KPICards() {
  // Fetch order statistics
  const { data: orderStats, isLoading: loadingOrderStats, error: orderStatsError } = useQuery({
    queryKey: queryKeys.orderStats,
    queryFn: () => apiClient.getOrderStats(),
  });

  // Fetch customer statistics
  const { data: customerStats, isLoading: loadingCustomerStats, error: customerStatsError } = useQuery({
    queryKey: queryKeys.customerStats,
    queryFn: () => apiClient.getCustomerStats(),
  });

  // Fetch batch statistics
  const { data: batchStats, isLoading: loadingBatchStats, error: batchStatsError } = useQuery({
    queryKey: queryKeys.batchStats,
    queryFn: () => apiClient.getBatchStats(),
  });

  // Calculate changes and trends
  const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'neutral' => {
    if (current > previous) return 'up';
    if (current < previous) return 'down';
    return 'neutral';
  };

  const kpiData = React.useMemo(() => {
    if (!orderStats || !customerStats || !batchStats) {
      return [];
    }

    const revenueChange = calculatePercentageChange(
      orderStats.totalRevenue, 
      orderStats.previousPeriodRevenue || 0
    );

    const ordersChange = calculatePercentageChange(
      orderStats.totalOrders, 
      orderStats.previousPeriodOrders || 0
    );

    const customersChange = calculatePercentageChange(
      customerStats.totalCustomers, 
      customerStats.previousPeriodCustomers || 0
    );

    const batchesChange = calculatePercentageChange(
      batchStats.totalBatches, 
      batchStats.previousPeriodBatches || 0
    );

    return [
      {
        title: 'Total Revenue',
        value: formatCurrency(orderStats.totalRevenue),
        change: {
          value: revenueChange,
          trend: calculateTrend(orderStats.totalRevenue, orderStats.previousPeriodRevenue || 0),
          period: 'vs last month'
        },
        icon: <DollarSign className="h-6 w-6 text-blue-600" />,
      },
      {
        title: 'Total Orders',
        value: formatNumber(orderStats.totalOrders),
        change: {
          value: ordersChange,
          trend: calculateTrend(orderStats.totalOrders, orderStats.previousPeriodOrders || 0),
          period: 'vs last month'
        },
        icon: <ShoppingCart className="h-6 w-6 text-green-600" />,
      },
      {
        title: 'Active Customers',
        value: formatNumber(customerStats.totalCustomers),
        change: {
          value: customersChange,
          trend: calculateTrend(customerStats.totalCustomers, customerStats.previousPeriodCustomers || 0),
          period: 'vs last month'
        },
        icon: <Users className="h-6 w-6 text-purple-600" />,
      },
      {
        title: 'Broodstock Batches',
        value: formatNumber(batchStats.totalBatches),
        change: {
          value: batchesChange,
          trend: calculateTrend(batchStats.totalBatches, batchStats.previousPeriodBatches || 0),
          period: 'vs last month'
        },
        icon: <Package className="h-6 w-6 text-orange-600" />,
      },
      {
        title: 'Average Order Value',
        value: formatCurrency(orderStats.averageOrderValue || 0),
        icon: <TrendingUp className="h-6 w-6 text-indigo-600" />,
      },
      {
        title: 'Customer Locations',
        value: formatNumber(customerStats.uniqueLocations || 0),
        icon: <MapPin className="h-6 w-6 text-red-600" />,
      },
    ];
  }, [orderStats, customerStats, batchStats]);

  const isLoading = loadingOrderStats || loadingCustomerStats || loadingBatchStats;
  const hasError = orderStatsError || customerStatsError || batchStatsError;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {isLoading || hasError ? (
        // Show loading/error states for all cards
        Array.from({ length: 6 }).map((_, index) => (
          <KPICard
            key={index}
            title="Loading..."
            value=""
            icon={<DollarSign className="h-6 w-6 text-gray-400" />}
            loading={isLoading}
            error={!!hasError}
          />
        ))
      ) : (
        // Show actual data
        kpiData.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            change={kpi.change}
            icon={kpi.icon}
          />
        ))
      )}
    </div>
  );
}