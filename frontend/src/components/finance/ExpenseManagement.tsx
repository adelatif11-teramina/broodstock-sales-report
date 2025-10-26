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
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { 
  DollarSign, 
  TrendingDown, 
  Calendar,
  Package,
  Truck,
  Users,
  Zap,
  Wrench,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Filter,
  Download,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage, getChartColor, chartColors } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface DateRange {
  from: string;
  to: string;
}

interface ExpenseManagementProps {
  dateRange: DateRange;
}

export default function ExpenseManagement({ dateRange }: ExpenseManagementProps) {
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [selectedVendor, setSelectedVendor] = React.useState('all');
  
  // Expense summary metrics
  const expenseSummary = React.useMemo(() => ({
    totalExpenses: 312450,
    operatingExpenses: 185600,
    capitalExpenses: 45850,
    variableExpenses: 81000,
    monthlyBurn: 26037,
    expenseGrowth: 8.3,
    budgetUtilization: 87.5,
    costPerUnit: 6.95,
    overheadRatio: 28.5,
    expenseToRevenueRatio: 68.1,
  }), []);

  // Daily expense data
  const dailyExpenseData = React.useMemo(() => {
    const days = 30;
    const data = [];
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalExpense: 8000 + Math.sin(i / 4) * 2000 + Math.random() * 1000,
        operatingExpense: 5000 + Math.sin(i / 3) * 1500 + Math.random() * 500,
        capitalExpense: 1500 + Math.sin(i / 5) * 500 + Math.random() * 300,
        variableExpense: 1500 + Math.sin(i / 2) * 800 + Math.random() * 400,
      });
    }
    return data;
  }, []);

  // Expense by category
  const expenseCategories = React.useMemo(() => [
    { category: 'Feed & Nutrition', amount: 125000, percentage: 40, budget: 130000, items: 450 },
    { category: 'Labor & Wages', amount: 87500, percentage: 28, budget: 90000, items: 25 },
    { category: 'Utilities', amount: 31250, percentage: 10, budget: 35000, items: 12 },
    { category: 'Equipment Maintenance', amount: 25000, percentage: 8, budget: 28000, items: 85 },
    { category: 'Transportation', amount: 18750, percentage: 6, budget: 20000, items: 120 },
    { category: 'Lab & Testing', amount: 15625, percentage: 5, budget: 18000, items: 65 },
    { category: 'Marketing', amount: 6250, percentage: 2, budget: 10000, items: 35 },
    { category: 'Other', amount: 3075, percentage: 1, budget: 5000, items: 28 },
  ], []);

  // Top vendors by expense
  const topVendors = React.useMemo(() => [
    { vendor: 'AquaFeed Corp', amount: 85000, invoices: 45, avgInvoice: 1889, category: 'Feed' },
    { vendor: 'BioHealth Solutions', amount: 42500, invoices: 28, avgInvoice: 1518, category: 'Medication' },
    { vendor: 'Power Grid Services', amount: 28750, invoices: 12, avgInvoice: 2396, category: 'Utilities' },
    { vendor: 'TransOcean Logistics', amount: 18750, invoices: 85, avgInvoice: 221, category: 'Transportation' },
    { vendor: 'LabTech Diagnostics', amount: 15625, invoices: 35, avgInvoice: 446, category: 'Testing' },
  ], []);

  // Monthly expense trend
  const monthlyExpenseTrend = React.useMemo(() => {
    const months = 12;
    const data = [];
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i));
      data.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        actual: 24000 + Math.sin(i / 2) * 3000 + Math.random() * 2000,
        budget: 28000,
        variance: 0,
      });
    }
    data.forEach(d => {
      d.variance = ((d.actual - d.budget) / d.budget) * 100;
    });
    return data;
  }, []);

  // Cost center breakdown
  const costCenters = React.useMemo(() => [
    { center: 'Production', amount: 156225, percentage: 50, trend: 'up' },
    { center: 'Operations', amount: 78112, percentage: 25, trend: 'stable' },
    { center: 'Administration', amount: 46867, percentage: 15, trend: 'down' },
    { center: 'Sales & Marketing', amount: 31245, percentage: 10, trend: 'up' },
  ], []);

  // Expense efficiency metrics
  const efficiencyMetrics = React.useMemo(() => [
    { metric: 'Cost per Kg Produced', value: 6.95, target: 7.50, status: 'good' },
    { metric: 'Labor Cost per Unit', value: 1.94, target: 2.00, status: 'good' },
    { metric: 'Feed Conversion Ratio', value: 1.52, target: 1.45, status: 'warning' },
    { metric: 'Utility Cost per Cycle', value: 892, target: 850, status: 'warning' },
    { metric: 'Transport Cost per Delivery', value: 156, target: 175, status: 'good' },
  ], []);

  // Budget vs Actual comparison
  const budgetComparison = React.useMemo(() => [
    { category: 'Q1', budget: 95000, actual: 87500, variance: -7.9 },
    { category: 'Q2', budget: 98000, actual: 92000, variance: -6.1 },
    { category: 'Q3', budget: 102000, actual: 105000, variance: 2.9 },
    { category: 'Q4', budget: 105000, actual: 98450, variance: -6.2 },
  ], []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('Expense') || entry.name.includes('Budget') || entry.name.includes('Actual')
                  ? formatCurrency(entry.value)
                  : entry.name.includes('Variance')
                  ? `${entry.value.toFixed(1)}%`
                  : entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Expense Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-600 font-medium">Total Expenses</p>
            <div className="flex items-center text-xs text-red-600">
              <ArrowUp className="h-3 w-3 mr-1" />
              {expenseSummary.expenseGrowth}%
            </div>
          </div>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(expenseSummary.totalExpenses)}</p>
          <p className="text-xs text-gray-500 mt-1">{expenseSummary.expenseToRevenueRatio}% of revenue</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Operating Expenses</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(expenseSummary.operatingExpenses)}</p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <Receipt className="h-3 w-3 mr-1" />
            59% of total
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Monthly Burn Rate</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(expenseSummary.monthlyBurn)}</p>
          <p className="text-xs text-gray-500 mt-1">12.5 months runway</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Cost per Unit</p>
          <p className="text-xl font-bold text-gray-900">${expenseSummary.costPerUnit}</p>
          <div className="flex items-center text-xs text-green-600 mt-1">
            <ArrowDown className="h-3 w-3 mr-1" />
            3.2% reduction
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-xs text-gray-600 font-medium mb-2">Budget Utilization</p>
          <p className="text-xl font-bold text-gray-900">{expenseSummary.budgetUtilization}%</p>
          <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
            <div className="bg-green-500 h-1 rounded-full" style={{ width: `${expenseSummary.budgetUtilization}%` }} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="feed">Feed & Nutrition</option>
              <option value="labor">Labor & Wages</option>
              <option value="utilities">Utilities</option>
              <option value="equipment">Equipment</option>
              <option value="transport">Transportation</option>
            </select>
            
            <select
              value={selectedVendor}
              onChange={(e) => setSelectedVendor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Vendors</option>
              <option value="aquafeed">AquaFeed Corp</option>
              <option value="biohealth">BioHealth Solutions</option>
              <option value="powergrid">Power Grid Services</option>
              <option value="transocean">TransOcean Logistics</option>
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
        {/* Daily Expense Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyExpenseData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="operatingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="variableGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.warning} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.warning} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="operatingExpense"
                  stackId="1"
                  stroke={chartColors.primary}
                  fill="url(#operatingGradient)"
                  name="Operating"
                />
                <Area
                  type="monotone"
                  dataKey="variableExpense"
                  stackId="1"
                  stroke={chartColors.warning}
                  fill="url(#variableGradient)"
                  name="Variable"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Budget vs Actual */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget vs Actual (Quarterly)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={budgetComparison} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="category" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="amount" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="variance" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="amount" dataKey="budget" fill={chartColors.gray} name="Budget" />
                <Bar yAxisId="amount" dataKey="actual" fill={chartColors.primary} name="Actual" />
                <Line
                  yAxisId="variance"
                  type="monotone"
                  dataKey="variance"
                  stroke={chartColors.error}
                  strokeWidth={2}
                  dot={{ fill: chartColors.error, r: 4 }}
                  name="Variance %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expense Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyExpenseTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, r: 4 }}
                  name="Actual Expense"
                />
                <Line
                  type="monotone"
                  dataKey="budget"
                  stroke={chartColors.gray}
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Budget"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cost Centers */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Center Distribution</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {costCenters.map((center, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-900">{center.center}</span>
                <span className={`text-xs ${
                  center.trend === 'up' ? 'text-red-600' : center.trend === 'down' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {center.trend === 'up' ? <ArrowUp className="h-3 w-3" /> : center.trend === 'down' ? <ArrowDown className="h-3 w-3" /> : '—'}
                </span>
              </div>
              <div className="text-xl font-bold text-gray-900">{formatCurrency(center.amount)}</div>
              <div className="text-xs text-gray-500 mt-1">{center.percentage}% of total</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="h-1 rounded-full" 
                  style={{ 
                    width: `${center.percentage}%`,
                    backgroundColor: getChartColor(index)
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Vendors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Vendors by Expense</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Expense
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoices
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % of Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topVendors.map((vendor, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {vendor.vendor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {vendor.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(vendor.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {vendor.invoices}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(vendor.avgInvoice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${(vendor.amount / expenseSummary.totalExpenses) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-900">
                        {((vendor.amount / expenseSummary.totalExpenses) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Efficiency Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {efficiencyMetrics.map((metric, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-gray-700">{metric.metric}</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                {metric.metric.includes('Cost') ? formatCurrency(metric.value) : metric.value}
              </div>
              <div className="text-xs text-gray-500">
                Target: {metric.metric.includes('Cost') ? formatCurrency(metric.target) : metric.target}
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(metric.status)}`}>
                {metric.status === 'good' ? 'On Track' : metric.status === 'warning' ? 'Monitor' : 'Action Needed'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}