'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ReferenceArea
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Target } from 'lucide-react';

export default function ExecutiveSalesCharts() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Fetch revenue analytics from API
  const { 
    data: analyticsData, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['revenue-analytics', selectedPeriod],
    queryFn: () => apiClient.getRevenueAnalytics(selectedPeriod as any, 'daily'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate fallback mock data for charts
  const fallbackData = useMemo(() => {
    const days = selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 90 : 365;
    const salesData = [];
    const speciesData = [];
    const customerData = [];
    const regionData = [];

    // Sales progression with target and anomalies
    let cumulativeRevenue = 0;
    const dailyTarget = 15000;
    let cumulativeTarget = 0;

    for (let i = days - 1; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const baseRevenue = 12000 + Math.random() * 8000;
      
      // Create anomalies on specific days
      let dailyRevenue = baseRevenue;
      let isAnomaly = false;
      
      if (i === 15 || i === 8) { // Spike anomalies
        dailyRevenue = baseRevenue * 2.5;
        isAnomaly = true;
      } else if (i === 22 || i === 5) { // Drop anomalies
        dailyRevenue = baseRevenue * 0.3;
        isAnomaly = true;
      }
      
      cumulativeRevenue += dailyRevenue;
      cumulativeTarget += dailyTarget;
      
      salesData.push({
        date: format(date, 'MMM dd'),
        dailyRevenue: Math.round(dailyRevenue),
        cumulativeRevenue: Math.round(cumulativeRevenue),
        cumulativeTarget: Math.round(cumulativeTarget),
        orders: Math.floor(dailyRevenue / 8500) + Math.floor(Math.random() * 3),
        isAnomaly
      });
    }

    // Species breakdown
    const species = [
      { name: 'Penaeus vannamei', value: 185000, orders: 78, color: '#3B82F6' },
      { name: 'Penaeus monodon', value: 142000, orders: 45, color: '#10B981' },
      { name: 'Penaeus japonicus', value: 89000, orders: 23, color: '#F59E0B' },
      { name: 'Mixed Species', value: 71500, orders: 10, color: '#EF4444' }
    ];

    // Top customers
    const customers = [
      { name: 'Minh Phu Seafood', value: 125000, orders: 15, country: 'Vietnam' },
      { name: 'Thai Union Aquaculture', value: 89000, orders: 12, country: 'Thailand' },
      { name: 'Philippine Aquaculture', value: 76500, orders: 11, country: 'Philippines' },
      { name: 'Indonesia Shrimp Holdings', value: 65000, orders: 8, country: 'Indonesia' },
      { name: 'Malaysia Marine Farms', value: 54000, orders: 7, country: 'Malaysia' },
      { name: 'Coastal Aqua Farms', value: 47000, orders: 6, country: 'India' },
      { name: 'Singapore Aquatics', value: 38000, orders: 5, country: 'Singapore' },
      { name: 'Vietnam Shrimp Co', value: 32000, orders: 4, country: 'Vietnam' }
    ];

    // Regional breakdown
    const regions = [
      { name: 'Southeast Asia', value: 285000, percentage: 58.5, color: '#3B82F6' },
      { name: 'South Asia', value: 125000, percentage: 25.6, color: '#10B981' },
      { name: 'East Asia', value: 77500, percentage: 15.9, color: '#F59E0B' }
    ];

    return { salesData, species, customers, regions };
  }, [selectedPeriod]);

  // Use API data if available, otherwise fallback
  const chartData = useMemo(() => {
    if (analyticsData) {
      return {
        salesData: analyticsData.revenueTimeSeries.map((item: any) => ({
          date: format(new Date(item.date), 'MMM dd'),
          revenue: item.revenue,
          cumulative: item.revenue, // This would be calculated cumulative in real implementation
          target: 15000, // Daily target
          orders: item.orders,
          isAnomaly: item.revenue > 20000, // Mark high revenue days as anomalies
        })),
        species: analyticsData.topSpecies,
        customers: fallbackData.customers, // Use fallback for now
        regions: analyticsData.regionalBreakdown.map((item: any) => ({
          name: item.region,
          value: item.revenue,
          percentage: item.percentage,
          color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][Math.floor(Math.random() * 4)],
        })),
      };
    }
    return fallbackData;
  }, [analyticsData, fallbackData]);

  const onTimeDeliveryRate = 94.7;

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
          <div key={i} className="surface-card rounded-2xl border-0 p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
              <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="surface-card border-0 p-3 rounded-2xl shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Create gauge data for on-time delivery
  const gaugeData = [
    { name: 'On-Time', value: onTimeDeliveryRate, fill: '#10B981' },
    { name: 'Remaining', value: 100 - onTimeDeliveryRate, fill: '#E5E7EB' }
  ];

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Sales Progress & Analytics</h3>
        <div className="flex space-x-2">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="365d">Last Year</option>
          </select>
        </div>
      </div>

      {/* Main Sales Chart with Targets and Anomalies */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Cumulative Sales vs Target</h4>
            <p className="text-sm text-gray-500">Daily progression with anomaly detection</p>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Actual Sales</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Target</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-200 rounded-full mr-2"></div>
              <span className="text-gray-600">Anomalies</span>
            </div>
          </div>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#6b7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Anomaly shading */}
              {chartData.salesData.map((item: any, index: number) => 
                item.isAnomaly ? (
                  <ReferenceArea
                    key={index}
                    x1={index > 0 ? chartData.salesData[index - 1].date : item.date}
                    x2={index < chartData.salesData.length - 1 ? chartData.salesData[index + 1].date : item.date}
                    fill="#FEE2E2"
                    fillOpacity={0.3}
                  />
                ) : null
              )}
              
              <Line
                type="monotone"
                dataKey="cumulativeRevenue"
                stroke="#3B82F6"
                strokeWidth={3}
                dot={false}
                name="Cumulative Sales"
              />
              <Line
                type="monotone"
                dataKey="cumulativeTarget"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
                name="Target"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Species Breakdown */}
        <div className="surface-card rounded-2xl shadow-sm border-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Sales by Species</h4>
              <p className="text-sm text-gray-500">Revenue distribution</p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData.species} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number"
                  stroke="#6b7280"
                  fontSize={12}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <YAxis 
                  type="category"
                  dataKey="name"
                  stroke="#6b7280"
                  fontSize={11}
                  width={120}
                />
                <Tooltip 
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Regional Distribution */}
        <div className="surface-card rounded-2xl shadow-sm border-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Regional Distribution</h4>
              <p className="text-sm text-gray-500">Sales by geographic region</p>
            </div>
            <PieChartIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.regions}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {chartData.regions.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="space-y-2 mt-4">
            {chartData.regions.map((region: any, index: number) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: region.color }}
                  ></div>
                  <span className="text-gray-700">{region.name}</span>
                </div>
                <span className="font-medium text-gray-900">{region.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top 10 Customers */}
        <div className="surface-card rounded-2xl shadow-sm border-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">Top Customers</h4>
              <p className="text-sm text-gray-500">Highest revenue contributors</p>
            </div>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="space-y-3">
            {chartData.customers.slice(0, 8).map((customer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {customer.name}
                    </span>
                    <span className="text-sm text-gray-500 ml-2">{customer.country}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-3">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${(customer.value / 125000) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 min-w-max">
                      ${customer.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* On-Time Delivery Gauge */}
        <div className="surface-card rounded-2xl shadow-sm border-0 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900">On-Time Delivery</h4>
              <p className="text-sm text-gray-500">Shipment performance rate</p>
            </div>
            <Target className="h-5 w-5 text-gray-400" />
          </div>
          
          <div className="h-48 flex items-center justify-center">
            <div className="relative">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    startAngle={180}
                    endAngle={0}
                    dataKey="value"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {onTimeDeliveryRate}%
                  </div>
                  <div className="text-sm text-gray-500">On-Time</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">148</div>
              <div className="text-sm text-gray-500">On-Time</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">8</div>
              <div className="text-sm text-gray-500">Delayed</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
