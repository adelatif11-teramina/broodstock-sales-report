'use client';

import React from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnalyticsHeader from '@/components/analytics/AnalyticsHeader';
import SimpleRevenueChart from '@/components/analytics/SimpleRevenueChart';
import SpeciesPerformance from '@/components/analytics/SpeciesPerformance';
import CustomerAnalytics from '@/components/analytics/CustomerAnalytics';
import GeographicAnalytics from '@/components/analytics/GeographicAnalytics';
// import SeasonalTrends from '@/components/analytics/SeasonalTrends';
import PerformanceMetrics from '@/components/analytics/PerformanceMetrics';
import InteractiveMap from '@/components/maps/InteractiveMap';
import ExportButton from '@/components/ui/ExportButton';

function AnalyticsPage() {
  const [timeRange, setTimeRange] = React.useState('30d');
  const [compareMode, setCompareMode] = React.useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header with Export */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advanced Analytics</h1>
            <p className="text-gray-600">Comprehensive business intelligence and performance insights</p>
          </div>
          <ExportButton
            exportData={{
              title: 'Advanced Analytics Report',
              subtitle: 'Comprehensive business intelligence and performance insights',
              data: [],
              summary: [
                { label: 'Total Revenue', value: 2458750 },
                { label: 'Customer Growth', value: '18.5%' },
                { label: 'Market Share', value: '23.2%' },
                { label: 'Performance Score', value: 94 },
              ],
            }}
            options={{ includeCharts: true }}
          />
        </div>

        {/* Analytics Header with Controls */}
        <AnalyticsHeader 
          timeRange={timeRange}
          onTimeRangeChange={setTimeRange}
          compareMode={compareMode}
          onCompareModeChange={setCompareMode}
        />

        {/* Performance Overview */}
        <PerformanceMetrics 
          timeRange={timeRange}
          compareMode={compareMode}
        />

        {/* Revenue Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SimpleRevenueChart 
            timeRange={timeRange}
          />
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seasonal Trends</h3>
            <p className="text-gray-600">Seasonal analysis coming soon...</p>
          </div>
        </div>

        {/* Species & Customer Analytics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SpeciesPerformance 
            timeRange={timeRange}
          />
          <CustomerAnalytics 
            timeRange={timeRange}
          />
        </div>

        {/* Interactive Map */}
        <InteractiveMap 
          timeRange={timeRange}
        />

        {/* Geographic Analytics */}
        <GeographicAnalytics 
          timeRange={timeRange}
        />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(AnalyticsPage);