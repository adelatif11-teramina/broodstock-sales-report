'use client';

import React from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Package,
  AlertCircle,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { 
  formatNumber, 
  formatDate, 
  formatCurrency,
  getStatusColor 
} from '@/lib/utils';
import Button from '@/components/ui/Button';

interface InventoryFilters {
  search: string;
  category: string;
  status: string;
  location: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface InventoryTableProps {
  filters: InventoryFilters;
}

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  maxThreshold: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  location: string;
  supplier: string;
  lastRestocked: string;
  expiryDate?: string;
  batchNumber?: string;
  turnoverRate: number;
  status: 'healthy' | 'low' | 'critical' | 'out_of_stock' | 'overstock';
  notes?: string;
}

const ITEMS_PER_PAGE = 20;

// Mock inventory data
const mockInventoryItems: InventoryItem[] = [
  {
    id: '1',
    sku: 'FEED-001',
    name: 'Premium Shrimp Feed (2mm)',
    description: 'High-protein pelleted feed for juvenile shrimp',
    category: 'feed',
    currentStock: 85,
    minThreshold: 500,
    maxThreshold: 2000,
    unit: 'kg',
    unitPrice: 12.50,
    totalValue: 1062.50,
    location: 'warehouse_a',
    supplier: 'AquaFeed Corp',
    lastRestocked: '2025-01-10T00:00:00Z',
    expiryDate: '2025-07-15T00:00:00Z',
    batchNumber: 'AF2025001',
    turnoverRate: 4.2,
    status: 'critical',
  },
  {
    id: '2',
    sku: 'MED-003',
    name: 'Probiotic Supplement',
    description: 'Beneficial bacteria supplement for water quality',
    category: 'medication',
    currentStock: 0,
    minThreshold: 50,
    maxThreshold: 200,
    unit: 'bottles',
    unitPrice: 45.00,
    totalValue: 0,
    location: 'medical_storage',
    supplier: 'BioHealth Solutions',
    lastRestocked: '2025-01-05T00:00:00Z',
    expiryDate: '2026-01-05T00:00:00Z',
    batchNumber: 'BH2025003',
    turnoverRate: 2.8,
    status: 'out_of_stock',
  },
  {
    id: '3',
    sku: 'EQUIP-012',
    name: 'Water Quality Test Kit',
    description: 'Complete test kit for pH, ammonia, nitrite, nitrate',
    category: 'equipment',
    currentStock: 180,
    minThreshold: 200,
    maxThreshold: 500,
    unit: 'kits',
    unitPrice: 25.00,
    totalValue: 4500.00,
    location: 'lab_storage',
    supplier: 'TestPro Equipment',
    lastRestocked: '2025-01-08T00:00:00Z',
    turnoverRate: 3.1,
    status: 'low',
  },
  {
    id: '4',
    sku: 'CHEM-005',
    name: 'pH Buffer Solution',
    description: 'Stabilizes water pH levels in shrimp tanks',
    category: 'chemicals',
    currentStock: 25,
    minThreshold: 30,
    maxThreshold: 100,
    unit: 'liters',
    unitPrice: 18.00,
    totalValue: 450.00,
    location: 'chemical_storage',
    supplier: 'ChemBalance Ltd',
    lastRestocked: '2024-12-20T00:00:00Z',
    expiryDate: '2025-12-20T00:00:00Z',
    batchNumber: 'CB2024089',
    turnoverRate: 2.5,
    status: 'low',
  },
  {
    id: '5',
    sku: 'FEED-004',
    name: 'Artemia Nauplii (Frozen)',
    description: 'Frozen artemia nauplii for larval shrimp feeding',
    category: 'feed',
    currentStock: 2200,
    minThreshold: 300,
    maxThreshold: 800,
    unit: 'packs',
    unitPrice: 3.50,
    totalValue: 7700.00,
    location: 'freezer_unit_b',
    supplier: 'Artemia Farms Inc',
    lastRestocked: '2025-01-12T00:00:00Z',
    expiryDate: '2025-06-12T00:00:00Z',
    batchNumber: 'AF2025012',
    turnoverRate: 1.8,
    status: 'overstock',
  },
  {
    id: '6',
    sku: 'SUPPLY-020',
    name: 'Oxygen Tablets',
    description: 'Emergency oxygen tablets for tank oxygenation',
    category: 'supplies',
    currentStock: 340,
    minThreshold: 400,
    maxThreshold: 1000,
    unit: 'tablets',
    unitPrice: 0.75,
    totalValue: 255.00,
    location: 'warehouse_a',
    supplier: 'AquaSupply Co',
    lastRestocked: '2025-01-06T00:00:00Z',
    expiryDate: '2027-01-06T00:00:00Z',
    batchNumber: 'AS2025006',
    turnoverRate: 5.2,
    status: 'low',
  },
  {
    id: '7',
    sku: 'EQUIP-025',
    name: 'Aerator Pumps (1HP)',
    description: 'High-efficiency aerator pumps for pond oxygenation',
    category: 'equipment',
    currentStock: 8,
    minThreshold: 5,
    maxThreshold: 15,
    unit: 'units',
    unitPrice: 450.00,
    totalValue: 3600.00,
    location: 'warehouse_b',
    supplier: 'PumpTech Industries',
    lastRestocked: '2024-12-15T00:00:00Z',
    turnoverRate: 1.2,
    status: 'healthy',
  },
  {
    id: '8',
    sku: 'MED-008',
    name: 'Antibiotic Treatment',
    description: 'Broad-spectrum antibiotic for bacterial infections',
    category: 'medication',
    currentStock: 45,
    minThreshold: 20,
    maxThreshold: 100,
    unit: 'vials',
    unitPrice: 32.00,
    totalValue: 1440.00,
    location: 'medical_storage',
    supplier: 'VetMed Pharmaceuticals',
    lastRestocked: '2025-01-03T00:00:00Z',
    expiryDate: '2025-08-03T00:00:00Z',
    batchNumber: 'VM2025003',
    turnoverRate: 2.1,
    status: 'healthy',
  },
];

export default function InventoryTable({ filters }: InventoryTableProps) {
  const [page, setPage] = React.useState(1);

  // Filter and sort the mock data
  const filteredItems = React.useMemo(() => {
    let filtered = [...mockInventoryItems];

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.sku.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.supplier.toLowerCase().includes(searchLower) ||
        item.batchNumber?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filters.category) {
      filtered = filtered.filter(item => item.category === filters.category);
    }

    // Apply status filter
    if (filters.status) {
      filtered = filtered.filter(item => item.status === filters.status);
    }

    // Apply location filter
    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[filters.sortBy as keyof InventoryItem];
      let bValue: any = b[filters.sortBy as keyof InventoryItem];

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
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
      case 'out_of_stock':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'low':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'overstock':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Package className="h-4 w-4 text-green-600" />;
    }
  };

  const getLocationLabel = (location: string) => {
    const locationMap: Record<string, string> = {
      'warehouse_a': 'Warehouse A',
      'warehouse_b': 'Warehouse B',
      'lab_storage': 'Lab Storage',
      'chemical_storage': 'Chemical Storage',
      'medical_storage': 'Medical Storage',
      'freezer_unit_a': 'Freezer Unit A',
      'freezer_unit_b': 'Freezer Unit B',
      'cold_storage': 'Cold Storage',
    };
    return locationMap[location] || location;
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      'feed': 'Feed',
      'medication': 'Medication',
      'equipment': 'Equipment',
      'chemicals': 'Chemicals',
      'supplies': 'Supplies',
      'tools': 'Tools',
      'maintenance': 'Maintenance',
    };
    return categoryMap[category] || category;
  };

  if (filteredItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No inventory items found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filters.search || filters.category || filters.status || filters.location
                ? 'Try adjusting your filters' 
                : 'Add inventory items to get started'
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
            Inventory Items ({totalItems.toLocaleString()})
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
                Item Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value & Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location & Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status & Dates
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedItems.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      {getStatusIcon(item.status)}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {item.name}
                      </div>
                      <div className="text-sm text-blue-600">
                        {item.sku}
                      </div>
                      <div className="text-xs text-gray-500">
                        {getCategoryLabel(item.category)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatNumber(item.currentStock)} {item.unit}
                  </div>
                  <div className="text-sm text-gray-500">
                    Min: {formatNumber(item.minThreshold)} {item.unit}
                  </div>
                  <div className="text-xs text-gray-400">
                    Turnover: {item.turnoverRate}x/month
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(item.totalValue)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(item.unitPrice)}/{item.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {getLocationLabel(item.location)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.supplier}
                  </div>
                  {item.batchNumber && (
                    <div className="text-xs text-gray-400">
                      Batch: {item.batchNumber}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <div className="text-xs text-gray-500">
                      Restocked: {formatDate(item.lastRestocked, 'short')}
                    </div>
                    {item.expiryDate && (
                      <div className="text-xs text-gray-500">
                        Expires: {formatDate(item.expiryDate, 'short')}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/inventory/${item.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/inventory/${item.id}/edit`}>
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
        {paginatedItems.map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                {getStatusIcon(item.status)}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.name}
                  </div>
                  <div className="text-xs text-blue-600">
                    {item.sku}
                  </div>
                </div>
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                {item.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Package className="h-3 w-3 mr-1" />
                  Stock Level
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatNumber(item.currentStock)} {item.unit}
                </div>
                <div className="text-xs text-gray-500">
                  Min: {formatNumber(item.minThreshold)}
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Value
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(item.totalValue)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(item.unitPrice)}/{item.unit}
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <MapPin className="h-3 w-3 mr-1" />
                  Location
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {getLocationLabel(item.location)}
                </div>
                <div className="text-xs text-gray-500">
                  {item.supplier}
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Last Restocked
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatDate(item.lastRestocked, 'short')}
                </div>
                {item.expiryDate && (
                  <div className="text-xs text-gray-500">
                    Expires: {formatDate(item.expiryDate, 'short')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2">
              <Link href={`/dashboard/inventory/${item.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </Link>
              <Link href={`/dashboard/inventory/${item.id}/edit`}>
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
              Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, totalItems)} of {totalItems} items
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