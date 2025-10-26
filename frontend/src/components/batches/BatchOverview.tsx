'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Package, 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Thermometer,
  Droplets,
  Clock,
  Target
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatNumber, getChartColor, chartColors } from '@/lib/utils';

export default function BatchOverview() {
  // Mock data for demonstration
  const batchStats = React.useMemo(() => ({
    totalBatches: 45,
    activeBatches: 38,
    healthyBatches: 32,
    criticalBatches: 3,
    warningBatches: 3,
    avgSurvivalRate: 92.5,
    avgGrowthRate: 1.8,
    totalPopulation: 2850000,
    readyForHarvest: 8,
  }), []);

  const batchStatusData = React.useMemo(() => [
    { status: 'Healthy', count: 32, color: chartColors.success },
    { status: 'Warning', count: 3, color: chartColors.warning },
    { status: 'Critical', count: 3, color: chartColors.error },
    { status: 'Inactive', count: 7, color: chartColors.gray },
  ], []);

  const growthTrendData = React.useMemo(() => {
    const data = [];
    for (let i = 0; i < 30; i++) {
      data.push({
        day: i + 1,
        avgLength: 8 + (i * 0.2) + (Math.random() * 0.4 - 0.2),
        avgWeight: 0.5 + (i * 0.05) + (Math.random() * 0.02 - 0.01),
        survivalRate: 98 - (i * 0.1) + (Math.random() * 0.5 - 0.25),
      });
    }
    return data;
  }, []);

  const environmentalData = React.useMemo(() => {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      data.push({
        time: time.getHours().toString().padStart(2, '0') + ':00',
        temperature: 28.5 + Math.sin(i / 4) * 2 + (Math.random() * 0.5 - 0.25),
        ph: 7.8 + (Math.random() * 0.3 - 0.15),
        oxygen: 6.5 + (Math.random() * 0.8 - 0.4),
        salinity: 15 + (Math.random() * 1 - 0.5),
      });
    }
    return data;
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value?.toFixed(2)}
              {entry.name.includes('Temperature') && '°C'}
              {entry.name.includes('Length') && 'mm'}
              {entry.name.includes('Weight') && 'g'}
              {entry.name.includes('Rate') && '%'}
              {entry.name.includes('pH') && ''}
              {entry.name.includes('Oxygen') && 'mg/L'}
              {entry.name.includes('Salinity') && 'ppt'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Batches</p>
              <p className="text-lg font-bold text-gray-900">{batchStats.totalBatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Active</p>
              <p className="text-lg font-bold text-gray-900">{batchStats.activeBatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Survival Rate</p>
              <p className="text-lg font-bold text-gray-900">{batchStats.avgSurvivalRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Growth Rate</p>
              <p className="text-lg font-bold text-gray-900">{batchStats.avgGrowthRate}mm/d</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Critical</p>
              <p className="text-lg font-bold text-gray-900">{batchStats.criticalBatches}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Ready</p>
              <p className="text-lg font-bold text-gray-900">{batchStats.readyForHarvest}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-cyan-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Population</p>
              <p className="text-lg font-bold text-gray-900">{formatNumber(batchStats.totalPopulation / 1000)}K</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Thermometer className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Avg Temp</p>
              <p className="text-lg font-bold text-gray-900">28.5°C</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Batch Status Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Health Status</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={batchStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ status, count }) => `${status}: ${count}`}
                >
                  {batchStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth & Survival Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="length" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="survival" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  yAxisId="length"
                  type="monotone"
                  dataKey="avgLength"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, strokeWidth: 2, r: 3 }}
                  name="Avg Length"
                />
                <Line
                  yAxisId="survival"
                  type="monotone"
                  dataKey="survivalRate"
                  stroke={chartColors.success}
                  strokeWidth={2}
                  dot={{ fill: chartColors.success, strokeWidth: 2, r: 3 }}
                  name="Survival Rate"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Conditions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Environmental Conditions (24h)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={environmentalData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="temp" domain={[25, 32]} stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="others" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="temperature"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                  name="Temperature"
                />
                <Line
                  yAxisId="others"
                  type="monotone"
                  dataKey="ph"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={false}
                  name="pH"
                />
                <Line
                  yAxisId="others"
                  type="monotone"
                  dataKey="oxygen"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                  name="Oxygen"
                />
                <Line
                  yAxisId="others"
                  type="monotone"
                  dataKey="salinity"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  dot={false}
                  name="Salinity"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Environmental Status Indicators */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Thermometer className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm font-medium">Temperature</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">28.5°C (Optimal)</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Droplets className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-sm font-medium">pH Level</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">7.8 (Good)</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Activity className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm font-medium">Oxygen</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">6.5 mg/L (Good)</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center">
                <Droplets className="h-4 w-4 text-purple-500 mr-1" />
                <span className="text-sm font-medium">Salinity</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">15 ppt (Optimal)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}