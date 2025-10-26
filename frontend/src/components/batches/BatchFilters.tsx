'use client';

import React from 'react';
import { Search, Filter, Download, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';

interface BatchFilters {
  search: string;
  status: string;
  healthStatus: string;
  species: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface BatchFiltersProps {
  filters: BatchFilters;
  onFiltersChange: (filters: BatchFilters) => void;
}

const BATCH_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'growing', label: 'Growing' },
  { value: 'ready', label: 'Ready for Harvest' },
  { value: 'harvested', label: 'Harvested' },
  { value: 'terminated', label: 'Terminated' },
];

const HEALTH_STATUSES = [
  { value: '', label: 'All Health Status' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
  { value: 'critical', label: 'Critical' },
];

const SPECIES_OPTIONS = [
  { value: '', label: 'All Species' },
  { value: 'white_shrimp', label: 'White Shrimp (P. vannamei)' },
  { value: 'black_tiger', label: 'Black Tiger Shrimp (P. monodon)' },
  { value: 'giant_prawn', label: 'Giant Freshwater Prawn (M. rosenbergii)' },
  { value: 'pacific_white', label: 'Pacific White Shrimp' },
  { value: 'blue_shrimp', label: 'Blue Shrimp' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Created Date' },
  { value: 'batchId', label: 'Batch ID' },
  { value: 'species', label: 'Species' },
  { value: 'currentPopulation', label: 'Population' },
  { value: 'survivalRate', label: 'Survival Rate' },
  { value: 'daysOld', label: 'Age' },
  { value: 'healthScore', label: 'Health Score' },
];

export default function BatchFilters({ filters, onFiltersChange }: BatchFiltersProps) {
  const updateFilter = (key: keyof BatchFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleExport = () => {
    console.log('Exporting batch data with filters:', filters);
  };

  const resetFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      healthStatus: '',
      species: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search Batches
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              id="search"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by batch ID, tank, or notes..."
              className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Batch Status
          </label>
          <select
            id="status"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {BATCH_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Health Status Filter */}
        <div>
          <label htmlFor="healthStatus" className="block text-sm font-medium text-gray-700 mb-1">
            Health Status
          </label>
          <select
            id="healthStatus"
            value={filters.healthStatus}
            onChange={(e) => updateFilter('healthStatus', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {HEALTH_STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Species Filter */}
        <div>
          <label htmlFor="species" className="block text-sm font-medium text-gray-700 mb-1">
            Species
          </label>
          <select
            id="species"
            value={filters.species}
            onChange={(e) => updateFilter('species', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {SPECIES_OPTIONS.map((species) => (
              <option key={species.value} value={species.value}>
                {species.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sortBy"
            value={filters.sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
          onClick={() => updateFilter('healthStatus', 'critical')}
          className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
        >
          Critical Health
        </button>
        <button
          onClick={() => updateFilter('status', 'ready')}
          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
        >
          Ready for Harvest
        </button>
        <button
          onClick={() => updateFilter('species', 'white_shrimp')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
        >
          White Shrimp
        </button>
        <button
          onClick={() => updateFilter('sortBy', 'survivalRate')}
          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
        >
          By Survival Rate
        </button>
      </div>
    </div>
  );
}