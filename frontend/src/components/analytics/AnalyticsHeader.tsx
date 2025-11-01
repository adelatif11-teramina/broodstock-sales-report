'use client';

import React from 'react';
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  Filter,
  BarChart3,
  RefreshCw,
  Share
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
  compareMode: boolean;
  onCompareModeChange: (enabled: boolean) => void;
}

const TIME_RANGES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
  { value: 'custom', label: 'Custom' },
];

export default function AnalyticsHeader({ 
  timeRange, 
  onTimeRangeChange, 
  compareMode, 
  onCompareModeChange 
}: AnalyticsHeaderProps) {
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting analytics data...');
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    console.log('Sharing analytics dashboard...');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Title and Description */}
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <BarChart3 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Business Analytics</h1>
            <p className="text-gray-600">Comprehensive insights into sales performance and trends</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Time Range Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              {TIME_RANGES.map((range) => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Compare Mode Toggle */}
          <div className="flex items-center space-x-2">
            <label htmlFor="compareMode" className="flex items-center cursor-pointer">
              <input
                id="compareMode"
                type="checkbox"
                checked={compareMode}
                onChange={(e) => onCompareModeChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">Compare Previous</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              icon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              icon={<Share className="h-4 w-4" />}
            >
              Share
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              icon={<Download className="h-4 w-4" />}
            >
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
            <div>
              <div className="text-sm text-blue-600 font-medium">Revenue Growth</div>
              <div className="text-lg font-bold text-blue-900">+23.5%</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-green-600 mr-2" />
            <div>
              <div className="text-sm text-green-600 font-medium">Order Volume</div>
              <div className="text-lg font-bold text-green-900">+15.2%</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-purple-600 mr-2" />
            <div>
              <div className="text-sm text-purple-600 font-medium">Avg Order Value</div>
              <div className="text-lg font-bold text-purple-900">+8.7%</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-orange-600 mr-2" />
            <div>
              <div className="text-sm text-orange-600 font-medium">Customer Retention</div>
              <div className="text-lg font-bold text-orange-900">92.3%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}