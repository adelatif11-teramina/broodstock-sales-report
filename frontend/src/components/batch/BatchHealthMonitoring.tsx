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
  Activity,
  Heart,
  Thermometer,
  Droplets,
  Wind,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Eye,
  Calendar,
  MapPin,
  Stethoscope,
  TestTube,
  Shield,
  Target,
  RefreshCw,
  Download,
  Filter,
  Plus,
  Bell,
  Clock,
  Users,
  Package
} from 'lucide-react';
import { format, subDays, subHours, differenceInDays } from 'date-fns';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';

interface HealthMetric {
  timestamp: Date;
  temperature: number; // Celsius
  oxygenLevel: number; // mg/L
  phLevel: number;
  salinity: number; // ppt
  ammonia: number; // mg/L
  nitrite: number; // mg/L
  nitrate: number; // mg/L
  turbidity: number; // NTU
  mortalityRate: number; // percentage
  feedConversionRatio: number;
  growthRate: number; // percentage
  behaviorScore: number; // 1-10 scale
}

interface BatchHealth {
  batchId: string;
  species: string;
  currentLocation: string;
  quantity: number;
  averageWeight: number;
  age: number; // days
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  overallScore: number; // 0-100
  lastInspection: Date;
  nextInspection: Date;
  metrics: HealthMetric[];
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }>;
  treatments: Array<{
    id: string;
    treatment: string;
    date: Date;
    veterinarian: string;
    dosage: string;
    notes: string;
  }>;
  vaccinations: Array<{
    vaccine: string;
    date: Date;
    veterinarian: string;
    nextDue?: Date;
  }>;
}

interface QualityStandards {
  temperature: { min: number; max: number; optimal: { min: number; max: number } };
  oxygenLevel: { min: number; max: number; optimal: { min: number; max: number } };
  phLevel: { min: number; max: number; optimal: { min: number; max: number } };
  salinity: { min: number; max: number; optimal: { min: number; max: number } };
  ammonia: { max: number; optimal: { max: number } };
  nitrite: { max: number; optimal: { max: number } };
  nitrate: { max: number; optimal: { max: number } };
  mortalityRate: { max: number; warning: number };
}

export default function BatchHealthMonitoring() {
  const [selectedBatch, setSelectedBatch] = useState<string>('BST-2024-001');
  const [timeRange, setTimeRange] = useState('7d');
  const [viewMode, setViewMode] = useState<'overview' | 'metrics' | 'alerts' | 'treatments'>('overview');
  const [selectedMetric, setSelectedMetric] = useState<string>('temperature');

  // Quality standards for Pacific White Shrimp
  const qualityStandards: QualityStandards = {
    temperature: { min: 26, max: 32, optimal: { min: 28, max: 30 } },
    oxygenLevel: { min: 4, max: 12, optimal: { min: 6, max: 8 } },
    phLevel: { min: 7.5, max: 8.5, optimal: { min: 8.0, max: 8.3 } },
    salinity: { min: 15, max: 35, optimal: { min: 20, max: 25 } },
    ammonia: { max: 0.5, optimal: { max: 0.1 } },
    nitrite: { max: 0.5, optimal: { max: 0.1 } },
    nitrate: { max: 40, optimal: { max: 20 } },
    mortalityRate: { max: 5, warning: 2 }
  };

  // Mock health data
  const batchHealthData: BatchHealth[] = useMemo(() => [
    {
      batchId: 'BST-2024-001',
      species: 'Pacific White Shrimp (Litopenaeus vannamei)',
      currentLocation: 'Tank A-15, Building 3',
      quantity: 4850,
      averageWeight: 2.3,
      age: 258,
      healthStatus: 'excellent',
      overallScore: 92,
      lastInspection: subDays(new Date(), 1),
      nextInspection: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metrics: Array.from({ length: 168 }, (_, i) => { // 7 days, hourly data
        const timestamp = subHours(new Date(), 167 - i);
        const hour = timestamp.getHours();
        
        return {
          timestamp,
          temperature: 28.5 + Math.sin(hour * Math.PI / 12) * 1.5 + (Math.random() - 0.5) * 0.5,
          oxygenLevel: 7.0 + Math.sin((hour + 6) * Math.PI / 12) * 0.8 + (Math.random() - 0.5) * 0.3,
          phLevel: 8.1 + (Math.random() - 0.5) * 0.2,
          salinity: 22 + (Math.random() - 0.5) * 1,
          ammonia: 0.05 + Math.random() * 0.03,
          nitrite: 0.08 + Math.random() * 0.02,
          nitrate: 15 + Math.random() * 3,
          turbidity: 3 + Math.random() * 2,
          mortalityRate: Math.max(0, 0.5 + (Math.random() - 0.5) * 0.3),
          feedConversionRatio: 1.3 + (Math.random() - 0.5) * 0.1,
          growthRate: 2.5 + (Math.random() - 0.5) * 0.5,
          behaviorScore: 8.5 + (Math.random() - 0.5) * 1
        };
      }),
      alerts: [
        {
          id: 'alert_001',
          type: 'warning',
          message: 'Slight increase in ammonia levels detected',
          timestamp: subHours(new Date(), 6),
          resolved: false
        },
        {
          id: 'alert_002',
          type: 'info',
          message: 'Scheduled health inspection due tomorrow',
          timestamp: subHours(new Date(), 12),
          resolved: false
        },
        {
          id: 'alert_003',
          type: 'critical',
          message: 'Temperature spike detected - immediate action required',
          timestamp: subDays(new Date(), 2),
          resolved: true
        }
      ],
      treatments: [
        {
          id: 'treatment_001',
          treatment: 'Probiotic Supplement',
          date: subDays(new Date(), 3),
          veterinarian: 'Dr. Sarah Chen',
          dosage: '5ml per 1000L',
          notes: 'Applied to improve gut health and immune response'
        },
        {
          id: 'treatment_002',
          treatment: 'Water Quality Stabilizer',
          date: subDays(new Date(), 7),
          veterinarian: 'Dr. Michael Rodriguez',
          dosage: '10ml per 1000L',
          notes: 'Routine water conditioning treatment'
        }
      ],
      vaccinations: [
        {
          vaccine: 'WSSV Vaccine',
          date: subDays(new Date(), 30),
          veterinarian: 'Dr. Sarah Chen',
          nextDue: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        },
        {
          vaccine: 'Vibrio Vaccine',
          date: subDays(new Date(), 45),
          veterinarian: 'Dr. Sarah Chen',
          nextDue: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000)
        }
      ]
    },
    {
      batchId: 'BST-2024-002',
      species: 'Black Tiger Prawn (Penaeus monodon)',
      currentLocation: 'Tank B-08, Building 2',
      quantity: 3050,
      averageWeight: 1.8,
      age: 223,
      healthStatus: 'good',
      overallScore: 78,
      lastInspection: subDays(new Date(), 2),
      nextInspection: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metrics: Array.from({ length: 168 }, (_, i) => {
        const timestamp = subHours(new Date(), 167 - i);
        const hour = timestamp.getHours();
        
        return {
          timestamp,
          temperature: 27.8 + Math.sin(hour * Math.PI / 12) * 1.2 + (Math.random() - 0.5) * 0.7,
          oxygenLevel: 6.5 + Math.sin((hour + 6) * Math.PI / 12) * 0.9 + (Math.random() - 0.5) * 0.4,
          phLevel: 8.0 + (Math.random() - 0.5) * 0.3,
          salinity: 23 + (Math.random() - 0.5) * 1.5,
          ammonia: 0.08 + Math.random() * 0.05,
          nitrite: 0.12 + Math.random() * 0.03,
          nitrate: 18 + Math.random() * 4,
          turbidity: 4 + Math.random() * 2.5,
          mortalityRate: Math.max(0, 1.2 + (Math.random() - 0.5) * 0.5),
          feedConversionRatio: 1.4 + (Math.random() - 0.5) * 0.15,
          growthRate: 2.2 + (Math.random() - 0.5) * 0.6,
          behaviorScore: 7.8 + (Math.random() - 0.5) * 1.2
        };
      }),
      alerts: [
        {
          id: 'alert_004',
          type: 'warning',
          message: 'Mortality rate slightly elevated',
          timestamp: subHours(new Date(), 8),
          resolved: false
        }
      ],
      treatments: [],
      vaccinations: [
        {
          vaccine: 'IHHNV Vaccine',
          date: subDays(new Date(), 60),
          veterinarian: 'Dr. Michael Rodriguez',
          nextDue: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
        }
      ]
    }
  ], []);

  const selectedBatchData = batchHealthData.find(b => b.batchId === selectedBatch);

  // Calculate health score components
  const healthScoreComponents = useMemo(() => {
    if (!selectedBatchData) return null;

    const latestMetrics = selectedBatchData.metrics[selectedBatchData.metrics.length - 1];
    const standards = qualityStandards;

    const scores = {
      temperature: calculateMetricScore(latestMetrics.temperature, standards.temperature),
      oxygen: calculateMetricScore(latestMetrics.oxygenLevel, standards.oxygenLevel),
      ph: calculateMetricScore(latestMetrics.phLevel, standards.phLevel),
      salinity: calculateMetricScore(latestMetrics.salinity, standards.salinity),
      waterQuality: calculateWaterQualityScore(latestMetrics),
      mortality: Math.max(0, 100 - (latestMetrics.mortalityRate / standards.mortalityRate.max) * 100),
      growth: Math.min(100, latestMetrics.growthRate * 10),
      behavior: latestMetrics.behaviorScore * 10
    };

    return [
      { metric: 'Temperature', score: scores.temperature, value: latestMetrics.temperature, unit: '°C' },
      { metric: 'Oxygen', score: scores.oxygen, value: latestMetrics.oxygenLevel, unit: 'mg/L' },
      { metric: 'pH Level', score: scores.ph, value: latestMetrics.phLevel, unit: '' },
      { metric: 'Salinity', score: scores.salinity, value: latestMetrics.salinity, unit: 'ppt' },
      { metric: 'Water Quality', score: scores.waterQuality, value: scores.waterQuality, unit: '%' },
      { metric: 'Mortality', score: scores.mortality, value: latestMetrics.mortalityRate, unit: '%' },
      { metric: 'Growth Rate', score: scores.growth, value: latestMetrics.growthRate, unit: '%' },
      { metric: 'Behavior', score: scores.behavior, value: latestMetrics.behaviorScore, unit: '/10' }
    ];
  }, [selectedBatchData]);

  function calculateMetricScore(value: number, standard: any): number {
    if (standard.optimal) {
      if (value >= standard.optimal.min && value <= standard.optimal.max) return 100;
      if (value >= standard.min && value <= standard.max) return 75;
      return Math.max(0, 50 - Math.abs(value - (standard.optimal.min + standard.optimal.max) / 2) * 10);
    }
    if (standard.max && value <= standard.max) return 100;
    return Math.max(0, 100 - (value / standard.max) * 50);
  }

  function calculateWaterQualityScore(metrics: HealthMetric): number {
    const ammoniaScore = Math.max(0, 100 - (metrics.ammonia / qualityStandards.ammonia.max) * 100);
    const nitriteScore = Math.max(0, 100 - (metrics.nitrite / qualityStandards.nitrite.max) * 100);
    const nitrateScore = Math.max(0, 100 - (metrics.nitrate / qualityStandards.nitrate.max) * 100);
    return (ammoniaScore + nitriteScore + nitrateScore) / 3;
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getHealthStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="h-4 w-4" />;
      case 'good': return <CheckCircle className="h-4 w-4" />;
      case 'fair': return <Heart className="h-4 w-4" />;
      case 'poor': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Heart className="h-4 w-4" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-100 border-blue-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const exportData = {
    title: 'Batch Health Monitoring Report',
    subtitle: `Health metrics and quality analysis for ${selectedBatch}`,
    data: selectedBatchData?.metrics || [],
    dateRange: { 
      from: subDays(new Date(), 7).toISOString().split('T')[0], 
      to: new Date().toISOString().split('T')[0] 
    },
    summary: [
      { label: 'Overall Health Score', value: `${selectedBatchData?.overallScore || 0}/100` },
      { label: 'Health Status', value: selectedBatchData?.healthStatus || 'N/A' },
      { label: 'Current Quantity', value: selectedBatchData?.quantity.toLocaleString() || '0' },
      { label: 'Average Weight', value: `${selectedBatchData?.averageWeight || 0} kg` }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Batch Health Monitoring</h2>
          <p className="text-gray-600">Real-time health metrics and quality tracking</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {batchHealthData.map(batch => (
              <option key={batch.batchId} value={batch.batchId}>
                {batch.batchId} - {batch.species.split('(')[0].trim()}
              </option>
            ))}
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <ExportButton exportData={exportData} />
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Treatment
          </Button>
        </div>
      </div>

      {/* Batch Overview */}
      {selectedBatchData && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedBatchData.batchId}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedBatchData.species}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedBatchData.currentLocation}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedBatchData.quantity.toLocaleString()} individuals</span>
                </div>
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedBatchData.averageWeight} kg average weight</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <span>{selectedBatchData.age} days old</span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${getHealthStatusColor(selectedBatchData.healthStatus)}`}>
                  {getHealthStatusIcon(selectedBatchData.healthStatus)}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 capitalize">{selectedBatchData.healthStatus}</p>
              <p className="text-xs text-gray-500">Health Status</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className={`text-3xl font-bold ${getScoreColor(selectedBatchData.overallScore)}`}>
                  {selectedBatchData.overallScore}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Overall Score</p>
              <p className="text-xs text-gray-500">out of 100</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className="text-lg font-semibold text-gray-900">
                  {format(selectedBatchData.lastInspection, 'MMM dd')}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Last Inspection</p>
              <p className="text-xs text-gray-500">{differenceInDays(new Date(), selectedBatchData.lastInspection)} days ago</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <div className="text-lg font-semibold text-blue-600">
                  {format(selectedBatchData.nextInspection, 'MMM dd')}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900">Next Inspection</p>
              <p className="text-xs text-gray-500">in {differenceInDays(selectedBatchData.nextInspection, new Date())} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'metrics', label: 'Metrics', icon: Stethoscope },
            { id: 'alerts', label: 'Alerts', icon: Bell },
            { id: 'treatments', label: 'Treatments', icon: TestTube }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                viewMode === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
              {tab.id === 'alerts' && selectedBatchData?.alerts.filter(a => !a.resolved).length ? (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {selectedBatchData.alerts.filter(a => !a.resolved).length}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {viewMode === 'overview' && selectedBatchData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Health Score Radar */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Score Breakdown</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={healthScoreComponents || []}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" className="text-sm" />
                  <PolarRadiusAxis domain={[0, 100]} tickCount={5} />
                  <Radar name="Score" dataKey="score" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} strokeWidth={2} />
                  <Tooltip formatter={(value: any) => [`${value.toFixed(0)}%`, 'Score']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Key Metrics Summary */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Metrics</h3>
            <div className="grid grid-cols-2 gap-4">
              {healthScoreComponents?.map((component, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{component.metric}</span>
                    <span className={`text-sm font-bold ${getScoreColor(component.score)}`}>
                      {component.score.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-gray-900">
                    {component.value.toFixed(1)}{component.unit}
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        component.score >= 90 ? 'bg-green-500' :
                        component.score >= 75 ? 'bg-blue-500' :
                        component.score >= 60 ? 'bg-yellow-500' :
                        component.score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${component.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Water Quality Trends */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Water Quality Trends (24h)</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedBatchData.metrics.slice(-24)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                  />
                  <YAxis yAxisId="temp" orientation="left" />
                  <YAxis yAxisId="oxygen" orientation="right" />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm')}
                    formatter={(value: any, name: any) => [
                      `${value.toFixed(1)}${name === 'temperature' ? '°C' : ' mg/L'}`,
                      name === 'temperature' ? 'Temperature' : 'Oxygen Level'
                    ]}
                  />
                  <Legend />
                  <Line yAxisId="temp" type="monotone" dataKey="temperature" stroke="#EF4444" strokeWidth={2} name="temperature" />
                  <Line yAxisId="oxygen" type="monotone" dataKey="oxygenLevel" stroke="#3B82F6" strokeWidth={2} name="oxygenLevel" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
            <div className="space-y-3">
              {selectedBatchData.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)} ${alert.resolved ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {alert.type === 'critical' && <AlertTriangle className="h-4 w-4" />}
                      {alert.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
                      {alert.type === 'info' && <Bell className="h-4 w-4" />}
                      <span className="text-sm font-medium">{alert.message}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {format(alert.timestamp, 'MMM dd, HH:mm')}
                      </span>
                      {alert.resolved && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          Resolved
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {selectedBatchData.alerts.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No alerts for this batch</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {viewMode === 'metrics' && selectedBatchData && (
        <div className="space-y-6">
          {/* Metric Selector */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Select Metric:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'temperature', label: 'Temperature', icon: Thermometer },
                  { key: 'oxygenLevel', label: 'Oxygen', icon: Wind },
                  { key: 'phLevel', label: 'pH Level', icon: Droplets },
                  { key: 'salinity', label: 'Salinity', icon: Droplets },
                  { key: 'mortalityRate', label: 'Mortality', icon: AlertTriangle },
                  { key: 'growthRate', label: 'Growth', icon: TrendingUp }
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setSelectedMetric(key)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedMetric === key
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Metric Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} Trends
            </h3>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedBatchData.metrics.slice(-48)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => format(new Date(value), 'MM/dd HH:mm')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => format(new Date(value), 'MMM dd, HH:mm')}
                    formatter={(value: any) => [
                      `${value.toFixed(2)}${
                        selectedMetric === 'temperature' ? '°C' :
                        selectedMetric === 'oxygenLevel' ? ' mg/L' :
                        selectedMetric === 'phLevel' ? '' :
                        selectedMetric === 'salinity' ? ' ppt' :
                        '%'
                      }`,
                      selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)
                    ]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metric Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {(() => {
              const metricData = selectedBatchData.metrics.map(m => (m as any)[selectedMetric]);
              const current = metricData[metricData.length - 1];
              const average = metricData.reduce((sum: number, val: number) => sum + val, 0) / metricData.length;
              const min = Math.min(...metricData);
              const max = Math.max(...metricData);

              return [
                { label: 'Current', value: current, color: 'blue' },
                { label: 'Average', value: average, color: 'green' },
                { label: 'Minimum', value: min, color: 'orange' },
                { label: 'Maximum', value: max, color: 'red' }
              ].map((stat, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className={`text-2xl font-bold text-${stat.color}-600`}>
                    {stat.value.toFixed(2)}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{stat.label}</p>
                  <p className="text-xs text-gray-500">
                    {selectedMetric === 'temperature' ? '°C' :
                     selectedMetric === 'oxygenLevel' ? 'mg/L' :
                     selectedMetric === 'phLevel' ? 'pH' :
                     selectedMetric === 'salinity' ? 'ppt' : '%'}
                  </p>
                </div>
              ));
            })()}
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {viewMode === 'alerts' && selectedBatchData && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Alert History</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Alert Rule
                </Button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {selectedBatchData.alerts.map((alert) => (
              <div key={alert.id} className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${getAlertColor(alert.type)}`}>
                    {alert.type === 'critical' && <AlertTriangle className="h-5 w-5" />}
                    {alert.type === 'warning' && <AlertTriangle className="h-5 w-5" />}
                    {alert.type === 'info' && <Bell className="h-5 w-5" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">{alert.message}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">
                          {format(alert.timestamp, 'MMM dd, yyyy HH:mm')}
                        </span>
                        {alert.resolved ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Resolved
                          </span>
                        ) : (
                          <Button size="sm" variant="outline">
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                      <span className={`capitalize ${
                        alert.type === 'critical' ? 'text-red-600' :
                        alert.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`}>
                        {alert.type} Alert
                      </span>
                      <span>Batch: {selectedBatchData.batchId}</span>
                      <span>Location: {selectedBatchData.currentLocation}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Treatments Tab */}
      {viewMode === 'treatments' && selectedBatchData && (
        <div className="space-y-6">
          {/* Treatment History */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Treatment History</h3>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Record Treatment
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {selectedBatchData.treatments.map((treatment) => (
                <div key={treatment.id} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TestTube className="h-5 w-5 text-green-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{treatment.treatment}</h4>
                        <span className="text-sm text-gray-500">
                          {format(treatment.date, 'MMM dd, yyyy')}
                        </span>
                      </div>
                      
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Veterinarian:</span> {treatment.veterinarian}</p>
                        <p><span className="font-medium">Dosage:</span> {treatment.dosage}</p>
                        <p><span className="font-medium">Notes:</span> {treatment.notes}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vaccination Schedule */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Vaccination Schedule</h3>
            </div>

            <div className="divide-y divide-gray-200">
              {selectedBatchData.vaccinations.map((vaccination, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Shield className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">{vaccination.vaccine}</h4>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            Administered: {format(vaccination.date, 'MMM dd, yyyy')}
                          </p>
                          {vaccination.nextDue && (
                            <p className="text-sm text-blue-600">
                              Next Due: {format(vaccination.nextDue, 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <p className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Veterinarian:</span> {vaccination.veterinarian}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}