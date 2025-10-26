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
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import {
  Users,
  UserMinus,
  UserPlus,
  TrendingUp,
  TrendingDown,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Heart,
  Award,
  Zap,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';
import { format, subMonths, subDays, differenceInDays, addMonths, startOfMonth } from 'date-fns';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';

interface CustomerCohort {
  cohortMonth: string;
  cohortSize: number;
  retentionData: Array<{
    month: number;
    retainedCustomers: number;
    retentionRate: number;
    revenue: number;
  }>;
}

interface RetentionMetrics {
  overallRetentionRate: number;
  churnRate: number;
  averageLifespan: number; // months
  customerLifetimeValue: number;
  newCustomers: number;
  churnedCustomers: number;
  reactivatedCustomers: number;
  netRetention: number;
}

interface CustomerLifecycle {
  customerId: string;
  acquisitionDate: Date;
  status: 'active' | 'churned' | 'at_risk' | 'reactivated';
  lastPurchaseDate: Date;
  totalOrders: number;
  totalSpent: number;
  predictedChurnDate?: Date;
  churnProbability: number;
  lifetimeMonths: number;
}

export default function CustomerRetentionMetrics() {
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'cohorts' | 'churn' | 'lifecycle'>('overview');

  // Mock customer lifecycle data
  const customerLifecycles: CustomerLifecycle[] = useMemo(() => 
    Array.from({ length: 200 }, (_, i) => {
      const acquisitionDate = subMonths(new Date(), Math.floor(Math.random() * 24));
      const lastPurchaseDate = subDays(new Date(), Math.floor(Math.random() * 180));
      const lifetimeMonths = Math.floor((new Date().getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const daysSinceLastPurchase = differenceInDays(new Date(), lastPurchaseDate);
      
      let status: CustomerLifecycle['status'];
      let churnProbability: number;
      
      if (daysSinceLastPurchase > 180) {
        status = 'churned';
        churnProbability = 0.95;
      } else if (daysSinceLastPurchase > 90) {
        status = 'at_risk';
        churnProbability = 0.7;
      } else if (daysSinceLastPurchase < 7) {
        status = 'active';
        churnProbability = 0.1;
      } else {
        status = Math.random() > 0.8 ? 'reactivated' : 'active';
        churnProbability = 0.3;
      }

      return {
        customerId: `CUST${i + 1000}`,
        acquisitionDate,
        status,
        lastPurchaseDate,
        totalOrders: Math.floor(Math.random() * 20) + 1,
        totalSpent: Math.floor(Math.random() * 10000) + 500,
        churnProbability,
        lifetimeMonths,
        predictedChurnDate: churnProbability > 0.5 ? addMonths(new Date(), Math.floor(Math.random() * 6) + 1) : undefined
      };
    })
  , []);

  // Calculate retention metrics
  const retentionMetrics: RetentionMetrics = useMemo(() => {
    const totalCustomers = customerLifecycles.length;
    const activeCustomers = customerLifecycles.filter(c => c.status === 'active' || c.status === 'reactivated').length;
    const churnedCustomers = customerLifecycles.filter(c => c.status === 'churned').length;
    const newCustomers = customerLifecycles.filter(c => 
      differenceInDays(new Date(), c.acquisitionDate) <= 30
    ).length;
    const reactivatedCustomers = customerLifecycles.filter(c => c.status === 'reactivated').length;

    const avgLifespan = customerLifecycles.reduce((sum, c) => sum + c.lifetimeMonths, 0) / totalCustomers;
    const avgCLV = customerLifecycles.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers;

    return {
      overallRetentionRate: (activeCustomers / totalCustomers) * 100,
      churnRate: (churnedCustomers / totalCustomers) * 100,
      averageLifespan: avgLifespan,
      customerLifetimeValue: avgCLV,
      newCustomers,
      churnedCustomers,
      reactivatedCustomers,
      netRetention: ((activeCustomers + reactivatedCustomers - churnedCustomers) / totalCustomers) * 100
    };
  }, [customerLifecycles]);

  // Generate cohort analysis data
  const cohortData: CustomerCohort[] = useMemo(() => {
    const cohorts = new Map<string, CustomerLifecycle[]>();
    
    // Group customers by acquisition month
    customerLifecycles.forEach(customer => {
      const cohortMonth = format(customer.acquisitionDate, 'MMM yyyy');
      if (!cohorts.has(cohortMonth)) {
        cohorts.set(cohortMonth, []);
      }
      cohorts.get(cohortMonth)!.push(customer);
    });

    // Calculate retention for each cohort
    return Array.from(cohorts.entries()).map(([cohortMonth, customers]) => {
      const cohortSize = customers.length;
      const retentionData = Array.from({ length: 12 }, (_, monthIndex) => {
        const month = monthIndex + 1;
        const retainedCustomers = customers.filter(customer => {
          const monthsSinceAcquisition = Math.floor(
            (new Date().getTime() - customer.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
          );
          return monthsSinceAcquisition >= month && customer.status !== 'churned';
        });

        return {
          month,
          retainedCustomers: retainedCustomers.length,
          retentionRate: (retainedCustomers.length / cohortSize) * 100,
          revenue: retainedCustomers.reduce((sum, c) => sum + c.totalSpent, 0)
        };
      });

      return {
        cohortMonth,
        cohortSize,
        retentionData
      };
    }).slice(-6); // Last 6 cohorts
  }, [customerLifecycles]);

  // Monthly retention trends
  const monthlyRetentionTrends = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return format(date, 'MMM yyyy');
    });

    return months.map(month => {
      const monthStart = startOfMonth(subMonths(new Date(), 11 - months.indexOf(month)));
      const existingCustomers = customerLifecycles.filter(c => c.acquisitionDate < monthStart);
      const activeInMonth = existingCustomers.filter(c => 
        c.lastPurchaseDate >= monthStart && c.status !== 'churned'
      );
      const churnedInMonth = existingCustomers.filter(c => 
        c.status === 'churned' && 
        c.lastPurchaseDate < monthStart &&
        c.lastPurchaseDate >= subMonths(monthStart, 1)
      );

      return {
        month,
        retentionRate: existingCustomers.length > 0 ? (activeInMonth.length / existingCustomers.length) * 100 : 0,
        churnRate: existingCustomers.length > 0 ? (churnedInMonth.length / existingCustomers.length) * 100 : 0,
        existingCustomers: existingCustomers.length,
        activeCustomers: activeInMonth.length,
        churnedCustomers: churnedInMonth.length
      };
    });
  }, [customerLifecycles]);

  // Churn prediction data
  const churnPredictions = useMemo(() => {
    const riskLevels = {
      low: customerLifecycles.filter(c => c.churnProbability <= 0.3).length,
      medium: customerLifecycles.filter(c => c.churnProbability > 0.3 && c.churnProbability <= 0.7).length,
      high: customerLifecycles.filter(c => c.churnProbability > 0.7).length
    };

    return [
      { risk: 'Low Risk', count: riskLevels.low, color: '#10B981' },
      { risk: 'Medium Risk', count: riskLevels.medium, color: '#F59E0B' },
      { risk: 'High Risk', count: riskLevels.high, color: '#EF4444' }
    ];
  }, [customerLifecycles]);

  // Customer status distribution
  const statusDistribution = useMemo(() => {
    const statuses = ['active', 'churned', 'at_risk', 'reactivated'];
    return statuses.map(status => ({
      status,
      count: customerLifecycles.filter(c => c.status === status).length,
      percentage: (customerLifecycles.filter(c => c.status === status).length / customerLifecycles.length) * 100
    }));
  }, [customerLifecycles]);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'churned': return 'text-red-600 bg-red-100';
      case 'at_risk': return 'text-yellow-600 bg-yellow-100';
      case 'reactivated': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const exportData = {
    title: 'Customer Retention Analysis',
    subtitle: 'Retention metrics, cohort analysis, and churn predictions',
    data: customerLifecycles,
    dateRange: { from: format(subMonths(new Date(), 12), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    summary: [
      { label: 'Retention Rate', value: formatPercentage(retentionMetrics.overallRetentionRate) },
      { label: 'Churn Rate', value: formatPercentage(retentionMetrics.churnRate) },
      { label: 'Avg Lifespan', value: `${retentionMetrics.averageLifespan.toFixed(1)} months` },
      { label: 'Avg CLV', value: formatCurrency(retentionMetrics.customerLifetimeValue) }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Retention Metrics</h2>
          <p className="text-gray-600">Track retention, analyze churn, and predict customer behavior</p>
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
              { key: 'overview', label: 'Overview', icon: Activity },
              { key: 'cohorts', label: 'Cohorts', icon: Users },
              { key: 'churn', label: 'Churn', icon: UserMinus },
              { key: 'lifecycle', label: 'Lifecycle', icon: Clock }
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
            label: 'Retention Rate',
            value: formatPercentage(retentionMetrics.overallRetentionRate),
            change: '+2.3%',
            trend: 'up',
            icon: Users,
            color: 'green'
          },
          {
            label: 'Churn Rate',
            value: formatPercentage(retentionMetrics.churnRate),
            change: '-1.1%',
            trend: 'up',
            icon: UserMinus,
            color: 'red'
          },
          {
            label: 'Avg Lifespan',
            value: `${retentionMetrics.averageLifespan.toFixed(1)}mo`,
            change: '+0.8mo',
            trend: 'up',
            icon: Clock,
            color: 'blue'
          },
          {
            label: 'Net Retention',
            value: formatPercentage(retentionMetrics.netRetention),
            change: '+4.2%',
            trend: 'up',
            icon: Target,
            color: 'purple'
          },
          {
            label: 'Avg CLV',
            value: formatCurrency(retentionMetrics.customerLifetimeValue),
            change: '+12.5%',
            trend: 'up',
            icon: Award,
            color: 'orange'
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
          {/* Retention vs Churn Trend */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Retention vs Churn Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyRetentionTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => [`${value.toFixed(1)}%`, '']} />
                  <Legend />
                  <Line type="monotone" dataKey="retentionRate" stroke="#10B981" strokeWidth={3} name="Retention Rate" />
                  <Line type="monotone" dataKey="churnRate" stroke="#EF4444" strokeWidth={3} name="Churn Rate" />
                  <ReferenceLine y={80} stroke="#6B7280" strokeDasharray="2 2" label="Target: 80%" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Customer Status Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Status Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={['#10B981', '#EF4444', '#F59E0B', '#3B82F6'][index % 4]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any, name: any, props: any) => [
                    `${value} (${props.payload.percentage.toFixed(1)}%)`,
                    props.payload.status
                  ]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Churn Risk Prediction */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Risk Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={churnPredictions} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="risk" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count">
                    {churnPredictions.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Customer Flow */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Customer Flow</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyRetentionTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="activeCustomers" fill="#10B981" name="Active Customers" />
                  <Bar dataKey="churnedCustomers" fill="#EF4444" name="Churned Customers" />
                  <Line type="monotone" dataKey="existingCustomers" stroke="#3B82F6" strokeWidth={2} name="Total Customers" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'cohorts' && (
        <div className="space-y-6">
          {/* Cohort Retention Heatmap */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Retention Analysis</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Cohort</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Size</th>
                    {Array.from({ length: 6 }, (_, i) => (
                      <th key={i} className="text-center py-3 px-2 font-medium text-gray-900">
                        M{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cohortData.map((cohort) => (
                    <tr key={cohort.cohortMonth} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{cohort.cohortMonth}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">{cohort.cohortSize}</td>
                      {cohort.retentionData.slice(0, 6).map((month, index) => (
                        <td key={index} className="py-3 px-2 text-center text-sm">
                          <div className={`py-1 px-2 rounded text-xs font-medium ${
                            month.retentionRate > 80 ? 'bg-green-100 text-green-800' :
                            month.retentionRate > 60 ? 'bg-yellow-100 text-yellow-800' :
                            month.retentionRate > 40 ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {month.retentionRate.toFixed(0)}%
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cohort Revenue Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cohort Revenue Evolution</h3>
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
                    formatter={(value: any) => [formatCurrency(value), 'Revenue']}
                    labelFormatter={(label) => `Month ${label}`}
                  />
                  <Legend />
                  {cohortData.map((cohort, index) => (
                    <Line
                      key={cohort.cohortMonth}
                      type="monotone"
                      data={cohort.retentionData}
                      dataKey="revenue"
                      stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                      strokeWidth={2}
                      name={cohort.cohortMonth}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cohort Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cohortData.map((cohort, index) => (
              <div key={cohort.cohortMonth} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{cohort.cohortMonth}</h4>
                  <span className="text-sm text-gray-500">{cohort.cohortSize} customers</span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">6-Month Retention</p>
                    <p className="text-xl font-bold text-gray-900">
                      {cohort.retentionData[5]?.retentionRate.toFixed(1) || '0'}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(cohort.retentionData.reduce((sum, month) => sum + month.revenue, 0))}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Avg Revenue per Customer</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(
                        cohort.retentionData.reduce((sum, month) => sum + month.revenue, 0) / cohort.cohortSize
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setSelectedCohort(cohort.cohortMonth)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'churn' && (
        <div className="space-y-6">
          {/* Churn Prediction Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Predicted Churners</p>
                  <p className="text-2xl font-bold text-red-600">
                    {customerLifecycles.filter(c => c.churnProbability > 0.7).length}
                  </p>
                </div>
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">High-risk customers</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue at Risk</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(
                      customerLifecycles
                        .filter(c => c.churnProbability > 0.7)
                        .reduce((sum, c) => sum + c.totalSpent, 0)
                    )}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">From high-risk customers</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Days to Churn</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Math.round(
                      customerLifecycles
                        .filter(c => c.predictedChurnDate)
                        .reduce((sum, c) => sum + differenceInDays(c.predictedChurnDate!, new Date()), 0) /
                      customerLifecycles.filter(c => c.predictedChurnDate).length
                    )}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Predicted timeline</p>
            </div>
          </div>

          {/* Churn Risk vs Customer Value */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Churn Risk vs Customer Value</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={customerLifecycles} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="totalSpent" 
                    name="Total Spent"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    label={{ value: 'Customer Value', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="churnProbability" 
                    name="Churn Probability"
                    tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                    label={{ value: 'Churn Probability', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'totalSpent' ? formatCurrency(value) : `${(value * 100).toFixed(1)}%`,
                      name === 'totalSpent' ? 'Customer Value' : 'Churn Probability'
                    ]}
                  />
                  <Scatter name="Customers" data={customerLifecycles} fill="#EF4444" />
                  <ReferenceLine x={5000} stroke="#6B7280" strokeDasharray="2 2" label="High Value" />
                  <ReferenceLine y={0.7} stroke="#6B7280" strokeDasharray="2 2" label="High Risk" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* High-Risk Customers Table */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Risk Customer Priority List</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Churn Probability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Predicted Churn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerLifecycles
                    .filter(c => c.churnProbability > 0.7)
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 10)
                    .map((customer) => (
                      <tr key={customer.customerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {customer.customerId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full" 
                                style={{ width: `${customer.churnProbability * 100}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-900">
                              {(customer.churnProbability * 100).toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(customer.lastPurchaseDate, 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {customer.predictedChurnDate ? format(customer.predictedChurnDate, 'MMM dd, yyyy') : 'N/A'}
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

      {viewMode === 'lifecycle' && (
        <div className="space-y-6">
          {/* Customer Lifecycle Stages */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Lifecycle Distribution</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { status: 'active', label: 'Active', icon: CheckCircle, color: 'green' },
                { status: 'at_risk', label: 'At Risk', icon: AlertTriangle, color: 'yellow' },
                { status: 'churned', label: 'Churned', icon: UserMinus, color: 'red' },
                { status: 'reactivated', label: 'Reactivated', icon: UserPlus, color: 'blue' }
              ].map(({ status, label, icon: Icon, color }) => {
                const count = customerLifecycles.filter(c => c.status === status).length;
                const percentage = (count / customerLifecycles.length) * 100;
                
                return (
                  <div key={status} className="text-center">
                    <div className={`mx-auto w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mb-3`}>
                      <Icon className={`h-8 w-8 text-${color}-600`} />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">{label}</h4>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                    <p className="text-sm text-gray-500">{percentage.toFixed(1)}%</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Lifespan Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Lifespan Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { range: '0-3 months', count: customerLifecycles.filter(c => c.lifetimeMonths <= 3).length },
                    { range: '3-6 months', count: customerLifecycles.filter(c => c.lifetimeMonths > 3 && c.lifetimeMonths <= 6).length },
                    { range: '6-12 months', count: customerLifecycles.filter(c => c.lifetimeMonths > 6 && c.lifetimeMonths <= 12).length },
                    { range: '12-24 months', count: customerLifecycles.filter(c => c.lifetimeMonths > 12 && c.lifetimeMonths <= 24).length },
                    { range: '24+ months', count: customerLifecycles.filter(c => c.lifetimeMonths > 24).length }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6366F1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reactivation Opportunities */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Reactivation Opportunities</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Since Last Purchase
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reactivation Potential
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {customerLifecycles
                    .filter(c => c.status === 'churned' && c.totalSpent > 1000)
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 8)
                    .map((customer) => {
                      const daysSinceLastPurchase = differenceInDays(new Date(), customer.lastPurchaseDate);
                      const reactivationPotential = Math.max(0, 100 - (daysSinceLastPurchase / 365) * 100);
                      
                      return (
                        <tr key={customer.customerId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {customer.customerId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(customer.status)}`}>
                              {customer.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(customer.totalSpent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {daysSinceLastPurchase} days
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className="bg-blue-500 h-2 rounded-full" 
                                  style={{ width: `${reactivationPotential}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-900">
                                {reactivationPotential.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="outline" size="sm">
                              Win-Back Campaign
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}