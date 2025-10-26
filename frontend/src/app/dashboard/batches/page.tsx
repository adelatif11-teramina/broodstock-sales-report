'use client';

import React from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import BatchOverview from '@/components/batches/BatchOverview';
import BatchTable from '@/components/batches/BatchTable';
import BatchFilters from '@/components/batches/BatchFilters';
import QualityAlerts from '@/components/batches/QualityAlerts';
import { Plus, Package } from 'lucide-react';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';
import Link from 'next/link';

function BatchesPage() {
  const [filters, setFilters] = React.useState({
    search: '',
    status: '',
    healthStatus: '',
    species: '',
    sortBy: 'createdAt',
    sortOrder: 'desc' as 'asc' | 'desc',
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Broodstock Batch Management</h1>
              <p className="text-gray-600">Monitor batch health, quality, and lifecycle tracking</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButton
              exportData={{
                title: 'Broodstock Batch Report',
                subtitle: 'Batch health, quality, and lifecycle tracking',
                data: [],
                summary: [
                  { label: 'Total Batches', value: 25 },
                  { label: 'Active Batches', value: 18 },
                  { label: 'Average Survival Rate', value: '92.5%' },
                  { label: 'Total Population', value: 1250000 },
                ],
              }}
              options={{ includeCharts: true }}
            />
            <Link href="/dashboard/batches/new">
              <Button icon={<Plus className="h-4 w-4" />}>
                New Batch
              </Button>
            </Link>
          </div>
        </div>

        {/* Quality Alerts */}
        <QualityAlerts />

        {/* Batch Overview */}
        <BatchOverview />

        {/* Filters */}
        <BatchFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
        />

        {/* Batch Table */}
        <BatchTable filters={filters} />
      </div>
    </DashboardLayout>
  );
}

export default withAuth(BatchesPage, ['editor', 'manager', 'admin']);