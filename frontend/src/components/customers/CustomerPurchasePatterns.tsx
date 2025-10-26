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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart
} from 'recharts';
import {
  ShoppingCart,
  TrendingUp,
  Calendar,
  Clock,
  Package,
  DollarSign,
  Users,
  Target,
  Repeat,
  Star,
  Filter,
  Eye,
  BarChart3,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from 'date-fns';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';

interface Purchase {
  id: string;
  customerId: string;
  customerName: string;
  customerSegment: string;
  date: Date;
  amount: number;
  products: Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unitPrice: number;
  }>;
  paymentMethod: string;
  channel: 'online' | 'phone' | 'email';
  seasonality: 'spring' | 'summer' | 'fall' | 'winter';
}

interface PurchasePattern {
  customerId: string;
  frequency: number; // purchases per month
  averageOrderValue: number;
  totalSpent: number;
  daysBetweenPurchases: number;
  preferredCategories: string[];
  preferredPaymentMethod: string;
  seasonality: Record<string, number>;
  purchaseTiming: Record<string, number>; // hour of day preferences
  loyaltyScore: number;
  churnRisk: 'low' | 'medium' | 'high';
}

interface SeasonalityData {
  season: string;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  topCategory: string;
}

export default function CustomerPurchasePatterns() {
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedSegment, setSelectedSegment] = useState('all');
  const [viewMode, setViewMode] = useState<'overview' | 'seasonality' | 'frequency' | 'categories'>('overview');

  // Mock purchase data
  const purchases: Purchase[] = useMemo(() => {
    const customerNames = Array.from({ length: 150 }, (_, i) => `Customer ${i + 1}`);
    const segments = ['Champions', 'Loyal', 'Potential', 'New', 'At Risk'];
    const categories = ['Broodstock', 'Feed', 'Equipment', 'Health', 'Monitoring'];
    const products = categories.flatMap(cat => 
      Array.from({ length: 5 }, (_, i) => ({ category: cat, name: `${cat} Product ${i + 1}` }))
    );
    const paymentMethods = ['Credit Card', 'Bank Transfer', 'PayPal', 'Check'];
    const channels: Purchase['channel'][] = ['online', 'phone', 'email'];
    const seasons: Purchase['seasonality'][] = ['spring', 'summer', 'fall', 'winter'];

    return Array.from({ length: 800 }, (_, i) => {
      const date = subDays(new Date(), Math.floor(Math.random() * 365));
      const customerId = `CUST${Math.floor(Math.random() * 150) + 1}`;
      const numProducts = Math.floor(Math.random() * 5) + 1;
      const purchaseProducts = Array.from({ length: numProducts }, () => {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 10) + 1;
        const unitPrice = Math.floor(Math.random() * 500) + 50;
        return {
          id: `prod_${Math.random().toString(36).substr(2, 9)}`,
          name: product.name,
          category: product.category,
          quantity,
          unitPrice
        };
      });

      const amount = purchaseProducts.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
      const month = date.getMonth();
      const season = month < 3 ? 'winter' : month < 6 ? 'spring' : month < 9 ? 'summer' : 'fall';

      return {
        id: `purchase_${i}`,
        customerId,
        customerName: customerNames[parseInt(customerId.replace('CUST', '')) - 1],
        customerSegment: segments[Math.floor(Math.random() * segments.length)],
        date,
        amount,
        products: purchaseProducts,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        channel: channels[Math.floor(Math.random() * channels.length)],
        seasonality: season
      };
    });
  }, []);

  // Calculate purchase patterns for each customer
  const purchasePatterns: PurchasePattern[] = useMemo(() => {
    const customerData = new Map<string, Purchase[]>();
    
    purchases.forEach(purchase => {
      if (!customerData.has(purchase.customerId)) {
        customerData.set(purchase.customerId, []);
      }
      customerData.get(purchase.customerId)!.push(purchase);
    });

    return Array.from(customerData.entries()).map(([customerId, customerPurchases]) => {
      const sortedPurchases = customerPurchases.sort((a, b) => a.date.getTime() - b.date.getTime());
      const totalSpent = customerPurchases.reduce((sum, p) => sum + p.amount, 0);
      const avgOrderValue = totalSpent / customerPurchases.length;
      
      // Calculate days between purchases
      const daysBetween = sortedPurchases.length > 1 
        ? sortedPurchases.slice(1).map((purchase, index) => 
            differenceInDays(purchase.date, sortedPurchases[index].date)
          )
        : [];
      const avgDaysBetween = daysBetween.length > 0 
        ? daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length 
        : 0;

      // Calculate frequency (purchases per month)
      const daysSinceFirst = differenceInDays(new Date(), sortedPurchases[0].date);
      const frequency = (customerPurchases.length / Math.max(daysSinceFirst / 30, 1));

      // Get preferred categories
      const categoryCount = new Map<string, number>();
      customerPurchases.forEach(purchase => {
        purchase.products.forEach(product => {
          categoryCount.set(product.category, (categoryCount.get(product.category) || 0) + product.quantity);
        });
      });
      const preferredCategories = Array.from(categoryCount.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([category]) => category);

      // Payment method preference
      const paymentCount = new Map<string, number>();
      customerPurchases.forEach(purchase => {
        paymentCount.set(purchase.paymentMethod, (paymentCount.get(purchase.paymentMethod) || 0) + 1);
      });
      const preferredPaymentMethod = Array.from(paymentCount.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Credit Card';

      // Seasonality analysis
      const seasonality = customerPurchases.reduce((acc, purchase) => {
        acc[purchase.seasonality] = (acc[purchase.seasonality] || 0) + purchase.amount;
        return acc;
      }, {} as Record<string, number>);

      // Purchase timing (hour preferences)
      const purchaseTiming = customerPurchases.reduce((acc, purchase) => {
        const hour = purchase.date.getHours();
        const timeSlot = hour < 6 ? 'early_morning' : 
                       hour < 12 ? 'morning' : 
                       hour < 18 ? 'afternoon' : 'evening';
        acc[timeSlot] = (acc[timeSlot] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate loyalty score (0-100)
      const recencyScore = Math.max(0, 100 - (differenceInDays(new Date(), sortedPurchases[sortedPurchases.length - 1].date) * 2));
      const frequencyScore = Math.min(100, frequency * 20);
      const monetaryScore = Math.min(100, (totalSpent / 1000) * 10);
      const loyaltyScore = (recencyScore + frequencyScore + monetaryScore) / 3;

      // Determine churn risk
      const daysSinceLastPurchase = differenceInDays(new Date(), sortedPurchases[sortedPurchases.length - 1].date);
      const churnRisk: 'low' | 'medium' | 'high' = 
        daysSinceLastPurchase <= 30 ? 'low' :
        daysSinceLastPurchase <= 90 ? 'medium' : 'high';

      return {
        customerId,
        frequency,
        averageOrderValue: avgOrderValue,
        totalSpent,
        daysBetweenPurchases: avgDaysBetween,
        preferredCategories,
        preferredPaymentMethod,
        seasonality,
        purchaseTiming,
        loyaltyScore,
        churnRisk
      };
    });
  }, [purchases]);

  // Aggregate data for charts
  const monthlyPurchaseData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i);
      return format(date, 'MMM yyyy');
    });

    return months.map(month => {
      const monthPurchases = purchases.filter(p => 
        format(p.date, 'MMM yyyy') === month
      );
      
      return {
        month,
        revenue: monthPurchases.reduce((sum, p) => sum + p.amount, 0),
        orders: monthPurchases.length,
        customers: new Set(monthPurchases.map(p => p.customerId)).size,
        avgOrderValue: monthPurchases.length > 0 
          ? monthPurchases.reduce((sum, p) => sum + p.amount, 0) / monthPurchases.length 
          : 0
      };
    });
  }, [purchases]);

  // Seasonality analysis
  const seasonalityData: SeasonalityData[] = useMemo(() => {
    const seasons = ['spring', 'summer', 'fall', 'winter'];
    
    return seasons.map(season => {
      const seasonPurchases = purchases.filter(p => p.seasonality === season);
      const revenue = seasonPurchases.reduce((sum, p) => sum + p.amount, 0);
      const orders = seasonPurchases.length;
      
      // Get top category for this season
      const categoryRevenue = new Map<string, number>();
      seasonPurchases.forEach(purchase => {
        purchase.products.forEach(product => {
          const catRevenue = product.quantity * product.unitPrice;
          categoryRevenue.set(product.category, (categoryRevenue.get(product.category) || 0) + catRevenue);
        });
      });
      const topCategory = Array.from(categoryRevenue.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

      return {
        season,
        revenue,
        orders,
        avgOrderValue: orders > 0 ? revenue / orders : 0,
        topCategory
      };
    });
  }, [purchases]);

  // Frequency distribution
  const frequencyDistribution = useMemo(() => {
    const ranges = [
      { label: '0-1/month', min: 0, max: 1 },
      { label: '1-2/month', min: 1, max: 2 },
      { label: '2-4/month', min: 2, max: 4 },
      { label: '4+/month', min: 4, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: purchasePatterns.filter(p => p.frequency >= range.min && p.frequency < range.max).length,
      avgSpend: purchasePatterns
        .filter(p => p.frequency >= range.min && p.frequency < range.max)
        .reduce((sum, p) => sum + p.totalSpent, 0) / 
        Math.max(purchasePatterns.filter(p => p.frequency >= range.min && p.frequency < range.max).length, 1)
    }));
  }, [purchasePatterns]);

  // Category preference analysis
  const categoryPreferences = useMemo(() => {
    const categories = ['Broodstock', 'Feed', 'Equipment', 'Health', 'Monitoring'];
    
    return categories.map(category => {
      const categoryPurchases = purchases.filter(p => 
        p.products.some(prod => prod.category === category)
      );
      const revenue = categoryPurchases.reduce((sum, p) => 
        sum + p.products
          .filter(prod => prod.category === category)
          .reduce((prodSum, prod) => prodSum + (prod.quantity * prod.unitPrice), 0), 0
      );
      
      return {
        category,
        revenue,
        orders: categoryPurchases.length,
        customers: new Set(categoryPurchases.map(p => p.customerId)).size,
        avgOrderValue: categoryPurchases.length > 0 ? revenue / categoryPurchases.length : 0
      };
    });
  }, [purchases]);

  // Purchase timing analysis
  const timingAnalysis = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, hour) => {
      const hourPurchases = purchases.filter(p => p.date.getHours() === hour);
      return {
        hour,
        label: `${hour}:00`,
        orders: hourPurchases.length,
        revenue: hourPurchases.reduce((sum, p) => sum + p.amount, 0)
      };
    });

    return hours;
  }, [purchases]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const exportData = {
    title: 'Customer Purchase Pattern Analysis',
    subtitle: 'Purchase behavior, seasonality, and pattern insights',
    data: purchases,
    dateRange: { from: format(subMonths(new Date(), 12), 'yyyy-MM-dd'), to: format(new Date(), 'yyyy-MM-dd') },
    summary: [
      { label: 'Total Orders', value: purchases.length.toLocaleString() },
      { label: 'Total Revenue', value: formatCurrency(purchases.reduce((sum, p) => sum + p.amount, 0)) },
      { label: 'Avg Frequency', value: `${(purchasePatterns.reduce((sum, p) => sum + p.frequency, 0) / purchasePatterns.length).toFixed(1)}/month` },
      { label: 'Avg Days Between', value: `${(purchasePatterns.reduce((sum, p) => sum + p.daysBetweenPurchases, 0) / purchasePatterns.length).toFixed(0)} days` }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Purchase Patterns</h2>
          <p className="text-gray-600">Analyze purchasing behavior and identify trends</p>
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
              { key: 'overview', label: 'Overview', icon: BarChart3 },
              { key: 'seasonality', label: 'Seasonality', icon: Calendar },
              { key: 'frequency', label: 'Frequency', icon: Repeat },
              { key: 'categories', label: 'Categories', icon: Package }
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
            label: 'Avg Purchase Frequency',
            value: `${(purchasePatterns.reduce((sum, p) => sum + p.frequency, 0) / purchasePatterns.length).toFixed(1)}/mo`,
            change: '+8.3%',
            trend: 'up',
            icon: Repeat,
            color: 'blue'
          },
          {
            label: 'Avg Days Between Orders',
            value: `${(purchasePatterns.reduce((sum, p) => sum + p.daysBetweenPurchases, 0) / purchasePatterns.length).toFixed(0)} days`,
            change: '-2.5 days',
            trend: 'up',
            icon: Clock,
            color: 'green'
          },
          {
            label: 'Repeat Purchase Rate',
            value: `${((purchasePatterns.filter(p => p.frequency > 1).length / purchasePatterns.length) * 100).toFixed(1)}%`,
            change: '+3.2%',
            trend: 'up',
            icon: Target,
            color: 'purple'
          },
          {
            label: 'Avg Loyalty Score',
            value: `${(purchasePatterns.reduce((sum, p) => sum + p.loyaltyScore, 0) / purchasePatterns.length).toFixed(0)}/100`,
            change: '+5.8',
            trend: 'up',
            icon: Star,
            color: 'orange'
          },
          {
            label: 'High-Risk Customers',
            value: `${((purchasePatterns.filter(p => p.churnRisk === 'high').length / purchasePatterns.length) * 100).toFixed(1)}%`,
            change: '-1.2%',
            trend: 'up',
            icon: Activity,
            color: 'red'
          }
        ].map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-lg bg-${metric.color}-100`}>
                  <Icon className={`h-6 w-6 text-${metric.color}-600`} />
                </div>
                <span className={`text-sm font-medium ${
                  metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
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
          {/* Monthly Purchase Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Purchase Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyPurchaseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="orders" fill="#3B82F6" name="Orders" />
                  <Line yAxisId="right" type="monotone" dataKey="avgOrderValue" stroke="#10B981" strokeWidth={2} name="Avg Order Value" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Purchase Timing (24-hour) */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Timing by Hour</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timingAnalysis} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="orders" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Frequency vs Spend Correlation */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequency vs Total Spend</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart data={purchasePatterns} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    dataKey="frequency" 
                    name="Frequency"
                    label={{ value: 'Purchase Frequency (per month)', position: 'insideBottom', offset: -10 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="totalSpent" 
                    name="Total Spent"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    label={{ value: 'Total Spent', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: any) => [
                      name === 'frequency' ? `${value.toFixed(1)}/month` : formatCurrency(value),
                      name === 'frequency' ? 'Frequency' : 'Total Spent'
                    ]}
                  />
                  <Scatter name="Customers" data={purchasePatterns} fill="#F59E0B" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Loyalty Score Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loyalty Score Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { range: '0-20', count: purchasePatterns.filter(p => p.loyaltyScore >= 0 && p.loyaltyScore < 20).length },
                    { range: '20-40', count: purchasePatterns.filter(p => p.loyaltyScore >= 20 && p.loyaltyScore < 40).length },
                    { range: '40-60', count: purchasePatterns.filter(p => p.loyaltyScore >= 40 && p.loyaltyScore < 60).length },
                    { range: '60-80', count: purchasePatterns.filter(p => p.loyaltyScore >= 60 && p.loyaltyScore < 80).length },
                    { range: '80-100', count: purchasePatterns.filter(p => p.loyaltyScore >= 80 && p.loyaltyScore <= 100).length }
                  ]}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'seasonality' && (
        <div className="space-y-6">
          {/* Seasonal Revenue Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Revenue Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={seasonalityData as any}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="revenue"
                    >
                      {seasonalityData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Performance Metrics</h3>
              <div className="space-y-4">
                {seasonalityData.map((season, index) => (
                  <div key={season.season} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-4 h-4 rounded-full`}
                          style={{ backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4] }}
                        />
                        <span className="font-medium text-gray-900 capitalize">{season.season}</span>
                      </div>
                      <span className="text-sm text-gray-500">{season.orders} orders</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Revenue</p>
                        <p className="font-medium">{formatCurrency(season.revenue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Order</p>
                        <p className="font-medium">{formatCurrency(season.avgOrderValue)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Top Category</p>
                        <p className="font-medium">{season.topCategory}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Customer Seasonal Preferences */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Seasonal Spending Patterns</h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={seasonalityData.map(season => ({
                  season: season.season,
                  revenue: (season.revenue / 1000), // Scale for readability
                  orders: season.orders,
                  avgOrderValue: (season.avgOrderValue / 100) // Scale for readability
                }))}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="season" className="capitalize" />
                  <PolarRadiusAxis />
                  <Radar name="Revenue (K)" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  <Radar name="Orders" dataKey="orders" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                  <Radar name="AOV (100s)" dataKey="avgOrderValue" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Seasonal Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPurchaseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: any) => [formatCurrency(value), 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366F1" fill="#6366F1" fillOpacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'frequency' && (
        <div className="space-y-6">
          {/* Frequency Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Purchase Frequency Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Spend by Frequency</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value: any) => [formatCurrency(value), 'Avg Spend']} />
                    <Bar dataKey="avgSpend" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* High-Value Customers by Risk */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">High-Value Customers by Churn Risk</h3>
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
                      Frequency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Days Between Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loyalty Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Churn Risk
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Top Category
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {purchasePatterns
                    .filter(p => p.totalSpent > 2000)
                    .sort((a, b) => b.totalSpent - a.totalSpent)
                    .slice(0, 10)
                    .map((pattern) => (
                      <tr key={pattern.customerId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {pattern.customerId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(pattern.totalSpent)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pattern.frequency.toFixed(1)}/month
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pattern.daysBetweenPurchases.toFixed(0)} days
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pattern.loyaltyScore.toFixed(0)}/100
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRiskColor(pattern.churnRisk)}`}>
                            {pattern.churnRisk}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {pattern.preferredCategories[0] || 'N/A'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Frequency Trends Over Time */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Frequency Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyPurchaseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="customers" stroke="#3B82F6" strokeWidth={2} name="Active Customers" />
                  <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} name="Total Orders" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'categories' && (
        <div className="space-y-6">
          {/* Category Performance */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={categoryPreferences} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue" />
                  <Line yAxisId="right" type="monotone" dataKey="customers" stroke="#10B981" strokeWidth={2} name="Unique Customers" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Deep Dive */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryPreferences.map((category, index) => (
              <div key={category.category} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{category.category}</h4>
                  <Package className="h-6 w-6 text-gray-400" />
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(category.revenue)}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Orders</p>
                      <p className="text-lg font-semibold text-gray-900">{category.orders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Customers</p>
                      <p className="text-lg font-semibold text-gray-900">{category.customers}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Avg Order Value</p>
                    <p className="text-lg font-semibold text-gray-900">{formatCurrency(category.avgOrderValue)}</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="w-full">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Cross-Category Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Category Preferences</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Top Category Combinations</h4>
                <div className="space-y-3">
                  {Array.from({ length: 5 }, (_, i) => {
                    const combo = ['Broodstock + Feed', 'Equipment + Health', 'Feed + Monitoring', 'Broodstock + Equipment', 'Health + Monitoring'][i];
                    const customers = Math.floor(Math.random() * 30) + 10;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{combo}</span>
                        <span className="text-sm text-gray-600">{customers} customers</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Category Loyalty</h4>
                <div className="space-y-3">
                  {categoryPreferences.map((category) => {
                    const loyaltyRate = Math.random() * 40 + 40; // 40-80%
                    return (
                      <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-900">{category.category}</span>
                        <span className="text-sm text-gray-600">{loyaltyRate.toFixed(1)}% loyal</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}