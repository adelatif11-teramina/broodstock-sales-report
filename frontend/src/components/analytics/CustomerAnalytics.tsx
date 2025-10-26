'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis
} from 'recharts';
import { Users, Star, TrendingUp, Target, Crown, Award } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency, formatNumber, getChartColor } from '@/lib/utils';

interface CustomerAnalyticsProps {
  timeRange: string;
}

export default function CustomerAnalytics({ timeRange }: CustomerAnalyticsProps) {
  const [viewMode, setViewMode] = React.useState<'segments' | 'behavior' | 'top'>('segments');

  // Mock customer data
  const customerSegments = React.useMemo(() => [
    {
      segment: 'Premium',
      customers: 45,
      revenue: 285000,
      avgOrderValue: 2850,
      orderFrequency: 4.2,
      retention: 95,
      color: '#8B5CF6',
    },
    {
      segment: 'Enterprise',
      customers: 28,
      revenue: 420000,
      avgOrderValue: 5200,
      orderFrequency: 2.8,
      retention: 92,
      color: '#3B82F6',
    },
    {
      segment: 'Standard',
      customers: 156,
      revenue: 324000,
      avgOrderValue: 1850,
      orderFrequency: 3.1,
      retention: 78,
      color: '#10B981',
    },
    {
      segment: 'Basic',
      customers: 89,
      revenue: 123000,
      avgOrderValue: 980,
      orderFrequency: 2.2,
      retention: 65,
      color: '#F59E0B',
    },
  ], []);

  const topCustomers = React.useMemo(() => [
    {
      name: 'AquaTech Solutions',
      revenue: 89000,
      orders: 24,
      avgOrderValue: 3708,
      lastOrder: '2 days ago',
      tier: 'Enterprise',
      growth: 23.5,
    },
    {
      name: 'Pacific Farms Co.',
      revenue: 76000,
      orders: 18,
      avgOrderValue: 4222,
      lastOrder: '1 week ago',
      tier: 'Premium',
      growth: 15.2,
    },
    {
      name: 'Blue Ocean Industries',
      revenue: 68000,
      orders: 32,
      avgOrderValue: 2125,
      lastOrder: '3 days ago',
      tier: 'Standard',
      growth: 8.7,
    },
    {
      name: 'Coastal Aquaculture',
      revenue: 54000,
      orders: 15,
      avgOrderValue: 3600,
      lastOrder: '5 days ago',
      tier: 'Premium',
      growth: 31.2,
    },
    {
      name: 'Marine Harvest Ltd.',
      revenue: 49000,
      orders: 21,
      avgOrderValue: 2333,
      lastOrder: '1 day ago',
      tier: 'Standard',
      growth: -5.3,
    },
  ], []);

  const behaviorData = React.useMemo(() => 
    customerSegments.map(segment => ({
      segment: segment.segment,
      avgOrderValue: segment.avgOrderValue,
      orderFrequency: segment.orderFrequency,
      retention: segment.retention,
      customers: segment.customers,
    }))
  , [customerSegments]);

  const totalCustomers = customerSegments.reduce((sum, segment) => sum + segment.customers, 0);
  const totalRevenue = customerSegments.reduce((sum, segment) => sum + segment.revenue, 0);
  const avgRetention = customerSegments.reduce((sum, segment) => sum + segment.retention * segment.customers, 0) / totalCustomers;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.name.includes('Revenue') && formatCurrency(entry.value)}
              {entry.name.includes('Value') && formatCurrency(entry.value)}
              {entry.name.includes('Frequency') && ' orders/month'}
              {entry.name.includes('Retention') && '%'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Users className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Analytics</h3>
            <p className="text-sm text-gray-500">Customer segmentation and behavior insights</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['segments', 'behavior', 'top'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode === 'segments' ? 'Segments' : mode === 'behavior' ? 'Behavior' : 'Top Customers'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-blue-600 mr-2" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Customers</p>
              <p className="text-sm font-bold text-blue-900">
                {formatNumber(totalCustomers)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center">
            <Target className="h-4 w-4 text-green-600 mr-2" />
            <div>
              <p className="text-xs text-green-600 font-medium">Customer Revenue</p>
              <p className="text-sm font-bold text-green-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-purple-600 mr-2" />
            <div>
              <p className="text-xs text-purple-600 font-medium">Avg Retention</p>
              <p className="text-sm font-bold text-purple-900">
                {avgRetention.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center">
            <Crown className="h-4 w-4 text-orange-600 mr-2" />
            <div>
              <p className="text-xs text-orange-600 font-medium">Premium Customers</p>
              <p className="text-sm font-bold text-orange-900">
                {customerSegments.find(s => s.segment === 'Premium')?.customers || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'segments' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Segment Revenue Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Revenue by Segment</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={customerSegments} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="segment" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} tickFormatter={(value) => formatCurrency(value).replace('.00', '')} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Segment Details */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Segment Overview</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {customerSegments.map((segment, index) => (
                <div key={segment.segment} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="font-medium text-gray-900">{segment.segment}</span>
                    </div>
                    <span className="text-sm text-gray-500">{segment.customers} customers</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Revenue: </span>
                      <span className="font-medium">{formatCurrency(segment.revenue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">AOV: </span>
                      <span className="font-medium">{formatCurrency(segment.avgOrderValue)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Frequency: </span>
                      <span className="font-medium">{segment.orderFrequency}/mo</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Retention: </span>
                      <span className="font-medium">{segment.retention}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'behavior' && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Customer Behavior Analysis</h4>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={behaviorData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="avgOrderValue" 
                  name="Average Order Value"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value).replace('.00', '')}
                />
                <YAxis 
                  dataKey="orderFrequency" 
                  name="Order Frequency"
                  stroke="#6b7280"
                  fontSize={12}
                />
                <ZAxis dataKey="customers" range={[50, 400]} />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                          <p className="font-medium text-gray-900">{data.segment} Segment</p>
                          <p className="text-sm">AOV: {formatCurrency(data.avgOrderValue)}</p>
                          <p className="text-sm">Frequency: {data.orderFrequency} orders/month</p>
                          <p className="text-sm">Customers: {data.customers}</p>
                          <p className="text-sm">Retention: {data.retention}%</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter dataKey="customers" fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'top' && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Customers by Revenue</h4>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={customer.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{customer.tier} tier</span>
                      <span>{customer.orders} orders</span>
                      <span>Last order: {customer.lastOrder}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(customer.revenue)}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      AOV: {formatCurrency(customer.avgOrderValue)}
                    </span>
                    <span className={`text-xs flex items-center ${
                      customer.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {customer.growth >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingUp className="h-3 w-3 mr-1 rotate-180" />
                      )}
                      {Math.abs(customer.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}