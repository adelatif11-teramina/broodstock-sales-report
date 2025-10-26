'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Package,
  AlertCircle,
  Activity,
  Calendar,
  Thermometer,
  QrCode,
  TrendingUp
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { 
  formatNumber, 
  formatDate, 
  getStatusColor, 
  formatStatus
} from '@/lib/utils';
import Button from '@/components/ui/Button';

interface BatchFilters {
  search: string;
  status: string;
  healthStatus: string;
  species: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface BatchTableProps {
  filters: BatchFilters;
}

interface Batch {
  id: string;
  batchId: string;
  species: string;
  strain?: string;
  tankId: string;
  status: string;
  healthStatus: string;
  createdAt: string;
  initialPopulation: number;
  currentPopulation: number;
  survivalRate: number;
  daysOld: number;
  avgLength: number;
  avgWeight: number;
  growthRate: number;
  waterTemp: number;
  feedingSchedule: string;
  notes?: string;
  qrCode: string;
}

const ITEMS_PER_PAGE = 20;

// Mock batch data
const mockBatches: Batch[] = [
  {
    id: '1',
    batchId: 'B-2025-001',
    species: 'White Shrimp (P. vannamei)',
    strain: 'SPF',
    tankId: 'A1',
    status: 'active',
    healthStatus: 'excellent',
    createdAt: '2025-01-01T00:00:00Z',
    initialPopulation: 150000,
    currentPopulation: 139500,
    survivalRate: 93.0,
    daysOld: 15,
    avgLength: 12.5,
    avgWeight: 0.8,
    growthRate: 1.8,
    waterTemp: 28.5,
    feedingSchedule: '4x daily',
    qrCode: 'QR001',
  },
  {
    id: '2',
    batchId: 'B-2025-002',
    species: 'Black Tiger Shrimp (P. monodon)',
    tankId: 'B2',
    status: 'growing',
    healthStatus: 'good',
    createdAt: '2024-12-28T00:00:00Z',
    initialPopulation: 120000,
    currentPopulation: 108000,
    survivalRate: 90.0,
    daysOld: 18,
    avgLength: 15.2,
    avgWeight: 1.2,
    growthRate: 2.1,
    waterTemp: 29.0,
    feedingSchedule: '3x daily',
    qrCode: 'QR002',
  },
  {
    id: '3',
    batchId: 'B-2025-003',
    species: 'Giant Freshwater Prawn (M. rosenbergii)',
    tankId: 'C1',
    status: 'ready',
    healthStatus: 'excellent',
    createdAt: '2024-12-15T00:00:00Z',
    initialPopulation: 80000,
    currentPopulation: 76000,
    survivalRate: 95.0,
    daysOld: 31,
    avgLength: 25.8,
    avgWeight: 3.5,
    growthRate: 1.5,
    waterTemp: 27.8,
    feedingSchedule: '2x daily',
    qrCode: 'QR003',
  },
  {
    id: '4',
    batchId: 'B-2025-004',
    species: 'White Shrimp (P. vannamei)',
    strain: 'SPR',
    tankId: 'A3',
    status: 'active',
    healthStatus: 'fair',
    createdAt: '2025-01-05T00:00:00Z',
    initialPopulation: 160000,
    currentPopulation: 140800,
    survivalRate: 88.0,
    daysOld: 11,
    avgLength: 9.8,
    avgWeight: 0.6,
    growthRate: 1.6,
    waterTemp: 28.2,
    feedingSchedule: '4x daily',
    qrCode: 'QR004',
  },
  {
    id: '5',
    batchId: 'B-2025-005',
    species: 'Pacific White Shrimp',
    tankId: 'D2',
    status: 'active',
    healthStatus: 'critical',
    createdAt: '2025-01-08T00:00:00Z',
    initialPopulation: 100000,
    currentPopulation: 82000,
    survivalRate: 82.0,
    daysOld: 8,
    avgLength: 7.2,
    avgWeight: 0.4,
    growthRate: 1.2,
    waterTemp: 26.5,
    feedingSchedule: '5x daily',
    qrCode: 'QR005',
  },
];

export default function BatchTable({ filters }: BatchTableProps) {
  const [page, setPage] = React.useState(1);

  // Filter and sort the mock data
  const filteredBatches = React.useMemo(() => {
    let filtered = [...mockBatches];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(batch => 
        batch.batchId.toLowerCase().includes(searchLower) ||
        batch.species.toLowerCase().includes(searchLower) ||
        batch.tankId.toLowerCase().includes(searchLower) ||
        batch.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filters
    if (filters.status) {
      filtered = filtered.filter(batch => batch.status === filters.status);
    }

    if (filters.healthStatus) {
      filtered = filtered.filter(batch => batch.healthStatus === filters.healthStatus);
    }

    if (filters.species) {
      filtered = filtered.filter(batch => 
        batch.species.toLowerCase().includes(filters.species.replace('_', ' '))
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof Batch];
      let bValue: any = b[filters.sortBy as keyof Batch];

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [filters]);

  // Pagination
  const totalBatches = filteredBatches.length;
  const totalPages = Math.ceil(totalBatches / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  if (filteredBatches.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No batches found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filters.search || filters.status || filters.healthStatus || filters.species
                ? 'Try adjusting your filters' 
                : 'Create your first batch to get started'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Batches ({totalBatches.toLocaleString()})
          </h3>
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch Info
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Species & Tank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Population
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Health & Growth
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Environment
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedBatches.map((batch) => (
              <tr key={batch.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <QrCode className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-blue-600">
                        {batch.batchId}
                      </div>
                      <div className="text-sm text-gray-500">
                        {batch.daysOld} days old
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{batch.species}</div>
                  <div className="text-sm text-gray-500">
                    Tank {batch.tankId}
                    {batch.strain && ` • ${batch.strain}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">
                    {formatNumber(batch.currentPopulation)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {batch.survivalRate.toFixed(1)}% survival
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    L: {batch.avgLength}mm • W: {batch.avgWeight}g
                  </div>
                  <div className="text-sm text-gray-500">
                    Growth: {batch.growthRate}mm/day
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {batch.waterTemp}°C
                  </div>
                  <div className="text-sm text-gray-500">
                    Feed: {batch.feedingSchedule}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                      {formatStatus(batch.status)}
                    </span>
                    <div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.healthStatus)}`}>
                        {formatStatus(batch.healthStatus)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/batches/${batch.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/batches/${batch.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        {paginatedBatches.map((batch) => (
          <div key={batch.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="h-4 w-4 text-blue-600" />
                <div className="text-sm font-medium text-blue-600">
                  {batch.batchId}
                </div>
              </div>
              <div className="flex space-x-1">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                  {formatStatus(batch.status)}
                </span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.healthStatus)}`}>
                  {formatStatus(batch.healthStatus)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Package className="h-3 w-3 mr-1" />
                  Species
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {batch.species}
                </div>
                <div className="text-xs text-gray-500">
                  Tank {batch.tankId} • {batch.daysOld} days
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Activity className="h-3 w-3 mr-1" />
                  Population
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatNumber(batch.currentPopulation)}
                </div>
                <div className="text-xs text-gray-500">
                  {batch.survivalRate.toFixed(1)}% survival
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Growth
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {batch.avgLength}mm • {batch.avgWeight}g
                </div>
                <div className="text-xs text-gray-500">
                  {batch.growthRate}mm/day
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Thermometer className="h-3 w-3 mr-1" />
                  Environment
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {batch.waterTemp}°C
                </div>
                <div className="text-xs text-gray-500">
                  {batch.feedingSchedule}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <Link href={`/dashboard/batches/${batch.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </Link>
              <Link href={`/dashboard/batches/${batch.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, totalBatches)} of {totalBatches} batches
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNumber = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <Button
                      key={pageNumber}
                      variant={page === pageNumber ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => setPage(pageNumber)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}