'use client';

import React from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ExecutiveKPICards from '@/components/dashboard/ExecutiveKPICards';
import ExecutiveSalesCharts from '@/components/dashboard/ExecutiveSalesCharts';

function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Executive Dashboard</h1>
            <p className="text-gray-600">Sales performance overview and key business metrics</p>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Executive KPI Cards with Summary */}
        <ExecutiveKPICards />

        {/* Comprehensive Sales Charts */}
        <ExecutiveSalesCharts />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(DashboardPage);