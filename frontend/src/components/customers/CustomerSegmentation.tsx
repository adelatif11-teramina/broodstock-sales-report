'use client';

import React, { useState, useMemo } from 'react';
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
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  Legend,
  ReferenceLine
} from 'recharts';
import {
  Users,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Target,
  UserCheck,
  Award,
  Filter,
  Download,
  RefreshCw,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  count: number;
  percentage: number;
  averageValue: number;
  totalRevenue: number;
  avgOrderFrequency: number;
  retentionRate: number;
  growth: number;
  color: string;
  characteristics: string[];
  recommendations: string[];
}

interface CustomerData {
  id: string;
  name: string;
  segment: string;
  lifetimeValue: number;
  totalOrders: number;
  lastOrderDate: Date;
  joinDate: Date;
  avgOrderValue: number;
  frequency: number;
  status: 'active' | 'at_risk' | 'inactive';
  location: string;
  preferredProducts: string[];
}

export default function CustomerSegmentation() {
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('12m');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'trends'>('overview');

  // Mock customer segments data
  const segments: CustomerSegment[] = useMemo(() => [
    {
      id: 'champions',
      name: 'Champions',
      description: 'High value, frequent buyers with strong loyalty',
      count: 45,
      percentage: 12.5,
      averageValue: 15400,
      totalRevenue: 693000,
      avgOrderFrequency: 8.2,
      retentionRate: 95,
      growth: 23,
      color: '#10B981',
      characteristics: [
        'High lifetime value (>$10K)',
        'Frequent orders (>6 per year)',
        'Recent purchases (<30 days)',
        'High order values',
        'Long customer tenure'
      ],
      recommendations: [
        'VIP treatment and exclusive offers',
        'Early access to new products',
        'Loyalty program benefits',
        'Personal account management'
      ]
    },
    {
      id: 'loyal_customers',
      name: 'Loyal Customers',
      description: 'Regular buyers with good frequency and value',
      count: 89,
      percentage: 24.7,
      averageValue: 8200,
      totalRevenue: 729800,
      avgOrderFrequency: 5.4,
      retentionRate: 85,
      growth: 15,
      color: '#3B82F6',
      characteristics: [
        'Good lifetime value ($5K-$10K)',
        'Regular order frequency',
        'Consistent purchase behavior',
        'Moderate order values'
      ],
      recommendations: [
        'Upsell premium products',
        'Encourage referrals',
        'Cross-sell complementary items',
        'Maintain engagement'
      ]
    },
    {
      id: 'potential_loyalists',
      name: 'Potential Loyalists',
      description: 'Recent customers with high potential',
      count: 112,
      percentage: 31.1,
      averageValue: 4800,
      totalRevenue: 537600,
      avgOrderFrequency: 3.2,
      retentionRate: 72,
      growth: 45,
      color: '#8B5CF6',
      characteristics: [
        'Recent customers (<6 months)',
        'Growing purchase frequency',
        'Above average order values',
        'Showing engagement patterns'
      ],
      recommendations: [
        'Nurture with targeted content',
        'Incentivize repeat purchases',
        'Build relationship',
        'Educational content'
      ]
    },
    {
      id: 'new_customers',
      name: 'New Customers',
      description: 'Recent first-time buyers',
      count: 67,
      percentage: 18.6,
      averageValue: 1200,
      totalRevenue: 80400,
      avgOrderFrequency: 1.0,
      retentionRate: 45,
      growth: 78,
      color: '#06B6D4',
      characteristics: [
        'First purchase within 3 months',
        'Single or few orders',
        'Learning about products',
        'Evaluating service quality'
      ],
      recommendations: [
        'Welcome series campaigns',
        'Product education',
        'Customer support',
        'Follow-up communications'
      ]
    },
    {
      id: 'at_risk',
      name: 'At Risk',
      description: 'Previously active customers showing decline',
      count: 34,
      percentage: 9.4,
      averageValue: 6800,
      totalRevenue: 231200,
      avgOrderFrequency: 2.1,
      retentionRate: 35,
      growth: -25,
      color: '#F59E0B',
      characteristics: [
        'Declining order frequency',
        'Longer time since last order',
        'Previously good customers',
        'Reduced engagement'
      ],
      recommendations: [
        'Re-engagement campaigns',
        'Special offers and discounts',
        'Customer feedback surveys',
        'Personal outreach'
      ]
    },
    {
      id: 'hibernating',
      name: 'Hibernating',
      description: 'Inactive customers who may return',
      count: 13,
      percentage: 3.6,
      averageValue: 3400,
      totalRevenue: 44200,
      avgOrderFrequency: 0.2,
      retentionRate: 15,
      growth: -45,
      color: '#EF4444',
      characteristics: [
        'No recent orders (>6 months)',
        'Previously active customers',
        'May have switched providers',
        'Low engagement'
      ],
      recommendations: [
        'Win-back campaigns',
        'Significant incentives',
        'Product updates',
        'Market research'
      ]
    }
  ], []);

  const totalCustomers = segments.reduce((sum, segment) => sum + segment.count, 0);
  const totalRevenue = segments.reduce((sum, segment) => sum + segment.totalRevenue, 0);

  // Mock trend data
  const segmentTrends = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return format(date, 'MMM yyyy');
    });

    return months.map(month => ({
      month,
      champions: Math.floor(30 + Math.random() * 30),
      loyal_customers: Math.floor(60 + Math.random() * 40),
      potential_loyalists: Math.floor(80 + Math.random() * 50),
      new_customers: Math.floor(40 + Math.random() * 40),
      at_risk: Math.floor(20 + Math.random() * 20),
      hibernating: Math.floor(5 + Math.random() * 15)
    }));
  }, []);

  // RFM Analysis data
  const rfmData = useMemo(() => 
    Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      recency: Math.floor(Math.random() * 365) + 1,
      frequency: Math.floor(Math.random() * 20) + 1,
      monetary: Math.floor(Math.random() * 20000) + 500,
      segment: segments[Math.floor(Math.random() * segments.length)].id
    }))
  , [segments]);

  const getSegmentColor = (segmentId: string) => {
    return segments.find(s => s.id === segmentId)?.color || '#6B7280';
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const exportData = {
    title: 'Customer Segmentation Analysis',
    subtitle: 'Customer behavior analysis and segmentation insights',
    data: segments,
    dateRange: { from: format(subMonths(new Date(), 12), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    summary: [
      { label: 'Total Customers', value: totalCustomers.toLocaleString() },
      { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
      { label: 'Champions Rate', value: formatPercentage(segments[0].percentage) },
      { label: 'At Risk Rate', value: formatPercentage(segments.find(s => s.id === 'at_risk')?.percentage || 0) }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Segmentation</h2>
          <p className="text-gray-600">Analyze customer behavior patterns and segments</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="3m">Last 3 months</option>
            <option value="6m">Last 6 months</option>
            <option value="12m">Last 12 months</option>
            <option value="24m">Last 24 months</option>
          </select>
          <div className="flex border border-gray-300 rounded-lg overflow-hidden">
            {[
              { key: 'overview', label: 'Overview', icon: Eye },
              { key: 'detailed', label: 'Detailed', icon: MoreHorizontal },
              { key: 'trends', label: 'Trends', icon: TrendingUp }
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

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: 'Total Customers',
            value: totalCustomers.toLocaleString(),
            change: '+12.5%',
            trend: 'up',
            icon: Users,
            color: 'blue'
          },
          {
            label: 'Total Revenue',
            value: formatCurrency(totalRevenue),
            change: '+18.3%',
            trend: 'up',
            icon: DollarSign,
            color: 'green'
          },
          {
            label: 'Avg CLV',
            value: formatCurrency(totalRevenue / totalCustomers),
            change: '+5.2%',
            trend: 'up',
            icon: Target,
            color: 'purple'
          },
          {
            label: 'Retention Rate',
            value: '78.5%',
            change: '+2.1%',
            trend: 'up',
            icon: UserCheck,
            color: 'orange'
          }
        ].map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-${kpi.color}-100`}>
                  <Icon className={`h-6 w-6 text-${kpi.color}-600`} />
                </div>
                <span className={`text-sm font-medium ${
                  kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change}
                </span>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                <p className="text-sm text-gray-600">{kpi.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {viewMode === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Segment Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Segment Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={segments as any}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="count"
                    onClick={(data) => setSelectedSegment(data.id)}
                  >
                    {segments.map((segment, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={segment.color}
                        stroke={selectedSegment === segment.id ? '#374151' : 'none'}
                        strokeWidth={selectedSegment === segment.id ? 2 : 0}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [
                      `${value} customers (${props.payload.percentage}%)`,
                      props.payload.name
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue by Segment */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Segment</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segments} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                  <Bar 
                    dataKey="totalRevenue" 
                    fill="#3B82F6"
                    onClick={(data) => setSelectedSegment(data.id || null)}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'detailed' && (
        <div className="space-y-6">
          {/* RFM Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">RFM Analysis</h3>
            <p className="text-sm text-gray-600 mb-6">Recency, Frequency, and Monetary analysis of customer behavior</p>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={rfmData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="frequency" 
                    name="Frequency"
                    label={{ value: 'Purchase Frequency', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="monetary" 
                    name="Monetary"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    label={{ value: 'Monetary Value', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: any, name: any) => [
                      name === 'frequency' ? `${value} orders` : formatCurrency(value),
                      name === 'frequency' ? 'Frequency' : 'Monetary Value'
                    ]}
                  />
                  {segments.map((segment) => (
                    <Scatter
                      key={segment.id}
                      name={segment.name}
                      data={rfmData.filter(d => d.segment === segment.id)}
                      fill={segment.color}
                    />
                  ))}
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Segment Details Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Segment Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Segment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg CLV
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Retention Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Growth
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {segments.map((segment) => (
                    <tr key={segment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className="w-4 h-4 rounded-full mr-3"
                            style={{ backgroundColor: segment.color }}
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{segment.name}</div>
                            <div className="text-sm text-gray-500">{segment.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{segment.count}</div>
                        <div className="text-sm text-gray-500">{formatPercentage(segment.percentage)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(segment.averageValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {segment.avgOrderFrequency.toFixed(1)}/year
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          segment.retentionRate >= 80 ? 'bg-green-100 text-green-800' :
                          segment.retentionRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatPercentage(segment.retentionRate)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center text-sm font-medium ${
                          segment.growth >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <TrendingUp className={`h-4 w-4 mr-1 ${segment.growth < 0 ? 'rotate-180' : ''}`} />
                          {segment.growth >= 0 ? '+' : ''}{segment.growth}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button variant="outline" size="sm">
                          View Details
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

      {viewMode === 'trends' && (
        <div className="space-y-6">
          {/* Segment Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Segment Trends Over Time</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={segmentTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {segments.map((segment) => (
                    <Line
                      key={segment.id}
                      type="monotone"
                      dataKey={segment.id}
                      stroke={segment.color}
                      strokeWidth={2}
                      name={segment.name}
                      dot={{ r: 4 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Growth Rates */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Segment Growth Rates</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segments} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis tickFormatter={(value) => `${value}%`} />
                  <Tooltip formatter={(value: any) => [`${value}%`, 'Growth Rate']} />
                  <ReferenceLine y={0} stroke="#374151" strokeDasharray="2 2" />
                  <Bar 
                    dataKey="growth"
                    fill="#10B981"
                  >
                    {segments.map((segment, index) => (
                      <Cell key={`cell-${index}`} fill={segment.growth >= 0 ? '#10B981' : '#EF4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Selected Segment Details */}
      {selectedSegment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          {(() => {
            const segment = segments.find(s => s.id === selectedSegment);
            if (!segment) return null;

            return (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{segment.name}</h3>
                      <p className="text-gray-600">{segment.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedSegment(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Characteristics</h4>
                    <ul className="space-y-2">
                      {segment.characteristics.map((characteristic, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                          <span className="text-gray-700">{characteristic}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Recommendations</h4>
                    <ul className="space-y-2">
                      {segment.recommendations.map((recommendation, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <Award className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}