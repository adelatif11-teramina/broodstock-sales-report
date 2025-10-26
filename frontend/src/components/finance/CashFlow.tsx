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
  ReferenceLine
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  PiggyBank,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity
} from 'lucide-react';
import { formatCurrency, formatNumber, getChartColor, chartColors } from '@/lib/utils';

interface DateRange {
  from: string;
  to: string;
}

interface CashFlowProps {
  dateRange: DateRange;
}

export default function CashFlow({ dateRange }: CashFlowProps) {
  // Cash flow summary metrics
  const cashFlowSummary = React.useMemo(() => ({
    openingBalance: 250000,
    totalInflows: 485200,
    totalOutflows: 425750,
    netCashFlow: 59450,
    closingBalance: 309450,
    operatingCashFlow: 125800,
    investingCashFlow: -45000,
    financingCashFlow: -21350,
    averageDaily: 1982,
    burnRate: 14192,
    runwayMonths: 21.8,
  }), []);

  // Daily cash flow data
  const dailyCashFlowData = React.useMemo(() => {
    const days = 30;
    const data = [];
    let runningBalance = 250000;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      
      const inflow = 8000 + Math.sin(i / 7) * 3000 + Math.random() * 2000;
      const outflow = 6000 + Math.sin(i / 5) * 2500 + Math.random() * 1500;
      const netFlow = inflow - outflow;
      runningBalance += netFlow;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inflow,
        outflow,
        netFlow,
        balance: runningBalance,
      });
    }
    return data;
  }, []);

  // Cash flow categories
  const cashFlowCategories = React.useMemo(() => ({
    operating: [
      { category: 'Customer Payments', amount: 425000, type: 'inflow' },
      { category: 'Cash Sales', amount: 60200, type: 'inflow' },
      { category: 'Supplier Payments', amount: -185000, type: 'outflow' },
      { category: 'Payroll', amount: -87500, type: 'outflow' },
      { category: 'Utilities', amount: -31250, type: 'outflow' },
      { category: 'Rent', amount: -18000, type: 'outflow' },
      { category: 'Insurance', amount: -8500, type: 'outflow' },
      { category: 'Other Operating', amount: -29150, type: 'outflow' },
    ],
    investing: [
      { category: 'Equipment Purchase', amount: -35000, type: 'outflow' },
      { category: 'Facility Improvements', amount: -8000, type: 'outflow' },
      { category: 'Investment Income', amount: 2000, type: 'inflow' },
    ],
    financing: [
      { category: 'Loan Principal', amount: -15000, type: 'outflow' },
      { category: 'Interest Payments', amount: -6350, type: 'outflow' },
    ],
  }), []);

  // Weekly cash flow forecast
  const weeklyForecast = React.useMemo(() => {
    const weeks = 12;
    const data = [];
    let balance = 309450;
    
    for (let i = 0; i < weeks; i++) {
      const weeklyInflow = 32000 + Math.sin(i / 3) * 8000 + Math.random() * 3000;
      const weeklyOutflow = 28000 + Math.sin(i / 4) * 6000 + Math.random() * 2000;
      const netFlow = weeklyInflow - weeklyOutflow;
      balance += netFlow;
      
      data.push({
        week: `Week ${i + 1}`,
        inflow: weeklyInflow,
        outflow: weeklyOutflow,
        netFlow,
        balance,
        forecast: i >= 4, // Forecast starts from week 5
      });
    }
    return data;
  }, []);

  // Accounts receivable aging
  const receivablesAging = React.useMemo(() => [
    { period: 'Current (0-30)', amount: 45000, percentage: 57.3 },
    { period: '31-60 days', amount: 18500, percentage: 23.6 },
    { period: '61-90 days', amount: 9500, percentage: 12.1 },
    { period: '90+ days', amount: 5500, percentage: 7.0 },
  ], []);

  // Payment timing analysis
  const paymentTiming = React.useMemo(() => [
    { day: 'Monday', collections: 12500, payments: 8500 },
    { day: 'Tuesday', collections: 15200, payments: 12800 },
    { day: 'Wednesday', collections: 18500, payments: 15200 },
    { day: 'Thursday', collections: 16800, payments: 11500 },
    { day: 'Friday', collections: 22000, payments: 18200 },
    { day: 'Saturday', collections: 8500, payments: 5500 },
    { day: 'Sunday', collections: 3200, payments: 2800 },
  ], []);

  // Cash flow ratios
  const cashFlowRatios = React.useMemo(() => [
    { ratio: 'Operating Cash Flow Ratio', value: 0.85, benchmark: 0.80, status: 'good' },
    { ratio: 'Cash Coverage Ratio', value: 12.5, benchmark: 10.0, status: 'good' },
    { ratio: 'Cash Turnover Ratio', value: 4.2, benchmark: 4.0, status: 'good' },
    { ratio: 'Days Cash on Hand', value: 65, benchmark: 60, status: 'good' },
    { ratio: 'Cash Conversion Cycle', value: 45, benchmark: 50, status: 'good' },
  ], []);

  // Seasonal cash flow pattern
  const seasonalPattern = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, index) => ({
      month,
      historical: 35000 + Math.sin(index / 2) * 15000 + Math.random() * 5000,
      projected: 38000 + Math.sin((index + 1) / 2) * 18000 + Math.random() * 6000,
      variance: 0,
    })).map(item => {
      item.variance = ((item.projected - item.historical) / item.historical) * 100;
      return item;
    });
  }, []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('Balance') || entry.name.includes('Flow') || entry.name.includes('flow')
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
      {/* Cash Flow Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Opening Balance</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(cashFlowSummary.openingBalance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Total Inflows</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(cashFlowSummary.totalInflows)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <ArrowDownRight className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Total Outflows</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(cashFlowSummary.totalOutflows)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Activity className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Net Cash Flow</p>
              <p className={`text-lg font-bold ${cashFlowSummary.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(cashFlowSummary.netCashFlow)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <PiggyBank className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Closing Balance</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(cashFlowSummary.closingBalance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Burn Rate</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(cashFlowSummary.burnRate)}</p>
              <p className="text-xs text-gray-500">per day</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Calendar className="h-5 w-5 text-teal-600" />
            </div>
            <div className="ml-3">
              <p className="text-xs text-gray-600 font-medium">Runway</p>
              <p className="text-lg font-bold text-gray-900">{cashFlowSummary.runwayMonths}</p>
              <p className="text-xs text-gray-500">months</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Cash Flow */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Cash Flow (30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={dailyCashFlowData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="flow" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="balance" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="flow" dataKey="inflow" fill={chartColors.success} name="Cash In" />
                <Bar yAxisId="flow" dataKey="outflow" fill={chartColors.error} name="Cash Out" />
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

        {/* Weekly Forecast */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">12-Week Cash Flow Forecast</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyForecast} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x="Week 4" stroke="red" strokeDasharray="2 2" label="Forecast Start" />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke={chartColors.primary}
                  fill="url(#balanceGradient)"
                  strokeWidth={2}
                  name="Cash Balance"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Timing */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Payment Patterns</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paymentTiming} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="collections" fill={chartColors.success} name="Collections" />
                <Bar dataKey="payments" fill={chartColors.error} name="Payments" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Seasonal Pattern */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Cash Flow Pattern</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={seasonalPattern} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="amount" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="variance" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar yAxisId="amount" dataKey="historical" fill={chartColors.gray} name="Historical" />
                <Bar yAxisId="amount" dataKey="projected" fill={chartColors.primary} name="Projected" />
                <Line
                  yAxisId="variance"
                  type="monotone"
                  dataKey="variance"
                  stroke={chartColors.warning}
                  strokeWidth={2}
                  dot={{ fill: chartColors.warning, r: 3 }}
                  name="Variance %"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Cash Flow Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operating Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Activities</h3>
          <div className="space-y-3">
            {cashFlowCategories.operating.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.category}</span>
                <span className={`text-sm font-medium ${
                  item.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.type === 'inflow' ? '+' : ''}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-4">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-900">Net Operating Cash Flow</span>
                <span className="text-green-600">{formatCurrency(cashFlowSummary.operatingCashFlow)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investing Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Investing Activities</h3>
          <div className="space-y-3">
            {cashFlowCategories.investing.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.category}</span>
                <span className={`text-sm font-medium ${
                  item.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.type === 'inflow' ? '+' : ''}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-4">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-900">Net Investing Cash Flow</span>
                <span className="text-red-600">{formatCurrency(cashFlowSummary.investingCashFlow)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financing Activities */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Financing Activities</h3>
          <div className="space-y-3">
            {cashFlowCategories.financing.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.category}</span>
                <span className={`text-sm font-medium ${
                  item.type === 'inflow' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.type === 'inflow' ? '+' : ''}{formatCurrency(item.amount)}
                </span>
              </div>
            ))}
            <div className="border-t pt-2 mt-4">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-gray-900">Net Financing Cash Flow</span>
                <span className="text-red-600">{formatCurrency(cashFlowSummary.financingCashFlow)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Receivables Aging */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Accounts Receivable Aging</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {receivablesAging.map((period, index) => (
            <div key={index} className={`p-4 rounded-lg border ${
              index === 0 ? 'bg-green-50 border-green-200' :
              index === 1 ? 'bg-yellow-50 border-yellow-200' :
              index === 2 ? 'bg-orange-50 border-orange-200' :
              'bg-red-50 border-red-200'
            }`}>
              <div className="text-sm font-medium text-gray-700">{period.period}</div>
              <div className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(period.amount)}</div>
              <div className="text-sm text-gray-600">{period.percentage}% of total</div>
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className={`h-1 rounded-full ${
                    index === 0 ? 'bg-green-500' :
                    index === 1 ? 'bg-yellow-500' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${period.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cash Flow Ratios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Flow Ratios</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {cashFlowRatios.map((ratio, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-2">{ratio.ratio}</div>
              <div className="text-2xl font-bold text-gray-900">{ratio.value}</div>
              <div className="text-xs text-gray-500">Benchmark: {ratio.benchmark}</div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(ratio.status)}`}>
                {ratio.status === 'good' ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Good
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Monitor
                  </>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}