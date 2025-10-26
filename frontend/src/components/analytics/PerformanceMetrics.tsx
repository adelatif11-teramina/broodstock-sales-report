'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  ShoppingCart, 
  Target,
  Clock,
  Award
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/utils';

interface PerformanceMetricsProps {
  timeRange: string;
  compareMode: boolean;
}

interface MetricCard {
  title: string;
  value: string;
  change: number;
  previousValue?: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export default function PerformanceMetrics({ timeRange, compareMode }: PerformanceMetricsProps) {
  // Mock performance data
  const metrics: MetricCard[] = React.useMemo(() => [
    {
      title: 'Total Revenue',
      value: formatCurrency(1250000),
      change: 23.5,
      previousValue: compareMode ? formatCurrency(1012000) : undefined,
      icon: <DollarSign className="h-6 w-6" />,
      color: 'blue',
      description: 'Total sales revenue for the period',
    },
    {
      title: 'Order Volume',
      value: formatNumber(2847),
      change: 15.2,
      previousValue: compareMode ? formatNumber(2471) : undefined,
      icon: <ShoppingCart className="h-6 w-6" />,
      color: 'green',
      description: 'Number of orders placed',
    },
    {
      title: 'Active Customers',
      value: formatNumber(894),
      change: 8.7,
      previousValue: compareMode ? formatNumber(822) : undefined,
      icon: <Users className="h-6 w-6" />,
      color: 'purple',
      description: 'Customers who placed orders',
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(439),
      change: 7.1,
      previousValue: compareMode ? formatCurrency(410) : undefined,
      icon: <Target className="h-6 w-6" />,
      color: 'orange',
      description: 'Average value per order',
    },
    {
      title: 'Conversion Rate',
      value: '4.2%',
      change: 12.3,
      previousValue: compareMode ? '3.7%' : undefined,
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'indigo',
      description: 'Visitor to customer conversion',
    },
    {
      title: 'Customer Lifetime Value',
      value: formatCurrency(2850),
      change: 18.9,
      previousValue: compareMode ? formatCurrency(2396) : undefined,
      icon: <Award className="h-6 w-6" />,
      color: 'pink',
      description: 'Average customer lifetime value',
    },
    {
      title: 'Order Fulfillment Time',
      value: '2.4 days',
      change: -15.2,
      previousValue: compareMode ? '2.8 days' : undefined,
      icon: <Clock className="h-6 w-6" />,
      color: 'cyan',
      description: 'Average time to fulfill orders',
    },
    {
      title: 'Customer Satisfaction',
      value: '4.8/5.0',
      change: 3.2,
      previousValue: compareMode ? '4.6/5.0' : undefined,
      icon: <Award className="h-6 w-6" />,
      color: 'emerald',
      description: 'Average customer rating',
    },
  ], [compareMode]);

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      pink: 'bg-pink-100 text-pink-600',
      cyan: 'bg-cyan-100 text-cyan-600',
      emerald: 'bg-emerald-100 text-emerald-600',
    };
    return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <div className="h-4 w-4" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <div key={metric.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className={`p-2 rounded-lg ${getColorClasses(metric.color)}`}>
              {metric.icon}
            </div>
            {Math.abs(metric.change) > 0 && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(metric.change)}
                <span className={`text-sm font-medium ${getTrendColor(metric.change)}`}>
                  {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          {/* Value */}
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-500 mb-1">{metric.title}</h3>
            <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
          </div>

          {/* Previous Value Comparison */}
          {compareMode && metric.previousValue && (
            <div className="mb-3">
              <p className="text-xs text-gray-500">
                Previous: <span className="font-medium">{metric.previousValue}</span>
              </p>
            </div>
          )}

          {/* Description */}
          <p className="text-xs text-gray-500">{metric.description}</p>

          {/* Progress Bar for visual representation */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Performance</span>
              <span>{Math.abs(metric.change).toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  metric.change >= 0 ? 'bg-green-500' : 'bg-red-500'
                }`}
                style={{ width: `${Math.min(Math.abs(metric.change) * 3, 100)}%` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}