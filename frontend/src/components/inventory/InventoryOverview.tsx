'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { 
  Package, 
  TrendingDown, 
  AlertTriangle,
  Clock,
  DollarSign,
  ShoppingCart,
  Boxes,
  Target
} from 'lucide-react';
import { formatCurrency, formatNumber, getChartColor, chartColors } from '@/lib/utils';

export default function InventoryOverview() {
  // Mock inventory data
  const inventoryStats = React.useMemo(() => ({
    totalItems: 342,
    totalValue: 285000,
    lowStockItems: 23,
    outOfStockItems: 5,
    overstockItems: 8,
    avgTurnoverRate: 4.2,
    totalCategories: 8,
    pendingOrders: 12,
    deliveriesThisWeek: 6,
    warehouseUtilization: 78,
  }), []);

  const categoryData = React.useMemo(() => [
    { category: 'Feed', value: 125000, items: 45, percentage: 44 },
    { category: 'Medication', value: 78000, items: 28, percentage: 27 },
    { category: 'Equipment', value: 52000, items: 67, percentage: 18 },
    { category: 'Chemicals', value: 18000, items: 34, percentage: 6 },
    { category: 'Supplies', value: 12000, items: 168, percentage: 4 },
  ], []);

  const stockLevelData = React.useMemo(() => [
    { level: 'Healthy', count: 306, color: chartColors.success },
    { level: 'Low Stock', count: 23, color: chartColors.warning },
    { level: 'Critical', count: 8, color: chartColors.error },
    { level: 'Out of Stock', count: 5, color: chartColors.gray },
  ], []);

  const turnoverTrendData = React.useMemo(() => {
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        month: new Date(2024, i, 1).toLocaleDateString('en-US', { month: 'short' }),
        turnoverRate: 3.5 + Math.sin(i / 2) * 0.8 + (Math.random() * 0.4 - 0.2),
        orderValue: 15000 + Math.sin(i / 3) * 5000 + (Math.random() * 2000 - 1000),
        stockLevel: 85 + Math.sin(i / 4) * 10 + (Math.random() * 5 - 2.5),
      });
    }
    return data;
  }, []);

  const reorderAnalysis = React.useMemo(() => [
    { item: 'Premium Shrimp Feed (2mm)', currentStock: 85, reorderPoint: 500, daysUntilReorder: 3, priority: 'high' },
    { item: 'Water Quality Test Kits', currentStock: 180, reorderPoint: 200, daysUntilReorder: 7, priority: 'medium' },
    { item: 'Probiotic Supplement', currentStock: 0, reorderPoint: 50, daysUntilReorder: 0, priority: 'critical' },
    { item: 'pH Buffer Solution', currentStock: 25, reorderPoint: 30, daysUntilReorder: 5, priority: 'medium' },
    { item: 'Oxygen Tablets', currentStock: 340, reorderPoint: 400, daysUntilReorder: 14, priority: 'low' },
  ], []);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {
                entry.name.includes('Value') ? formatCurrency(entry.value) :
                entry.name.includes('Rate') ? entry.value.toFixed(1) :
                entry.value
              }
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Items</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Value</p>
              <p className="text-lg font-bold text-gray-900">{formatCurrency(inventoryStats.totalValue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingDown className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Low Stock</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Out of Stock</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.outOfStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Turnover</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.avgTurnoverRate}x</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Boxes className="h-5 w-5 text-indigo-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Categories</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.totalCategories}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <ShoppingCart className="h-5 w-5 text-cyan-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Pending Orders</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.pendingOrders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Deliveries</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.deliveriesThisWeek}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-pink-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Overstock</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.overstockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <Target className="h-5 w-5 text-emerald-600 mr-2" />
            <div>
              <p className="text-xs text-gray-600 font-medium">Utilization</p>
              <p className="text-lg font-bold text-gray-900">{inventoryStats.warehouseUtilization}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by Category */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Value by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(value), 'Value']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Level Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Level Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockLevelData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="level" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[2, 2, 0, 0]}>
                  {stockLevelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Turnover Trends */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Trends (12 Months)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={turnoverTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="turnover" stroke="#6b7280" fontSize={12} />
                <YAxis yAxisId="value" orientation="right" stroke="#6b7280" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  yAxisId="turnover"
                  type="monotone"
                  dataKey="turnoverRate"
                  stroke={chartColors.primary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.primary, strokeWidth: 2, r: 4 }}
                  name="Turnover Rate"
                />
                <Line
                  yAxisId="value"
                  type="monotone"
                  dataKey="orderValue"
                  stroke={chartColors.secondary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.secondary, strokeWidth: 2, r: 4 }}
                  name="Order Value"
                />
                <Line
                  yAxisId="turnover"
                  type="monotone"
                  dataKey="stockLevel"
                  stroke={chartColors.tertiary}
                  strokeWidth={2}
                  dot={{ fill: chartColors.tertiary, strokeWidth: 2, r: 4 }}
                  name="Stock Level %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reorder Analysis Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reorder Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reorder Point
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days Until Reorder
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reorderAnalysis.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {item.item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(item.currentStock)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(item.reorderPoint)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.daysUntilReorder === 0 ? 'Now' : `${item.daysUntilReorder} days`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                      {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                    </span>
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