'use client';

import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Percent,
  ShoppingCart,
  Package,
  Users,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  CreditCard
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage, getChartColor, chartColors } from '@/lib/utils';
import ExportButton from '@/components/ui/ExportButton';
import { useExport } from '@/hooks/useExport';

interface DateRange {
  from: string;
  to: string;
}

interface FinancialOverviewProps {
  dateRange: DateRange;
}

export default function FinancialOverview({ dateRange }: FinancialOverviewProps) {
  const { exportFinancialReport } = useExport({
    title: 'Financial Overview Report',
    subtitle: 'Executive Summary and Key Financial Metrics',
    dateRange,
    chartContainerSelector: '#financial-overview-container',
  });
  // Mock financial data
  const financialMetrics = React.useMemo(() => ({
    totalRevenue: 458750,
    totalExpenses: 312450,
    netProfit: 146300,
    grossMargin: 68.2,
    netMargin: 31.9,
    operatingCosts: 85600,
    cogs: 226850,
    cashInHand: 325000,
    accountsReceivable: 78500,
    accountsPayable: 42300,
    inventoryValue: 285000,
    pendingOrders: 125000,
    revenueGrowth: 12.5,
    expenseGrowth: 8.3,
    profitGrowth: 18.2,
  }), []);

  // Monthly trend data
  const monthlyTrendData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      revenue: 35000 + Math.sin(index / 2) * 10000 + Math.random() * 5000,
      expenses: 25000 + Math.sin(index / 3) * 8000 + Math.random() * 3000,
      profit: 10000 + Math.sin(index / 2) * 3000 + Math.random() * 2000,
      grossMargin: 65 + Math.sin(index / 4) * 5 + Math.random() * 3,
    }));
  }, []);

  // Revenue breakdown by category
  const revenueBreakdown = React.useMemo(() => [
    { category: 'Shrimp Sales', value: 275000, percentage: 60 },
    { category: 'Equipment Rental', value: 68000, percentage: 15 },
    { category: 'Consulting Services', value: 45750, percentage: 10 },
    { category: 'Feed Sales', value: 35000, percentage: 8 },
    { category: 'Other', value: 35000, percentage: 7 },
  ], []);

  // Expense breakdown by category
  const expenseBreakdown = React.useMemo(() => [
    { category: 'Feed & Supplies', value: 125000, percentage: 40 },
    { category: 'Labor', value: 87500, percentage: 28 },
    { category: 'Utilities', value: 31250, percentage: 10 },
    { category: 'Equipment', value: 25000, percentage: 8 },
    { category: 'Transportation', value: 18750, percentage: 6 },
    { category: 'Maintenance', value: 15625, percentage: 5 },
    { category: 'Other', value: 9325, percentage: 3 },
  ], []);

  // Cash flow trend
  const cashFlowData = React.useMemo(() => {
    const days = 30;
    const data = [];
    let balance = 250000;
    
    for (let i = 0; i < days; i++) {
      const inflow = Math.random() * 20000;
      const outflow = Math.random() * 15000;
      balance += inflow - outflow;
      
      data.push({
        day: i + 1,
        inflow,
        outflow,
        netFlow: inflow - outflow,
        balance,
      });
    }
    return data;
  }, []);

  // Top customers by revenue
  const topCustomers = React.useMemo(() => [
    { name: 'SeaFood Distributors Inc', revenue: 85000, orders: 45, avgOrder: 1889 },
    { name: 'Coastal Aqua Markets', revenue: 67500, orders: 38, avgOrder: 1776 },
    { name: 'Fresh Catch Wholesale', revenue: 52000, orders: 32, avgOrder: 1625 },
    { name: 'Ocean Harvest Co', revenue: 41000, orders: 28, avgOrder: 1464 },
    { name: 'Marine Foods Ltd', revenue: 35750, orders: 25, avgOrder: 1430 },
  ], []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('Margin') || entry.name.includes('Rate') 
                  ? `${entry.value.toFixed(1)}%`
                  : formatCurrency(entry.value)
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    const mockTransactions = [
      { date: '2025-01-15', description: 'Shrimp Sales', category: 'Revenue', amount: 85000, type: 'Income' },
      { date: '2025-01-14', description: 'Feed Purchase', category: 'COGS', amount: -25000, type: 'Expense' },
      { date: '2025-01-13', description: 'Equipment Rental', category: 'Revenue', amount: 15000, type: 'Income' },
      { date: '2025-01-12', description: 'Labor Costs', category: 'Operating', amount: -18000, type: 'Expense' },
      { date: '2025-01-11', description: 'Consulting Services', category: 'Revenue', amount: 12000, type: 'Income' },
    ];

    await exportFinancialReport(
      {
        revenue: financialMetrics.totalRevenue,
        expenses: financialMetrics.totalExpenses,
        profit: financialMetrics.netProfit,
        margin: financialMetrics.netMargin,
      },
      mockTransactions,
      format
    );
  };

  return (
    <div id="financial-overview-container" className="space-y-6">
      {/* Export Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Financial Overview</h2>
          <p className="text-sm text-gray-600">Key financial metrics and performance indicators</p>
        </div>
        <ExportButton
          exportData={{
            title: 'Financial Overview Report',
            subtitle: 'Executive Summary and Key Financial Metrics',
            data: topCustomers,
            dateRange,
            summary: [
              { label: 'Total Revenue', value: financialMetrics.totalRevenue },
              { label: 'Total Expenses', value: financialMetrics.totalExpenses },
              { label: 'Net Profit', value: financialMetrics.netProfit },
              { label: 'Net Margin', value: `${financialMetrics.netMargin}%` },
              { label: 'Gross Margin', value: `${financialMetrics.grossMargin}%` },
            ],
          }}
          options={{ includeCharts: true }}
        />
      </div>
      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Revenue</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.totalRevenue)}</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                {financialMetrics.revenueGrowth}%
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Expenses</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.totalExpenses)}</p>
              <div className="flex items-center text-xs text-red-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                {financialMetrics.expenseGrowth}%
              </div>
            </div>
            <TrendingDown className="h-8 w-8 text-red-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Net Profit</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.netProfit)}</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                {financialMetrics.profitGrowth}%
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Gross Margin</p>
              <p className="text-lg font-bold text-gray-900">{financialMetrics.grossMargin}%</p>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <Activity className="h-3 w-3 mr-1" />
                Healthy
              </div>
            </div>
            <Percent className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Net Margin</p>
              <p className="text-lg font-bold text-gray-900">{financialMetrics.netMargin}%</p>
              <div className="flex items-center text-xs text-purple-600 mt-1">
                <Target className="h-3 w-3 mr-1" />
                Above target
              </div>
            </div>
            <Percent className="h-8 w-8 text-purple-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Cash in Hand</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.cashInHand)}</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <CreditCard className="h-3 w-3 mr-1" />
                Sufficient
              </div>
            </div>
            <CreditCard className="h-8 w-8 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Receivables</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.accountsReceivable)}</p>
              <div className="flex items-center text-xs text-orange-600 mt-1">
                <Users className="h-3 w-3 mr-1" />
                30 days avg
              </div>
            </div>
            <Users className="h-8 w-8 text-orange-600 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Pending Orders</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(financialMetrics.pendingOrders)}</p>
              <div className="flex items-center text-xs text-blue-600 mt-1">
                <ShoppingCart className="h-3 w-3 mr-1" />
                15 orders
              </div>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart-title="Revenue vs Expenses Trend">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="amount" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="margin" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="amount" dataKey="revenue" fill={chartColors.success} name="Revenue" />
                <Bar yAxisId="amount" dataKey="expenses" fill={chartColors.error} name="Expenses" />
                <Line
                  yAxisId="margin"
                  type="monotone"
                  dataKey="grossMargin"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 3 }}
                  name="Gross Margin %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Profit Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart-title="Profit Trend">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.success} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.success} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke={chartColors.success}
                  strokeWidth={2}
                  fill="url(#profitGradient)"
                  name="Net Profit"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart-title="Revenue Breakdown">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {revenueBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart-title="Expense Breakdown">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {expenseBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cash Flow Visualization */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6" data-chart-title="30-Day Cash Flow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">30-Day Cash Flow</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={cashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="flow" stroke="#6b7280" fontSize={12} />
              <YAxis yAxisId="balance" orientation="right" stroke="#6b7280" fontSize={12} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="flow" dataKey="inflow" stackId="a" fill={chartColors.success} name="Cash In" />
              <Bar yAxisId="flow" dataKey="outflow" stackId="a" fill={chartColors.error} name="Cash Out" />
              <Line
                yAxisId="balance"
                type="monotone"
                dataKey="balance"
                stroke={chartColors.primary}
                strokeWidth={2}
                dot={false}
                name="Balance"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Customers Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Customers by Revenue</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Orders
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue Share
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topCustomers.map((customer, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {customer.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(customer.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {customer.orders}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(customer.avgOrder)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(customer.revenue / financialMetrics.totalRevenue) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">
                        {((customer.revenue / financialMetrics.totalRevenue) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}