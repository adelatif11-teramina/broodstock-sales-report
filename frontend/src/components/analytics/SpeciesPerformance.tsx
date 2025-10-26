'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { Fish, TrendingUp, Package, DollarSign } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency, formatNumber, getChartColor } from '@/lib/utils';

interface SpeciesPerformanceProps {
  timeRange: string;
}

export default function SpeciesPerformance({ timeRange }: SpeciesPerformanceProps) {
  const [viewMode, setViewMode] = React.useState<'revenue' | 'quantity'>('revenue');

  // Mock species performance data
  const speciesData = React.useMemo(() => [
    {
      species: 'White Shrimp',
      scientificName: 'P. vannamei',
      revenue: 245000,
      quantity: 12500,
      orders: 45,
      avgPrice: 19.6,
      growth: 15.2,
      marketShare: 35,
    },
    {
      species: 'Black Tiger',
      scientificName: 'P. monodon',
      revenue: 189000,
      quantity: 8900,
      orders: 32,
      avgPrice: 21.2,
      growth: 8.7,
      marketShare: 27,
    },
    {
      species: 'Giant Freshwater',
      scientificName: 'M. rosenbergii',
      revenue: 156000,
      quantity: 6800,
      orders: 28,
      avgPrice: 22.9,
      growth: 22.1,
      marketShare: 22,
    },
    {
      species: 'Pacific White',
      scientificName: 'L. stylirostris',
      revenue: 98000,
      quantity: 4200,
      orders: 18,
      avgPrice: 23.3,
      growth: -3.2,
      marketShare: 14,
    },
    {
      species: 'Blue Shrimp',
      scientificName: 'L. booneii',
      revenue: 67000,
      quantity: 2800,
      orders: 12,
      avgPrice: 23.9,
      growth: 45.6,
      marketShare: 9,
    },
  ], []);

  const pieData = speciesData.map((item, index) => ({
    name: item.species,
    value: viewMode === 'revenue' ? item.revenue : item.quantity,
    percentage: item.marketShare,
    color: getChartColor(index),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {viewMode === 'revenue' 
              ? `Revenue: ${formatCurrency(data.value)}`
              : `Quantity: ${formatNumber(data.value)} units`
            }
          </p>
          <p className="text-sm text-gray-600">
            Market Share: {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const totalRevenue = speciesData.reduce((sum, item) => sum + item.revenue, 0);
  const totalQuantity = speciesData.reduce((sum, item) => sum + item.quantity, 0);
  const totalOrders = speciesData.reduce((sum, item) => sum + item.orders, 0);
  const topPerformer = speciesData[0];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Fish className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Species Performance</h3>
            <p className="text-sm text-gray-500">Sales breakdown by shrimp species</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('revenue')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'revenue'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setViewMode('quantity')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'quantity'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Quantity
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Revenue</p>
              <p className="text-sm font-bold text-blue-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center">
            <Package className="h-4 w-4 text-green-600 mr-2" />
            <div>
              <p className="text-xs text-green-600 font-medium">Total Units</p>
              <p className="text-sm font-bold text-green-900">
                {formatNumber(totalQuantity)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center">
            <Fish className="h-4 w-4 text-purple-600 mr-2" />
            <div>
              <p className="text-xs text-purple-600 font-medium">Total Orders</p>
              <p className="text-sm font-bold text-purple-900">
                {formatNumber(totalOrders)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 text-orange-600 mr-2" />
            <div>
              <p className="text-xs text-orange-600 font-medium">Top Species</p>
              <p className="text-sm font-bold text-orange-900">
                {topPerformer.species}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {viewMode === 'revenue' ? 'Revenue' : 'Quantity'} Distribution
          </h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ percentage }) => `${percentage}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Species List */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Species Details</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {speciesData.map((species, index) => (
              <div key={species.species} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getChartColor(index) }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{species.species}</p>
                    <p className="text-xs text-gray-500 italic">{species.scientificName}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {viewMode === 'revenue' 
                      ? formatCurrency(species.revenue)
                      : `${formatNumber(species.quantity)} units`
                    }
                  </p>
                  <p className={`text-xs ${species.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {species.growth >= 0 ? '+' : ''}{species.growth.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Bar Chart */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Growth Comparison</h4>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={speciesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="species" 
                stroke="#6b7280"
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                formatter={(value: any) => [`${value.toFixed(1)}%`, 'Growth Rate']}
                labelStyle={{ color: '#374151' }}
              />
              <Bar 
                dataKey="growth" 
                fill="#3B82F6"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}