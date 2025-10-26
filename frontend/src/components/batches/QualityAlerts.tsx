'use client';

import React from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  Thermometer, 
  Droplets, 
  Activity,
  Clock,
  TrendingDown,
  Eye
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface QualityAlert {
  id: string;
  batchId: string;
  batchName: string;
  alertType: 'critical' | 'warning' | 'info';
  category: 'health' | 'environment' | 'feeding' | 'growth' | 'mortality';
  title: string;
  description: string;
  value: number;
  threshold: number;
  unit: string;
  timestamp: string;
  resolved: boolean;
}

const mockAlerts: QualityAlert[] = [
  {
    id: '1',
    batchId: 'B-2025-001',
    batchName: 'White Shrimp PL15 - Tank A1',
    alertType: 'critical',
    category: 'health',
    title: 'High Mortality Rate Detected',
    description: 'Mortality rate has exceeded acceptable threshold',
    value: 8.5,
    threshold: 5.0,
    unit: '%',
    timestamp: '2025-01-15T10:30:00Z',
    resolved: false,
  },
  {
    id: '2',
    batchId: 'B-2025-003',
    batchName: 'Tiger Shrimp PL20 - Tank C2',
    alertType: 'warning',
    category: 'environment',
    title: 'Water Temperature Below Optimal',
    description: 'Water temperature is below recommended range',
    value: 26.2,
    threshold: 28.0,
    unit: '°C',
    timestamp: '2025-01-15T09:15:00Z',
    resolved: false,
  },
  {
    id: '3',
    batchId: 'B-2025-005',
    batchName: 'White Shrimp PL25 - Tank E1',
    alertType: 'warning',
    category: 'growth',
    title: 'Slow Growth Rate',
    description: 'Growth rate is below expected for this stage',
    value: 0.8,
    threshold: 1.2,
    unit: 'mm/day',
    timestamp: '2025-01-15T08:45:00Z',
    resolved: false,
  },
  {
    id: '4',
    batchId: 'B-2025-002',
    batchName: 'Giant Prawn PL18 - Tank B3',
    alertType: 'info',
    category: 'feeding',
    title: 'Feeding Schedule Reminder',
    description: 'Next feeding cycle due in 30 minutes',
    value: 0.5,
    threshold: 1.0,
    unit: 'hours',
    timestamp: '2025-01-15T07:30:00Z',
    resolved: false,
  },
];

export default function QualityAlerts() {
  const [selectedAlert, setSelectedAlert] = React.useState<QualityAlert | null>(null);
  const [filter, setFilter] = React.useState<'all' | 'critical' | 'warning' | 'info'>('all');

  const filteredAlerts = React.useMemo(() => {
    if (filter === 'all') return mockAlerts;
    return mockAlerts.filter(alert => alert.alertType === filter);
  }, [filter]);

  const getAlertIcon = (type: string, category: string) => {
    if (type === 'critical') return <AlertTriangle className="h-4 w-4" />;
    if (type === 'warning') return <AlertCircle className="h-4 w-4" />;
    
    switch (category) {
      case 'health': return <Activity className="h-4 w-4" />;
      case 'environment': return <Thermometer className="h-4 w-4" />;
      case 'feeding': return <Clock className="h-4 w-4" />;
      case 'growth': return <TrendingDown className="h-4 w-4" />;
      case 'mortality': return <AlertTriangle className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
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

  const criticalCount = mockAlerts.filter(a => a.alertType === 'critical').length;
  const warningCount = mockAlerts.filter(a => a.alertType === 'warning').length;
  const infoCount = mockAlerts.filter(a => a.alertType === 'info').length;

  if (filteredAlerts.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
          <div>
            <h3 className="text-sm font-medium text-green-800">All Systems Normal</h3>
            <p className="text-sm text-green-700">No quality alerts or issues detected across all batches.</p>
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
            <h3 className="text-lg font-semibold text-gray-900">Quality Alerts</h3>
            <p className="text-sm text-gray-500">Real-time monitoring of batch health and quality</p>
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

      {/* Alert Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-red-800">Critical Alerts</p>
              <p className="text-2xl font-bold text-red-900">{criticalCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Warning Alerts</p>
              <p className="text-2xl font-bold text-yellow-900">{warningCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
            <div>
              <p className="text-sm font-medium text-blue-800">Info Alerts</p>
              <p className="text-2xl font-bold text-blue-900">{infoCount}</p>
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
                  {getAlertIcon(alert.alertType, alert.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium">{alert.title}</h4>
                    <span className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded-full">
                      {alert.batchId}
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                  <div className="flex items-center space-x-4 text-xs">
                    <span><strong>Batch:</strong> {alert.batchName}</span>
                    <span><strong>Value:</strong> {alert.value}{alert.unit}</span>
                    <span><strong>Threshold:</strong> {alert.threshold}{alert.unit}</span>
                    <span><strong>Time:</strong> {formatDate(alert.timestamp, 'relative')}</span>
                  </div>
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t">
        <Button variant="outline" size="sm">
          View All Alerts
        </Button>
        <Button variant="outline" size="sm">
          Export Report
        </Button>
        <Button size="sm">
          Configure Alerts
        </Button>
      </div>
    </div>
  );
}