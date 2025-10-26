'use client';

import React from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import InventoryOverview from '@/components/inventory/InventoryOverview';
import StockAlerts from '@/components/inventory/StockAlerts';
import InventoryTable from '@/components/inventory/InventoryTable';
import InventoryFilters from '@/components/inventory/InventoryFilters';
import StockMovements from '@/components/inventory/StockMovements';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import ExportButton from '@/components/ui/ExportButton';
import Link from 'next/link';

function InventoryPage() {
  const [filters, setFilters] = React.useState({
    search: '',
    category: '',
    status: '',
    location: '',
    sortBy: 'name',
    sortOrder: 'asc' as 'asc' | 'desc',
  });

  const [activeTab, setActiveTab] = React.useState<'overview' | 'movements'>('overview');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Package className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Track stock levels, manage supplies, and monitor inventory health</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <ExportButton
              exportData={{
                title: 'Inventory Management Report',
                subtitle: 'Stock levels, alerts, and inventory analytics',
                data: [],
                summary: [
                  { label: 'Total Items', value: 342 },
                  { label: 'Total Value', value: 285000 },
                  { label: 'Low Stock Items', value: 23 },
                  { label: 'Critical Items', value: 8 },
                ],
              }}
              options={{ includeCharts: true }}
            />
            <Link href="/dashboard/inventory/new">
              <Button icon={<Plus className="h-4 w-4" />}>
                Add Item
              </Button>
            </Link>
          </div>
        </div>

        {/* Stock Alerts */}
        <StockAlerts />

        {/* Inventory Overview */}
        <InventoryOverview />

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Package className="h-4 w-4 inline mr-2" />
              Inventory Overview
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'movements'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <AlertTriangle className="h-4 w-4 inline mr-2" />
              Stock Movements
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Filters */}
            <InventoryFilters 
              filters={filters} 
              onFiltersChange={setFilters} 
            />

            {/* Inventory Table */}
            <InventoryTable filters={filters} />
          </>
        )}

        {activeTab === 'movements' && (
          <StockMovements />
        )}
      </div>
    </DashboardLayout>
  );
}

export default withAuth(InventoryPage, ['editor', 'manager', 'admin']);