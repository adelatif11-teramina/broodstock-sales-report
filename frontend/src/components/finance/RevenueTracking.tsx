'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Scatter
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Package,
  Users,
  ShoppingCart,
  Target,
  ArrowUp,
  ArrowDown,
  Filter,
  Download
} from 'lucide-react';
import { formatCurrency, formatNumber, getChartColor, chartColors } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface DateRange {
  from: string;
  to: string;
}

interface RevenueTrackingProps {
  dateRange: DateRange;
}

export default function RevenueTracking({ dateRange }: RevenueTrackingProps) {
  const [selectedProduct, setSelectedProduct] = React.useState('all');
  const [selectedRegion, setSelectedRegion] = React.useState('all');
  
  // Revenue summary metrics
  const revenueSummary = React.useMemo(() => ({
    currentMonthRevenue: 48750,
    lastMonthRevenue: 43500,
    quarterRevenue: 145250,
    yearToDateRevenue: 458750,
    averageOrderValue: 2850,
    totalOrders: 161,
    recurringRevenue: 28500,
    oneTimeRevenue: 20250,
    growthRate: 12.1,
    targetAchievement: 94.5,
  }), []);

  // Daily revenue data
  const dailyRevenueData = React.useMemo(() => {
    const days = 30;
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 1200 + Math.sin(i / 3) * 500 + Math.random() * 300,
        orders: Math.floor(3 + Math.random() * 5),
        avgOrderValue: 280 + Math.random() * 120,
      });
    }
    return data;
  }, []);

  // Revenue by product category
  const productRevenue = React.useMemo(() => [
    { product: 'White Shrimp (P. vannamei)', revenue: 185000, units: 45000, growth: 15.2 },
    { product: 'Black Tiger Shrimp', revenue: 95000, units: 18000, growth: 8.5 },
    { product: 'Giant Freshwater Prawn', revenue: 68000, units: 12000, growth: 22.3 },
    { product: 'Pacific White Shrimp', revenue: 52000, units: 15000, growth: -5.2 },
    { product: 'Feed & Supplies', revenue: 35000, units: 8500, growth: 12.8 },
    { product: 'Equipment Rental', revenue: 23750, units: 45, growth: 18.6 },
  ], []);

  // Revenue by customer segment
  const customerSegmentRevenue = React.useMemo(() => [
    { segment: 'Wholesale Distributors', revenue: 215000, customers: 12, percentage: 47 },
    { segment: 'Retail Chains', revenue: 125000, customers: 25, percentage: 27 },
    { segment: 'Restaurant Chains', revenue: 68000, customers: 18, percentage: 15 },
    { segment: 'Direct Consumers', revenue: 35000, customers: 142, percentage: 8 },
    { segment: 'Export Markets', revenue: 15750, customers: 5, percentage: 3 },
  ], []);

  // Regional revenue distribution
  const regionalRevenue = React.useMemo(() => [
    { region: 'North', revenue: 125000, growth: 12.5, orders: 45 },
    { region: 'South', revenue: 98000, growth: 18.2, orders: 38 },
    { region: 'East', revenue: 85000, growth: 8.7, orders: 32 },
    { region: 'West', revenue: 78000, growth: 15.3, orders: 28 },
    { region: 'Central', revenue: 72750, growth: 22.1, orders: 18 },
  ], []);

  // Monthly recurring revenue (MRR) trend
  const mrrTrend = React.useMemo(() => {
    const months = 12;
    const data = [];
    let baseRevenue = 18000;
    
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i));
      baseRevenue += Math.random() * 1500;
      
      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        newMRR: 2000 + Math.random() * 1000,
        expansionMRR: 500 + Math.random() * 300,
        churnMRR: -(300 + Math.random() * 200),
        netMRR: baseRevenue,
      });
    }
    return data;
  }, []);

  // Payment methods breakdown
  const paymentMethods = React.useMemo(() => [
    { method: 'Bank Transfer', amount: 285000, transactions: 85, percentage: 62 },
    { method: 'Credit Card', amount: 92000, transactions: 45, percentage: 20 },
    { method: 'Cash', amount: 46000, transactions: 25, percentage: 10 },
    { method: 'Check', amount: 27500, transactions: 12, percentage: 6 },
    { method: 'Digital Wallet', amount: 8250, transactions: 8, percentage: 2 },
  ], []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('Revenue') || entry.name.includes('Value') || entry.name.includes('MRR')
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
    <div className="space-y-6">
      {/* Revenue Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Current Month</p>
            <div className="flex items-center text-xs text-green-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {revenueSummary.growthRate}%
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueSummary.currentMonthRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">vs {formatCurrency(revenueSummary.lastMonthRevenue)} last month</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Quarter to Date</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueSummary.quarterRevenue)}</p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Target className="h-3 w-3 mr-1" />
            {revenueSummary.targetAchievement}% of target
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Year to Date</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueSummary.yearToDateRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">{formatNumber(revenueSummary.totalOrders)} total orders</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Avg Order Value</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueSummary.averageOrderValue)}</p>
          <div className="flex items-center text-xs text-green-600 mt-1">
            <ArrowUp className="h-3 w-3 mr-1" />
            8.5% increase
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Recurring Revenue</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(revenueSummary.recurringRevenue)}</p>
          <p className="text-xs text-gray-500 mt-1">58% of total revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Products</option>
              <option value="white_shrimp">White Shrimp</option>
              <option value="black_tiger">Black Tiger Shrimp</option>
              <option value="freshwater_prawn">Freshwater Prawn</option>
              <option value="feed">Feed & Supplies</option>
            </select>
            
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Regions</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
              <option value="central">Central</option>
            </select>

            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              More Filters
            </Button>
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyRevenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="revenue" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="orders" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  yAxisId="revenue"
                  type="monotone"
                  dataKey="revenue"
                  fill={chartColors.primary}
                  stroke={chartColors.primary}
                  fillOpacity={0.3}
                  name="Revenue"
                />
                <Line
                  yAxisId="orders"
                  type="monotone"
                  dataKey="orders"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.secondary, r: 3 }}
                  name="Orders"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Product</h3>
          <div className="h-64 overflow-y-auto">
            {productRevenue.map((product, index) => (
              <div key={index} className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{product.product}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(product.revenue)}
                    </span>
                    <span className={`text-xs flex items-center ${
                      product.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {product.growth >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {Math.abs(product.growth)}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${(product.revenue / 185000) * 100}%`,
                        backgroundColor: getChartColor(index),
                      }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatNumber(product.units)} units
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Segment Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Customer Segment</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={customerSegmentRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="segment" 
                  stroke="#6b7280" 
                  fontSize={11}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="revenue" fill={chartColors.primary} radius={[4, 4, 0, 0]}>
                  {customerSegmentRevenue.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MRR Growth */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Recurring Revenue Growth</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mrrTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="newMRR" stackId="a" fill={chartColors.success} name="New MRR" />
                <Bar dataKey="expansionMRR" stackId="a" fill={chartColors.info} name="Expansion MRR" />
                <Bar dataKey="churnMRR" stackId="a" fill={chartColors.error} name="Churn MRR" />
                <Line
                  type="monotone"
                  dataKey="netMRR"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 3 }}
                  name="Net MRR"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Regional Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Revenue Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Order Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {regionalRevenue.map((region, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {region.region}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(region.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-green-600">
                      <ArrowUp className="h-3 w-3 mr-1" />
                      {region.growth}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {region.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(region.revenue / region.orders)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(region.revenue / 125000) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-900">
                        {((region.revenue / 458750) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {paymentMethods.map((method, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {method.percentage}%
              </div>
              <div className="text-sm font-medium text-gray-700 mt-1">
                {method.method}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatCurrency(method.amount)}
              </div>
              <div className="text-xs text-gray-400">
                {method.transactions} transactions
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}