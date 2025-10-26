'use client';

import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  Package, 
  TrendingDown,
  Eye,
  ShoppingCart,
  Calendar
} from 'lucide-react';
import { formatDate, formatNumber } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface StockAlert {
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  location: string;
  alertType: 'critical' | 'warning' | 'info';
  alertCategory: 'low_stock' | 'overstock' | 'expiring' | 'out_of_stock';
  description: string;
  estimatedRunout: string;
  lastRestocked: string;
  priority: 'high' | 'medium' | 'low';
}

const mockStockAlerts: StockAlert[] = [
  {
    id: '1',
    itemId: 'FEED-001',
    itemName: 'Premium Shrimp Feed (2mm)',
    category: 'Feed',
    currentStock: 85,
    minThreshold: 500,
    maxThreshold: 2000,
    unit: 'kg',
    location: 'Warehouse A',
    alertType: 'critical',
    alertCategory: 'low_stock',
    description: 'Stock level critically low - immediate reorder required',
    estimatedRunout: '2025-01-18T00:00:00Z',
    lastRestocked: '2025-01-10T00:00:00Z',
    priority: 'high',
  },
  {
    id: '2',
    itemId: 'MED-003',
    itemName: 'Probiotic Supplement',
    category: 'Medication',
    currentStock: 0,
    minThreshold: 50,
    maxThreshold: 200,
    unit: 'bottles',
    location: 'Medical Storage',
    alertType: 'critical',
    alertCategory: 'out_of_stock',
    description: 'Item completely out of stock',
    estimatedRunout: '2025-01-15T00:00:00Z',
    lastRestocked: '2025-01-05T00:00:00Z',
    priority: 'high',
  },
  {
    id: '3',
    itemId: 'EQUIP-012',
    itemName: 'Water Quality Test Kit',
    category: 'Equipment',
    currentStock: 180,
    minThreshold: 200,
    maxThreshold: 500,
    unit: 'kits',
    location: 'Lab Storage',
    alertType: 'warning',
    alertCategory: 'low_stock',
    description: 'Stock approaching minimum threshold',
    estimatedRunout: '2025-01-25T00:00:00Z',
    lastRestocked: '2025-01-08T00:00:00Z',
    priority: 'medium',
  },
  {
    id: '4',
    itemId: 'CHEM-005',
    itemName: 'pH Buffer Solution',
    category: 'Chemicals',
    currentStock: 25,
    minThreshold: 30,
    maxThreshold: 100,
    unit: 'liters',
    location: 'Chemical Storage',
    alertType: 'warning',
    alertCategory: 'expiring',
    description: 'Items expiring within 30 days',
    estimatedRunout: '2025-02-15T00:00:00Z',
    lastRestocked: '2024-12-20T00:00:00Z',
    priority: 'medium',
  },
  {
    id: '5',
    itemId: 'FEED-004',
    itemName: 'Artemia Nauplii (Frozen)',
    category: 'Feed',
    currentStock: 2200,
    minThreshold: 300,
    maxThreshold: 800,
    unit: 'packs',
    location: 'Freezer Unit B',
    alertType: 'info',
    alertCategory: 'overstock',
    description: 'Stock level exceeds maximum threshold',
    estimatedRunout: '2025-03-10T00:00:00Z',
    lastRestocked: '2025-01-12T00:00:00Z',
    priority: 'low',
  },
];

export default function StockAlerts() {
  const [filter, setFilter] = React.useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [selectedAlert, setSelectedAlert] = React.useState<StockAlert | null>(null);

  const filteredAlerts = React.useMemo(() => {
    if (filter === 'all') return mockStockAlerts;
    return mockStockAlerts.filter(alert => alert.alertType === filter);
  }, [filter]);

  const getAlertIcon = (category: string) => {
    switch (category) {
      case 'low_stock': return <TrendingDown className="h-4 w-4" />;
      case 'out_of_stock': return <AlertTriangle className="h-4 w-4" />;
      case 'expiring': return <Clock className="h-4 w-4" />;
      case 'overstock': return <Package className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-200 text-red-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-700';
      default: return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return colors[priority as keyof typeof colors] || colors.low;
  };

  const criticalCount = mockStockAlerts.filter(a => a.alertType === 'critical').length;
  const warningCount = mockStockAlerts.filter(a => a.alertType === 'warning').length;
  const infoCount = mockStockAlerts.filter(a => a.alertType === 'info').length;

  if (filteredAlerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <Package className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-green-800">All Stock Levels Normal</h3>
            <p className="text-sm text-green-700">No inventory alerts or low stock issues detected.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Stock Alerts</h3>
            <p className="text-sm text-gray-500">Inventory alerts and low stock notifications</p>
          </div>
        </div>

        {/* Alert Type Filters */}
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['all', 'critical', 'warning', 'info'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  filter === type
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== 'all' && (
                  <span className="ml-1 text-xs">
                    ({type === 'critical' ? criticalCount : type === 'warning' ? warningCount : infoCount})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-900">{criticalCount}</p>
              <p className="text-xs text-red-600">Immediate action required</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Warning Alerts</p>
              <p className="text-2xl font-bold text-yellow-900">{warningCount}</p>
              <p className="text-xs text-yellow-600">Monitor closely</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Info Alerts</p>
              <p className="text-2xl font-bold text-blue-900">{infoCount}</p>
              <p className="text-xs text-blue-600">For information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert List */}
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`border rounded-lg p-4 ${getAlertColor(alert.alertType)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className={getIconColor(alert.alertType)}>
                  {getAlertIcon(alert.alertCategory)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{alert.itemName}</h4>
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(alert.priority)}`}>
                      {alert.priority}
                    </span>
                    <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                      {alert.itemId}
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="font-medium">Current:</span> {formatNumber(alert.currentStock)} {alert.unit}
                    </div>
                    <div>
                      <span className="font-medium">Min:</span> {formatNumber(alert.minThreshold)} {alert.unit}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {alert.location}
                    </div>
                    <div>
                      <span className="font-medium">Category:</span> {alert.category}
                    </div>
                  </div>
                  {alert.estimatedRunout && alert.alertCategory !== 'overstock' && (
                    <div className="mt-2 text-xs">
                      <span className="font-medium">Est. runout:</span> {formatDate(alert.estimatedRunout, 'relative')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSelectedAlert(alert)}
                  className="text-current hover:bg-white hover:bg-opacity-20"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {(alert.alertCategory === 'low_stock' || alert.alertCategory === 'out_of_stock') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-current hover:bg-white hover:bg-opacity-20"
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
        <Button variant="outline" size="sm">
          Export Report
        </Button>
        <Button variant="outline" size="sm">
          Configure Thresholds
        </Button>
        <Button size="sm">
          Bulk Reorder
        </Button>
      </div>
    </div>
  );
}