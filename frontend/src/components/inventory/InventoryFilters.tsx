'use client';

import React from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';

interface InventoryFilters {
  search: string;
  category: string;
  status: string;
  location: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface InventoryFiltersProps {
  filters: InventoryFilters;
  onFiltersChange: (filters: InventoryFilters) => void;
}

const INVENTORY_CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'feed', label: 'Feed & Nutrition' },
  { value: 'medication', label: 'Medication' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'tools', label: 'Tools' },
  { value: 'maintenance', label: 'Maintenance' },
];

const STOCK_STATUSES = [
  { value: '', label: 'All Stock Levels' },
  { value: 'healthy', label: 'Healthy Stock' },
  { value: 'low', label: 'Low Stock' },
  { value: 'critical', label: 'Critical Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
  { value: 'overstock', label: 'Overstock' },
];

const WAREHOUSE_LOCATIONS = [
  { value: '', label: 'All Locations' },
  { value: 'warehouse_a', label: 'Warehouse A' },
  { value: 'warehouse_b', label: 'Warehouse B' },
  { value: 'lab_storage', label: 'Lab Storage' },
  { value: 'chemical_storage', label: 'Chemical Storage' },
  { value: 'medical_storage', label: 'Medical Storage' },
  { value: 'freezer_unit_a', label: 'Freezer Unit A' },
  { value: 'freezer_unit_b', label: 'Freezer Unit B' },
  { value: 'cold_storage', label: 'Cold Storage' },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Item Name' },
  { value: 'category', label: 'Category' },
  { value: 'currentStock', label: 'Current Stock' },
  { value: 'value', label: 'Value' },
  { value: 'lastRestocked', label: 'Last Restocked' },
  { value: 'turnoverRate', label: 'Turnover Rate' },
  { value: 'expiry', label: 'Expiry Date' },
];

export default function InventoryFilters({ filters, onFiltersChange }: InventoryFiltersProps) {
  const updateFilter = (key: keyof InventoryFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleExport = () => {
    console.log('Exporting inventory data with filters:', filters);
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      category: '',
      status: '',
      location: '',
      sortBy: 'name',
      sortOrder: 'asc',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Inventory
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by item name, SKU, or description..."
              className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {INVENTORY_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Stock Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Stock Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {STOCK_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            id="location"
            value={filters.location}
            onChange={(e) => updateFilter('location', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {WAREHOUSE_LOCATIONS.map((location) => (
              <option key={location.value} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <div className="flex space-x-1">
            <select
              id="sortBy"
              value={filters.sortBy}
              onChange={(e) => updateFilter('sortBy', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-2 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetFilters}
            className="flex-1"
          >
            <Filter className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Filter Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-500">Quick filters:</span>
        <button
          onClick={() => updateFilter('status', 'critical')}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
        >
          Critical Stock
        </button>
        <button
          onClick={() => updateFilter('status', 'low')}
          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full hover:bg-yellow-200 transition-colors"
        >
          Low Stock
        </button>
        <button
          onClick={() => updateFilter('category', 'feed')}
          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
        >
          Feed & Nutrition
        </button>
        <button
          onClick={() => updateFilter('category', 'medication')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
        >
          Medication
        </button>
        <button
          onClick={() => updateFilter('sortBy', 'turnoverRate')}
          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
        >
          By Turnover Rate
        </button>
        <button
          onClick={() => updateFilter('sortBy', 'expiry')}
          className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full hover:bg-orange-200 transition-colors"
        >
          By Expiry Date
        </button>
      </div>
    </div>
  );
}