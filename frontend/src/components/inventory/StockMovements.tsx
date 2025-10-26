'use client';

import React from 'react';
import {
  ArrowUp,
  ArrowDown,
  Package,
  Truck,
  RotateCcw,
  AlertTriangle,
  Calendar,
  User,
  FileText,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatDate, formatNumber, formatCurrency } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface StockMovement {
  id: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  movementType: 'in' | 'out' | 'adjustment';
  reason: 'purchase' | 'sale' | 'transfer' | 'adjustment' | 'waste' | 'return' | 'production';
  quantity: number;
  unit: string;
  unitPrice?: number;
  totalValue?: number;
  fromLocation?: string;
  toLocation?: string;
  batchNumber?: string;
  referenceNumber?: string;
  notes?: string;
  performedBy: string;
  timestamp: string;
  runningBalance: number;
}

const ITEMS_PER_PAGE = 20;

// Mock stock movements data
const mockStockMovements: StockMovement[] = [
  {
    id: '1',
    itemId: 'FEED-001',
    itemName: 'Premium Shrimp Feed (2mm)',
    itemSku: 'FEED-001',
    movementType: 'out',
    reason: 'production',
    quantity: -50,
    unit: 'kg',
    unitPrice: 12.50,
    totalValue: -625.00,
    fromLocation: 'Warehouse A',
    toLocation: 'Tank A1',
    batchNumber: 'AF2025001',
    referenceNumber: 'PROD-2025-001',
    notes: 'Daily feeding for Batch B-2025-001',
    performedBy: 'John Smith',
    timestamp: '2025-01-16T08:30:00Z',
    runningBalance: 85,
  },
  {
    id: '2',
    itemId: 'MED-003',
    itemName: 'Probiotic Supplement',
    itemSku: 'MED-003',
    movementType: 'out',
    reason: 'sale',
    quantity: -15,
    unit: 'bottles',
    unitPrice: 45.00,
    totalValue: -675.00,
    fromLocation: 'Medical Storage',
    referenceNumber: 'ORD-2025-0089',
    notes: 'Customer order #89 - urgent delivery',
    performedBy: 'Sarah Johnson',
    timestamp: '2025-01-16T07:15:00Z',
    runningBalance: 0,
  },
  {
    id: '3',
    itemId: 'EQUIP-012',
    itemName: 'Water Quality Test Kit',
    itemSku: 'EQUIP-012',
    movementType: 'in',
    reason: 'purchase',
    quantity: 50,
    unit: 'kits',
    unitPrice: 25.00,
    totalValue: 1250.00,
    toLocation: 'Lab Storage',
    batchNumber: 'TP2025003',
    referenceNumber: 'PO-2025-012',
    notes: 'Regular monthly restock from TestPro Equipment',
    performedBy: 'Mike Wilson',
    timestamp: '2025-01-15T14:20:00Z',
    runningBalance: 180,
  },
  {
    id: '4',
    itemId: 'CHEM-005',
    itemName: 'pH Buffer Solution',
    itemSku: 'CHEM-005',
    movementType: 'out',
    reason: 'production',
    quantity: -5,
    unit: 'liters',
    unitPrice: 18.00,
    totalValue: -90.00,
    fromLocation: 'Chemical Storage',
    toLocation: 'Treatment Plant',
    referenceNumber: 'TREAT-2025-003',
    notes: 'Water treatment for multiple tanks',
    performedBy: 'David Brown',
    timestamp: '2025-01-15T11:45:00Z',
    runningBalance: 25,
  },
  {
    id: '5',
    itemId: 'FEED-004',
    itemName: 'Artemia Nauplii (Frozen)',
    itemSku: 'FEED-004',
    movementType: 'in',
    reason: 'purchase',
    quantity: 1000,
    unit: 'packs',
    unitPrice: 3.50,
    totalValue: 3500.00,
    toLocation: 'Freezer Unit B',
    batchNumber: 'AF2025012',
    referenceNumber: 'PO-2025-015',
    notes: 'Bulk purchase for winter season feeding',
    performedBy: 'Lisa Chen',
    timestamp: '2025-01-12T09:30:00Z',
    runningBalance: 2200,
  },
  {
    id: '6',
    itemId: 'SUPPLY-020',
    itemName: 'Oxygen Tablets',
    itemSku: 'SUPPLY-020',
    movementType: 'out',
    reason: 'production',
    quantity: -60,
    unit: 'tablets',
    unitPrice: 0.75,
    totalValue: -45.00,
    fromLocation: 'Warehouse A',
    toLocation: 'Emergency Kit A',
    referenceNumber: 'EMRG-2025-001',
    notes: 'Emergency response kit restocking',
    performedBy: 'Tom Garcia',
    timestamp: '2025-01-12T16:10:00Z',
    runningBalance: 340,
  },
  {
    id: '7',
    itemId: 'EQUIP-025',
    itemName: 'Aerator Pumps (1HP)',
    itemSku: 'EQUIP-025',
    movementType: 'adjustment',
    reason: 'adjustment',
    quantity: -1,
    unit: 'units',
    unitPrice: 450.00,
    totalValue: -450.00,
    fromLocation: 'Warehouse B',
    referenceNumber: 'ADJ-2025-001',
    notes: 'Unit damaged during installation - write-off',
    performedBy: 'Mark Taylor',
    timestamp: '2025-01-10T13:20:00Z',
    runningBalance: 8,
  },
  {
    id: '8',
    itemId: 'MED-008',
    itemName: 'Antibiotic Treatment',
    itemSku: 'MED-008',
    movementType: 'in',
    reason: 'purchase',
    quantity: 25,
    unit: 'vials',
    unitPrice: 32.00,
    totalValue: 800.00,
    toLocation: 'Medical Storage',
    batchNumber: 'VM2025003',
    referenceNumber: 'PO-2025-008',
    notes: 'Emergency restock for disease outbreak prevention',
    performedBy: 'Dr. Emily White',
    timestamp: '2025-01-03T10:45:00Z',
    runningBalance: 45,
  },
];

export default function StockMovements() {
  const [page, setPage] = React.useState(1);
  const [filter, setFilter] = React.useState({
    search: '',
    movementType: '',
    reason: '',
    dateFrom: '',
    dateTo: '',
  });

  // Filter movements
  const filteredMovements = React.useMemo(() => {
    let filtered = [...mockStockMovements];

    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      filtered = filtered.filter(movement =>
        movement.itemName.toLowerCase().includes(searchLower) ||
        movement.itemSku.toLowerCase().includes(searchLower) ||
        movement.performedBy.toLowerCase().includes(searchLower) ||
        movement.referenceNumber?.toLowerCase().includes(searchLower) ||
        movement.notes?.toLowerCase().includes(searchLower)
      );
    }

    // Apply movement type filter
    if (filter.movementType) {
      filtered = filtered.filter(movement => movement.movementType === filter.movementType);
    }

    // Apply reason filter
    if (filter.reason) {
      filtered = filtered.filter(movement => movement.reason === filter.reason);
    }

    // Apply date filters
    if (filter.dateFrom) {
      filtered = filtered.filter(movement => 
        new Date(movement.timestamp) >= new Date(filter.dateFrom)
      );
    }

    if (filter.dateTo) {
      filtered = filtered.filter(movement => 
        new Date(movement.timestamp) <= new Date(filter.dateTo)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return filtered;
  }, [filter]);

  // Pagination
  const totalMovements = filteredMovements.length;
  const totalPages = Math.ceil(totalMovements / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedMovements = filteredMovements.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filter]);

  const getMovementIcon = (type: string, reason: string) => {
    if (type === 'in') {
      return <ArrowUp className="h-4 w-4 text-green-600" />;
    } else if (type === 'out') {
      return <ArrowDown className="h-4 w-4 text-red-600" />;
    } else {
      return <RotateCcw className="h-4 w-4 text-blue-600" />;
    }
  };

  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'purchase':
        return <Truck className="h-3 w-3" />;
      case 'sale':
        return <Package className="h-3 w-3" />;
      case 'transfer':
        return <RotateCcw className="h-3 w-3" />;
      case 'adjustment':
        return <AlertTriangle className="h-3 w-3" />;
      default:
        return <FileText className="h-3 w-3" />;
    }
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'purchase': 'Purchase',
      'sale': 'Sale',
      'transfer': 'Transfer',
      'adjustment': 'Adjustment',
      'waste': 'Waste',
      'return': 'Return',
      'production': 'Production Use',
    };
    return reasonMap[reason] || reason;
  };

  const getMovementColor = (type: string) => {
    switch (type) {
      case 'in':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'out':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'adjustment':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search Movements
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                id="search"
                value={filter.search}
                onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                placeholder="Search by item, SKU, reference..."
                className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Movement Type */}
          <div>
            <label htmlFor="movementType" className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type
            </label>
            <select
              id="movementType"
              value={filter.movementType}
              onChange={(e) => setFilter({ ...filter, movementType: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Types</option>
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <select
              id="reason"
              value={filter.reason}
              onChange={(e) => setFilter({ ...filter, reason: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Reasons</option>
              <option value="purchase">Purchase</option>
              <option value="sale">Sale</option>
              <option value="transfer">Transfer</option>
              <option value="adjustment">Adjustment</option>
              <option value="waste">Waste</option>
              <option value="return">Return</option>
              <option value="production">Production Use</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              type="date"
              id="dateFrom"
              value={filter.dateFrom}
              onChange={(e) => setFilter({ ...filter, dateFrom: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              type="date"
              id="dateTo"
              value={filter.dateTo}
              onChange={(e) => setFilter({ ...filter, dateTo: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">Quick filters:</span>
          <button
            onClick={() => setFilter({ ...filter, movementType: 'in' })}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
          >
            Stock In
          </button>
          <button
            onClick={() => setFilter({ ...filter, movementType: 'out' })}
            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
          >
            Stock Out
          </button>
          <button
            onClick={() => setFilter({ ...filter, reason: 'purchase' })}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
          >
            Purchases
          </button>
          <button
            onClick={() => setFilter({ ...filter, reason: 'sale' })}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
          >
            Sales
          </button>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Stock Movements ({totalMovements.toLocaleString()})
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
                  Movement Details
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Item & Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value & Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference & Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By & Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedMovements.map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center border ${getMovementColor(movement.movementType)}`}>
                        {getMovementIcon(movement.movementType, movement.reason)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {movement.movementType.toUpperCase()}
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          {getReasonIcon(movement.reason)}
                          <span className="ml-1">{getReasonLabel(movement.reason)}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {movement.itemName}
                    </div>
                    <div className="text-sm text-blue-600">
                      {movement.itemSku}
                    </div>
                    <div className="text-sm text-gray-900 font-medium mt-1">
                      {movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)} {movement.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Balance: {formatNumber(movement.runningBalance)} {movement.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {movement.totalValue && (
                      <div className={`text-sm font-medium ${movement.totalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {movement.totalValue >= 0 ? '+' : ''}{formatCurrency(movement.totalValue)}
                      </div>
                    )}
                    {movement.unitPrice && (
                      <div className="text-sm text-gray-500">
                        {formatCurrency(movement.unitPrice)}/{movement.unit}
                      </div>
                    )}
                    <div className="text-sm text-gray-900 mt-1">
                      {movement.fromLocation && `From: ${movement.fromLocation}`}
                      {movement.toLocation && `To: ${movement.toLocation}`}
                      {!movement.fromLocation && !movement.toLocation && '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {movement.referenceNumber && (
                      <div className="text-sm font-medium text-gray-900">
                        {movement.referenceNumber}
                      </div>
                    )}
                    {movement.batchNumber && (
                      <div className="text-sm text-gray-500">
                        Batch: {movement.batchNumber}
                      </div>
                    )}
                    {movement.notes && (
                      <div className="text-sm text-gray-600 mt-1 max-w-xs truncate">
                        {movement.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <User className="h-3 w-3 mr-1" />
                      {movement.performedBy}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDate(movement.timestamp, 'long')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-200">
          {paginatedMovements.map((movement) => (
            <div key={movement.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className={`h-6 w-6 rounded-lg flex items-center justify-center border ${getMovementColor(movement.movementType)}`}>
                    {getMovementIcon(movement.movementType, movement.reason)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {movement.itemName}
                    </div>
                    <div className="text-xs text-blue-600">
                      {movement.itemSku}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {movement.quantity > 0 ? '+' : ''}{formatNumber(movement.quantity)} {movement.unit}
                  </div>
                  {movement.totalValue && (
                    <div className={`text-sm ${movement.totalValue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {movement.totalValue >= 0 ? '+' : ''}{formatCurrency(movement.totalValue)}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Movement Type</div>
                  <div className="flex items-center text-sm text-gray-900">
                    {getReasonIcon(movement.reason)}
                    <span className="ml-1">{getReasonLabel(movement.reason)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Running Balance</div>
                  <div className="text-sm text-gray-900">
                    {formatNumber(movement.runningBalance)} {movement.unit}
                  </div>
                </div>
              </div>
              
              {movement.notes && (
                <div className="mb-3">
                  <div className="text-xs text-gray-500 mb-1">Notes</div>
                  <div className="text-sm text-gray-600">
                    {movement.notes}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center">
                  <User className="h-3 w-3 mr-1" />
                  {movement.performedBy}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDate(movement.timestamp, 'short')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, totalMovements)} of {totalMovements} movements
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
    </div>
  );
}