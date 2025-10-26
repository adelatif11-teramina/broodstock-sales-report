'use client';

import React, { useState, useMemo } from 'react';
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
  ScatterChart,
  Scatter,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Target,
  Award,
  Clock,
  Filter,
  Download,
  Eye,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { format, subMonths, subDays, addMonths } from 'date-fns';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';

interface CLVData {
  customerId: string;
  customerName: string;
  segment: string;
  currentCLV: number;
  predictedCLV: number;
  actualLifetimeValue: number;
  acquisitionDate: Date;
  lastPurchaseDate: Date;
  totalOrders: number;
  avgOrderValue: number;
  purchaseFrequency: number;
  retentionProbability: number;
  churnRisk: 'low' | 'medium' | 'high';
  monthlyValues: Array<{
    month: string;
    value: number;
    orders: number;
  }>;
}

interface CLVMetrics {
  totalCLV: number;
  avgCLV: number;
  medianCLV: number;
  cac: number; // Customer Acquisition Cost
  clvCacRatio: number;
  paybackPeriod: number; // months
  retentionRate: number;
  churnRate: number;
}

interface CLVCohort {
  cohort: string;
  size: number;
  avgCLV: number;
  retentionRate: number;
  monthlyValues: Array<{
    month: number;
    retainedCustomers: number;
    revenue: number;
    avgCLV: number;
  }>;
}

export default function CustomerLifetimeValue() {
  const [timeRange, setTimeRange] = useState('12m');
  const [viewMode, setViewMode] = useState<'overview' | 'cohorts' | 'predictions' | 'segments'>('overview');
  const [selectedSegment, setSelectedSegment] = useState<string>('all');

  // Mock CLV data
  const clvData: CLVData[] = useMemo(() => 
    Array.from({ length: 150 }, (_, i) => {
      const acquisitionDate = subMonths(new Date(), Math.floor(Math.random() * 24));
      const monthsSinceAcquisition = Math.floor((new Date().getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const totalOrders = Math.floor(Math.random() * 20) + 1;
      const avgOrderValue = Math.floor(Math.random() * 2000) + 200;
      const actualLifetimeValue = totalOrders * avgOrderValue * (0.8 + Math.random() * 0.4);
      
      return {
        customerId: `CUST${i + 1000}`,
        customerName: `Customer ${i + 1}`,
        segment: ['Champions', 'Loyal', 'Potential', 'New', 'At Risk'][Math.floor(Math.random() * 5)],
        currentCLV: actualLifetimeValue,
        predictedCLV: actualLifetimeValue * (1.2 + Math.random() * 0.8),
        actualLifetimeValue,
        acquisitionDate,
        lastPurchaseDate: subDays(new Date(), Math.floor(Math.random() * 90)),
        totalOrders,
        avgOrderValue,
        purchaseFrequency: totalOrders / Math.max(monthsSinceAcquisition, 1),
        retentionProbability: Math.max(0.1, 0.9 - (Math.random() * 0.8)),
        churnRisk: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        monthlyValues: Array.from({ length: Math.min(monthsSinceAcquisition, 12) }, (_, j) => ({
          month: format(addMonths(acquisitionDate, j), 'MMM yyyy'),
          value: (actualLifetimeValue / monthsSinceAcquisition) * (1 + j * 0.1) * (0.8 + Math.random() * 0.4),
          orders: Math.floor(Math.random() * 3) + 1
        }))
      };
    })
  , []);

  // Calculate metrics
  const metrics: CLVMetrics = useMemo(() => {
    const totalCLV = clvData.reduce((sum, customer) => sum + customer.currentCLV, 0);
    const avgCLV = totalCLV / clvData.length;
    const sortedCLVs = clvData.map(c => c.currentCLV).sort((a, b) => a - b);
    const medianCLV = sortedCLVs[Math.floor(sortedCLVs.length / 2)];
    const cac = 150; // Mock customer acquisition cost
    
    return {
      totalCLV,
      avgCLV,
      medianCLV,
      cac,
      clvCacRatio: avgCLV / cac,
      paybackPeriod: 6, // Mock payback period
      retentionRate: 0.82,
      churnRate: 0.18
    };
  }, [clvData]);

  // CLV distribution data
  const clvDistribution = useMemo(() => {
    const ranges = [
      { label: '$0-1K', min: 0, max: 1000 },
      { label: '$1K-5K', min: 1000, max: 5000 },
      { label: '$5K-10K', min: 5000, max: 10000 },
      { label: '$10K-20K', min: 10000, max: 20000 },
      { label: '$20K+', min: 20000, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: clvData.filter(c => c.currentCLV >= range.min && c.currentCLV < range.max).length,
      value: clvData
        .filter(c => c.currentCLV >= range.min && c.currentCLV < range.max)
        .reduce((sum, c) => sum + c.currentCLV, 0)
    }));
  }, [clvData]);

  // Cohort analysis
  const cohorts: CLVCohort[] = useMemo(() => {
    const cohortMap = new Map<string, CLVData[]>();
    
    clvData.forEach(customer => {
      const cohortKey = format(customer.acquisitionDate, 'MMM yyyy');
      if (!cohortMap.has(cohortKey)) {
        cohortMap.set(cohortKey, []);
      }
      cohortMap.get(cohortKey)!.push(customer);
    });

    return Array.from(cohortMap.entries()).map(([cohort, customers]) => ({
      cohort,
      size: customers.length,
      avgCLV: customers.reduce((sum, c) => sum + c.currentCLV, 0) / customers.length,
      retentionRate: customers.filter(c => c.retentionProbability > 0.5).length / customers.length,
      monthlyValues: Array.from({ length: 12 }, (_, month) => {
        const retainedCustomers = customers.filter(c => {
          const monthsSinceAcquisition = Math.floor(
            (new Date().getTime() - c.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
          return monthsSinceAcquisition >= month;
        });
        
        return {
          month: month + 1,
          retainedCustomers: retainedCustomers.length,
          revenue: retainedCustomers.reduce((sum, c) => sum + (c.currentCLV / 12), 0),
          avgCLV: retainedCustomers.length > 0 
            ? retainedCustomers.reduce((sum, c) => sum + c.currentCLV, 0) / retainedCustomers.length 
            : 0
        };
      })
    })).slice(-6); // Last 6 cohorts
  }, [clvData]);

  // CLV trends over time
  const clvTrends = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return format(date, 'MMM yyyy');
    });

    return months.map(month => {
      const monthCustomers = clvData.filter(c => 
        c.monthlyValues.some(mv => mv.month === month)
      );
      
      return {
        month,
        avgCLV: monthCustomers.length > 0 
          ? monthCustomers.reduce((sum, c) => sum + c.currentCLV, 0) / monthCustomers.length 
          : 0,
        totalRevenue: monthCustomers.reduce((sum, c) => sum + c.currentCLV, 0),
        customerCount: monthCustomers.length,
        newCustomers: monthCustomers.filter(c => 
          format(c.acquisitionDate, 'MMM yyyy') === month
        ).length
      };
    });
  }, [clvData]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getChurnRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getChurnRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <Minus className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const exportData = {
    title: 'Customer Lifetime Value Analysis',
    subtitle: 'CLV metrics, predictions, and cohort analysis',
    data: clvData,
    dateRange: { from: format(subMonths(new Date(), 12), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    summary: [
      { label: 'Average CLV', value: formatCurrency(metrics.avgCLV) },
      { label: 'CLV:CAC Ratio', value: `${metrics.clvCacRatio.toFixed(1)}:1` },
      { label: 'Retention Rate', value: `${(metrics.retentionRate * 100).toFixed(1)}%` },
      { label: 'Total CLV', value: formatCurrency(metrics.totalCLV) }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Lifetime Value</h2>
          <p className="text-gray-600">Analyze customer value and predict future revenue</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="24m">Last 24 months</option>
          </select>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'cohorts', label: 'Cohorts', icon: Users },
              { key: 'predictions', label: 'Predictions', icon: TrendingUp },
              { key: 'segments', label: 'Segments', icon: Target }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewMode(key as any)}
                className={`px-4 py-2 text-sm font-medium flex items-center space-x-2 ${
                  viewMode === key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <ExportButton exportData={exportData} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {[
          {
            label: 'Average CLV',
            value: formatCurrency(metrics.avgCLV),
            change: '+12.3%',
            trend: 'up',
            icon: DollarSign,
            color: 'blue'
          },
          {
            label: 'CLV:CAC Ratio',
            value: `${metrics.clvCacRatio.toFixed(1)}:1`,
            change: '+0.8',
            trend: 'up',
            icon: Target,
            color: 'green'
          },
          {
            label: 'Payback Period',
            value: `${metrics.paybackPeriod} months`,
            change: '-0.5 mo',
            trend: 'up',
            icon: Clock,
            color: 'purple'
          },
          {
            label: 'Retention Rate',
            value: `${(metrics.retentionRate * 100).toFixed(1)}%`,
            change: '+2.1%',
            trend: 'up',
            icon: Users,
            color: 'orange'
          },
          {
            label: 'Total CLV',
            value: formatCurrency(metrics.totalCLV),
            change: '+18.7%',
            trend: 'up',
            icon: Award,
            color: 'indigo'
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
                <span className={`text-sm font-medium flex items-center ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.trend === 'up' ? (
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                  )}
                  {metric.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                <p className="text-sm text-gray-600">{metric.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CLV Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CLV Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={clvTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'avgCLV' ? formatCurrency(value) : value,
                      name === 'avgCLV' ? 'Avg CLV' : 'Customer Count'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avgCLV" 
                    stroke="#3B82F6" 
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    name="avgCLV"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CLV Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CLV Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clvDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [value, 'Customers']} />
                  <Bar dataKey="count" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Current vs Predicted CLV */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current vs Predicted CLV</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={clvData.slice(0, 50)} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="currentCLV" 
                    name="Current CLV"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    label={{ value: 'Current CLV', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="predictedCLV" 
                    name="Predicted CLV"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    label={{ value: 'Predicted CLV', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      formatCurrency(value),
                      name === 'currentCLV' ? 'Current CLV' : 'Predicted CLV'
                    ]}
                  />
                  <Scatter name="Customers" data={clvData.slice(0, 50)} fill="#10B981" />
                  <ReferenceLine y={0} stroke="#374151" strokeDasharray="2 2" />
                  <ReferenceLine x={0} stroke="#374151" strokeDasharray="2 2" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top CLV Customers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top CLV Customers</h3>
            <div className="space-y-4">
              {clvData
                .sort((a, b) => b.currentCLV - a.currentCLV)
                .slice(0, 8)
                .map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.customerName}</p>
                        <p className="text-xs text-gray-500">{customer.segment}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatCurrency(customer.currentCLV)}
                      </p>
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChurnRiskColor(customer.churnRisk)}`}>
                        {getChurnRiskIcon(customer.churnRisk)}
                        <span className="ml-1 capitalize">{customer.churnRisk} risk</span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'cohorts' && (
        <div className="space-y-6">
          {/* Cohort Overview */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cohort</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Size</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Avg CLV</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Retention</th>
                    {Array.from({ length: 6 }, (_, i) => (
                      <th key={i} className="text-center py-3 px-2 font-medium text-gray-900">
                        M{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cohorts.map((cohort) => (
                    <tr key={cohort.cohort} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{cohort.cohort}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{cohort.size}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{formatCurrency(cohort.avgCLV)}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {(cohort.retentionRate * 100).toFixed(0)}%
                      </td>
                      {cohort.monthlyValues.slice(0, 6).map((month, index) => (
                        <td key={index} className="py-3 px-2 text-center text-sm">
                          <div className={`py-1 px-2 rounded text-xs font-medium ${
                            month.retainedCustomers / cohort.size > 0.8 ? 'bg-green-100 text-green-800' :
                            month.retainedCustomers / cohort.size > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            month.retainedCustomers / cohort.size > 0.4 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {((month.retainedCustomers / cohort.size) * 100).toFixed(0)}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cohort CLV Evolution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort CLV Evolution</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[1, 12]} 
                    dataKey="month"
                    label={{ value: 'Months Since Acquisition', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(value), 'Avg CLV']}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend />
                  {cohorts.map((cohort, index) => (
                    <Line
                      key={cohort.cohort}
                      type="monotone"
                      data={cohort.monthlyValues}
                      dataKey="avgCLV"
                      stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                      strokeWidth={2}
                      name={cohort.cohort}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'predictions' && (
        <div className="space-y-6">
          {/* Prediction Accuracy */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prediction Accuracy</p>
                  <p className="text-2xl font-bold text-gray-900">87.3%</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Model confidence score</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Prediction Horizon</p>
                  <p className="text-2xl font-bold text-gray-900">24 months</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Forward-looking period</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Model Updates</p>
                  <p className="text-2xl font-bold text-gray-900">Weekly</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Refresh frequency</p>
            </div>
          </div>

          {/* CLV Prediction Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CLV Predictions by Segment</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={clvData
                    .reduce((acc, customer) => {
                      const existing = acc.find(item => item.segment === customer.segment);
                      if (existing) {
                        existing.currentCLV += customer.currentCLV;
                        existing.predictedCLV += customer.predictedCLV;
                        existing.count += 1;
                      } else {
                        acc.push({
                          segment: customer.segment,
                          currentCLV: customer.currentCLV,
                          predictedCLV: customer.predictedCLV,
                          count: 1
                        });
                      }
                      return acc;
                    }, [] as any[])
                    .map(item => ({
                      segment: item.segment,
                      currentCLV: item.currentCLV / item.count,
                      predictedCLV: item.predictedCLV / item.count,
                      uplift: ((item.predictedCLV - item.currentCLV) / item.currentCLV) * 100
                    }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      formatCurrency(value),
                      name === 'currentCLV' ? 'Current CLV' : 'Predicted CLV'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="currentCLV" fill="#6B7280" name="Current CLV" />
                  <Bar dataKey="predictedCLV" fill="#3B82F6" name="Predicted CLV" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* High-Risk Customers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Risk High-Value Customers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current CLV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predicted CLV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clvData
                    .filter(c => c.churnRisk === 'high' && c.currentCLV > 5000)
                    .sort((a, b) => b.currentCLV - a.currentCLV)
                    .slice(0, 10)
                    .map((customer) => (
                      <tr key={customer.customerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{customer.customerName}</div>
                          <div className="text-sm text-gray-500">{customer.customerId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.currentCLV)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.predictedCLV)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getChurnRiskColor(customer.churnRisk)}`}>
                            {getChurnRiskIcon(customer.churnRisk)}
                            <span className="ml-1 capitalize">{customer.churnRisk} risk</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(customer.lastPurchaseDate, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button variant="outline" size="sm">
                            Create Campaign
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'segments' && (
        <div className="space-y-6">
          {/* Segment CLV Comparison */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">CLV by Customer Segment</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={clvData
                    .reduce((acc, customer) => {
                      const existing = acc.find(item => item.segment === customer.segment);
                      if (existing) {
                        existing.totalCLV += customer.currentCLV;
                        existing.customers += 1;
                      } else {
                        acc.push({
                          segment: customer.segment,
                          totalCLV: customer.currentCLV,
                          customers: 1
                        });
                      }
                      return acc;
                    }, [] as any[])
                    .map(item => ({
                      segment: item.segment,
                      avgCLV: item.totalCLV / item.customers,
                      totalCLV: item.totalCLV,
                      customers: item.customers
                    }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="segment" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Average CLV']} />
                  <Area 
                    type="monotone" 
                    dataKey="avgCLV" 
                    stroke="#8B5CF6" 
                    fill="#8B5CF6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Segment Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['Champions', 'Loyal', 'Potential', 'New', 'At Risk'].map(segment => {
              const segmentData = clvData.filter(c => c.segment === segment);
              const avgCLV = segmentData.reduce((sum, c) => sum + c.currentCLV, 0) / segmentData.length;
              const totalRevenue = segmentData.reduce((sum, c) => sum + c.currentCLV, 0);
              
              return (
                <div key={segment} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{segment}</h4>
                    <span className="text-sm text-gray-500">{segmentData.length} customers</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Average CLV</p>
                      <p className="text-xl font-bold text-gray-900">{formatCurrency(avgCLV)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Total Revenue</p>
                      <p className="text-lg font-semibold text-gray-900">{formatCurrency(totalRevenue)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">Avg Order Value</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCurrency(segmentData.reduce((sum, c) => sum + c.avgOrderValue, 0) / segmentData.length)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="w-full">
                      View Segment Details
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}