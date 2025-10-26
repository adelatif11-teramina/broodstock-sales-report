'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency, formatDate, chartColors } from '@/lib/utils';

interface SalesDataPoint {
  date: string;
  revenue: number;
  orders: number;
  averageOrderValue: number;
}

export default function SalesChart() {
  const { data: salesData, isLoading, error } = useQuery({
    queryKey: queryKeys.salesChart,
    queryFn: () => apiClient.getOrders({ limit: 50 }),
  });

  const chartData: SalesDataPoint[] = React.useMemo(() => {
    if (!salesData?.items) return [];
    
    return salesData.items.map((item: any) => ({
      date: formatDate(item.date, 'short'),
      revenue: item.revenue,
      orders: item.orders,
      averageOrderValue: item.averageOrderValue || (item.revenue / item.orders) || 0,
    }));
  }, [salesData]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
            <p className="text-sm text-gray-500">Revenue and order trends over time</p>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
            <p className="text-sm text-gray-500">Revenue and order trends over time</p>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <p className="text-red-600">Error loading sales data</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.dataKey === 'revenue' 
                  ? formatCurrency(entry.value)
                  : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Sales Performance</h3>
          <p className="text-sm text-gray-500">Revenue and order trends over the last 30 days</p>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Revenue</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-gray-600">Orders</span>
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              yAxisId="revenue"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCurrency(value, 'USD').replace('.00', '')}
            />
            <YAxis 
              yAxisId="orders"
              orientation="right"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              yAxisId="revenue"
              type="monotone"
              dataKey="revenue"
              stroke={chartColors.primary}
              strokeWidth={3}
              dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: chartColors.primary, strokeWidth: 2 }}
              name="Revenue"
            />
            <Line
              yAxisId="orders"
              type="monotone"
              dataKey="orders"
              stroke={chartColors.secondary}
              strokeWidth={2}
              dot={{ fill: chartColors.secondary, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: chartColors.secondary, strokeWidth: 2 }}
              name="Orders"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}