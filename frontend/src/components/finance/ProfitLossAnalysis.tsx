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
  Treemap,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Percent,
  Target,
  ArrowUp,
  ArrowDown,
  Activity,
  BarChart3,
  PieChartIcon,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatPercentage, getChartColor, chartColors } from '@/lib/utils';

interface DateRange {
  from: string;
  to: string;
}

interface ProfitLossAnalysisProps {
  dateRange: DateRange;
}

export default function ProfitLossAnalysis({ dateRange }: ProfitLossAnalysisProps) {
  // P&L Summary
  const plSummary = React.useMemo(() => ({
    revenue: 458750,
    cogs: 226850,
    grossProfit: 231900,
    grossMargin: 50.5,
    operatingExpenses: 85600,
    operatingProfit: 146300,
    operatingMargin: 31.9,
    otherIncome: 5200,
    otherExpenses: 3150,
    ebitda: 148350,
    depreciation: 12500,
    ebit: 135850,
    interest: 8750,
    taxExpense: 31775,
    netProfit: 95325,
    netMargin: 20.8,
  }), []);

  // Monthly P&L trend
  const monthlyPLData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      revenue: 35000 + Math.sin(index / 2) * 8000 + Math.random() * 5000,
      cogs: 17000 + Math.sin(index / 3) * 4000 + Math.random() * 2000,
      grossProfit: 0,
      operatingExpenses: 7000 + Math.sin(index / 4) * 1500 + Math.random() * 1000,
      netProfit: 0,
      grossMargin: 0,
      netMargin: 0,
    })).map(item => {
      item.grossProfit = item.revenue - item.cogs;
      item.netProfit = item.grossProfit - item.operatingExpenses;
      item.grossMargin = (item.grossProfit / item.revenue) * 100;
      item.netMargin = (item.netProfit / item.revenue) * 100;
      return item;
    });
  }, []);

  // Waterfall chart data for P&L breakdown
  const waterfallData = React.useMemo(() => [
    { name: 'Revenue', value: 458750, fill: chartColors.success },
    { name: 'COGS', value: -226850, fill: chartColors.error },
    { name: 'Gross Profit', value: 231900, fill: chartColors.info, isTotal: true },
    { name: 'Operating Expenses', value: -85600, fill: chartColors.error },
    { name: 'Operating Profit', value: 146300, fill: chartColors.info, isTotal: true },
    { name: 'Other Income', value: 5200, fill: chartColors.success },
    { name: 'Other Expenses', value: -3150, fill: chartColors.error },
    { name: 'EBITDA', value: 148350, fill: chartColors.info, isTotal: true },
    { name: 'Depreciation', value: -12500, fill: chartColors.error },
    { name: 'Interest', value: -8750, fill: chartColors.error },
    { name: 'Tax', value: -31775, fill: chartColors.error },
    { name: 'Net Profit', value: 95325, fill: chartColors.primary, isTotal: true },
  ], []);

  // Product profitability analysis
  const productProfitability = React.useMemo(() => [
    { product: 'White Shrimp (P. vannamei)', revenue: 185000, cost: 92500, profit: 92500, margin: 50.0 },
    { product: 'Black Tiger Shrimp', revenue: 95000, cost: 52250, profit: 42750, margin: 45.0 },
    { product: 'Giant Freshwater Prawn', revenue: 68000, cost: 40800, profit: 27200, margin: 40.0 },
    { product: 'Pacific White Shrimp', revenue: 52000, cost: 33800, profit: 18200, margin: 35.0 },
    { product: 'Feed & Supplies', revenue: 35000, cost: 24500, profit: 10500, margin: 30.0 },
    { product: 'Equipment Rental', revenue: 23750, cost: 11875, profit: 11875, margin: 50.0 },
  ], []);

  // Customer segment profitability
  const segmentProfitability = React.useMemo(() => [
    { segment: 'Wholesale', revenue: 215000, profit: 64500, margin: 30.0, contribution: 67.7 },
    { segment: 'Retail', revenue: 125000, profit: 31250, margin: 25.0, contribution: 32.8 },
    { segment: 'Restaurants', revenue: 68000, profit: 13600, margin: 20.0, contribution: 14.3 },
    { segment: 'Direct', revenue: 35000, profit: 12250, margin: 35.0, contribution: 12.9 },
    { segment: 'Export', revenue: 15750, profit: 3150, margin: 20.0, contribution: 3.3 },
  ], []);

  // Quarterly performance
  const quarterlyPerformance = React.useMemo(() => [
    { quarter: 'Q1', revenue: 105000, expenses: 78750, profit: 26250, margin: 25.0, yoy: 12.5 },
    { quarter: 'Q2', revenue: 112000, expenses: 81200, profit: 30800, margin: 27.5, yoy: 15.2 },
    { quarter: 'Q3', revenue: 118750, expenses: 83125, profit: 35625, margin: 30.0, yoy: 18.8 },
    { quarter: 'Q4', revenue: 123000, expenses: 82625, profit: 40375, margin: 32.8, yoy: 22.3 },
  ], []);

  // Cost structure breakdown
  const costStructure = React.useMemo(() => [
    { category: 'Raw Materials', amount: 125000, percentage: 40.0 },
    { category: 'Labor', amount: 87500, percentage: 28.0 },
    { category: 'Operations', amount: 46875, percentage: 15.0 },
    { category: 'Marketing & Sales', amount: 21875, percentage: 7.0 },
    { category: 'Administration', amount: 18750, percentage: 6.0 },
    { category: 'Other', amount: 12450, percentage: 4.0 },
  ], []);

  // Margin analysis by time period
  const marginTrend = React.useMemo(() => {
    const days = 90;
    const data = [];
    for (let i = 0; i < days; i++) {
      data.push({
        day: i + 1,
        grossMargin: 48 + Math.sin(i / 10) * 5 + Math.random() * 2,
        operatingMargin: 30 + Math.sin(i / 12) * 4 + Math.random() * 1.5,
        netMargin: 20 + Math.sin(i / 15) * 3 + Math.random() * 1,
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
              {entry.name}: {
                entry.name.includes('Margin') || entry.name.includes('margin')
                  ? `${entry.value.toFixed(1)}%`
                  : formatCurrency(Math.abs(entry.value))
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
      {/* P&L Statement Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Statement</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">Revenue</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(plSummary.revenue)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-t">
            <span className="text-sm text-gray-600">Cost of Goods Sold</span>
            <span className="text-sm text-red-600">-{formatCurrency(plSummary.cogs)}</span>
          </div>
          <div className="flex items-center justify-between py-2 bg-green-50 px-2 rounded">
            <span className="text-sm font-medium text-gray-700">Gross Profit</span>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">{formatCurrency(plSummary.grossProfit)}</span>
              <span className="text-xs text-gray-500 ml-2">({plSummary.grossMargin}%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Operating Expenses</span>
            <span className="text-sm text-red-600">-{formatCurrency(plSummary.operatingExpenses)}</span>
          </div>
          <div className="flex items-center justify-between py-2 bg-blue-50 px-2 rounded">
            <span className="text-sm font-medium text-gray-700">Operating Profit</span>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-900">{formatCurrency(plSummary.operatingProfit)}</span>
              <span className="text-xs text-gray-500 ml-2">({plSummary.operatingMargin}%)</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Other Income</span>
            <span className="text-sm text-green-600">+{formatCurrency(plSummary.otherIncome)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Other Expenses</span>
            <span className="text-sm text-red-600">-{formatCurrency(plSummary.otherExpenses)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-700">EBITDA</span>
            <span className="text-sm font-bold text-gray-900">{formatCurrency(plSummary.ebitda)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Depreciation & Amortization</span>
            <span className="text-sm text-red-600">-{formatCurrency(plSummary.depreciation)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Interest</span>
            <span className="text-sm text-red-600">-{formatCurrency(plSummary.interest)}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">Tax Expense</span>
            <span className="text-sm text-red-600">-{formatCurrency(plSummary.taxExpense)}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-t-2 bg-gradient-to-r from-green-50 to-blue-50 px-2 rounded">
            <span className="text-base font-bold text-gray-900">Net Profit</span>
            <div className="text-right">
              <span className="text-base font-bold text-green-600">{formatCurrency(plSummary.netProfit)}</span>
              <span className="text-sm text-gray-500 ml-2">({plSummary.netMargin}%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Percent className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Gross Margin</p>
              <p className="text-xl font-bold text-gray-900">{plSummary.grossMargin}%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                2.3% vs last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Operating Margin</p>
              <p className="text-xl font-bold text-gray-900">{plSummary.operatingMargin}%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                1.8% vs last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Net Margin</p>
              <p className="text-xl font-bold text-gray-900">{plSummary.netMargin}%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                1.5% vs last period
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">EBITDA Margin</p>
              <p className="text-xl font-bold text-gray-900">32.3%</p>
              <div className="flex items-center text-xs text-green-600 mt-1">
                <ArrowUp className="h-3 w-3 mr-1" />
                2.1% vs last period
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly P&L Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly P&L Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyPLData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="amount" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="margin" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="amount" dataKey="revenue" fill={chartColors.success} name="Revenue" />
                <Bar yAxisId="amount" dataKey="netProfit" fill={chartColors.primary} name="Net Profit" />
                <Line
                  yAxisId="margin"
                  type="monotone"
                  dataKey="netMargin"
                  stroke={chartColors.warning}
                  strokeWidth={2}
                  dot={{ fill: chartColors.warning, r: 3 }}
                  name="Net Margin %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quarterly Performance */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quarterly Performance</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={quarterlyPerformance} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="quarter" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="revenue" fill={chartColors.success} name="Revenue" />
                <Bar dataKey="expenses" fill={chartColors.error} name="Expenses" />
                <Bar dataKey="profit" fill={chartColors.primary} name="Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Cost Structure */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Structure</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={costStructure}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {costStructure.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Margin Trend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">90-Day Margin Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={marginTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="grossMargin"
                  stroke={chartColors.success}
                  strokeWidth={2}
                  dot={false}
                  name="Gross Margin %"
                />
                <Line
                  type="monotone"
                  dataKey="operatingMargin"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={false}
                  name="Operating Margin %"
                />
                <Line
                  type="monotone"
                  dataKey="netMargin"
                  stroke={chartColors.warning}
                  strokeWidth={2}
                  dot={false}
                  name="Net Margin %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Product Profitability Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Profitability Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Margin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productProfitability.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {product.product}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(product.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(product.profit)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      product.margin >= 45 ? 'bg-green-100 text-green-800' :
                      product.margin >= 35 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {product.margin}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2 max-w-[100px]">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${product.margin * 2}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-900">
                        {((product.profit / plSummary.netProfit) * 100).toFixed(1)}% of total
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Segment Profitability */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segment Profitability</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {segmentProfitability.map((segment, index) => (
            <div key={index} className="text-center border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">{segment.segment}</div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(segment.profit)}</div>
              <div className="text-xs text-gray-500 mt-1">Revenue: {formatCurrency(segment.revenue)}</div>
              <div className="mt-3">
                <div className="text-sm font-medium text-gray-600">Margin</div>
                <div className="text-lg font-bold text-green-600">{segment.margin}%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className="h-1 rounded-full bg-green-500" 
                  style={{ width: `${segment.contribution}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-1">{segment.contribution}% contribution</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}