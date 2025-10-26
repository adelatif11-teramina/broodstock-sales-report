'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Globe, TrendingUp, Users, DollarSign, Package } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency, formatNumber, getCountryFlag } from '@/lib/utils';

interface GeographicAnalyticsProps {
  timeRange: string;
}

export default function GeographicAnalytics({ timeRange }: GeographicAnalyticsProps) {
  const [viewMode, setViewMode] = React.useState<'countries' | 'regions' | 'cities'>('countries');

  // Mock geographic data
  const countryData = React.useMemo(() => [
    {
      country: 'Thailand',
      code: 'TH',
      revenue: 485000,
      customers: 156,
      orders: 342,
      avgOrderValue: 1418,
      growth: 23.5,
      marketShare: 42,
    },
    {
      country: 'Philippines',
      code: 'PH',
      revenue: 298000,
      customers: 89,
      orders: 198,
      avgOrderValue: 1505,
      growth: 18.2,
      marketShare: 26,
    },
    {
      country: 'Vietnam',
      code: 'VN',
      revenue: 187000,
      customers: 67,
      orders: 145,
      avgOrderValue: 1290,
      growth: 15.7,
      marketShare: 16,
    },
    {
      country: 'Indonesia',
      code: 'ID',
      revenue: 124000,
      customers: 45,
      orders: 89,
      avgOrderValue: 1393,
      growth: 8.9,
      marketShare: 11,
    },
    {
      country: 'Malaysia',
      code: 'MY',
      revenue: 67000,
      customers: 28,
      orders: 56,
      avgOrderValue: 1196,
      growth: 31.2,
      marketShare: 6,
    },
  ], []);

  const regionData = React.useMemo(() => [
    {
      region: 'Southeast Asia',
      countries: 5,
      revenue: 1161000,
      customers: 385,
      orders: 830,
      topCountry: 'Thailand',
      growth: 19.4,
    },
    {
      region: 'East Asia',
      countries: 2,
      revenue: 289000,
      customers: 78,
      orders: 165,
      topCountry: 'Taiwan',
      growth: 12.8,
    },
    {
      region: 'South Asia',
      countries: 3,
      revenue: 156000,
      customers: 42,
      orders: 89,
      topCountry: 'Bangladesh',
      growth: 25.6,
    },
  ], []);

  const cityData = React.useMemo(() => [
    { city: 'Bangkok', country: 'Thailand', revenue: 189000, customers: 45, orders: 128 },
    { city: 'Manila', country: 'Philippines', revenue: 156000, customers: 38, orders: 98 },
    { city: 'Ho Chi Minh City', country: 'Vietnam', revenue: 134000, customers: 32, orders: 76 },
    { city: 'Chiang Mai', country: 'Thailand', revenue: 98000, customers: 28, orders: 65 },
    { city: 'Cebu', country: 'Philippines', revenue: 87000, customers: 24, orders: 54 },
    { city: 'Jakarta', country: 'Indonesia', revenue: 76000, customers: 21, orders: 43 },
    { city: 'Kuala Lumpur', country: 'Malaysia', revenue: 67000, customers: 18, orders: 38 },
    { city: 'Hanoi', country: 'Vietnam', revenue: 53000, customers: 15, orders: 32 },
  ], []);

  const totalRevenue = countryData.reduce((sum, country) => sum + country.revenue, 0);
  const totalCustomers = countryData.reduce((sum, country) => sum + country.customers, 0);
  const totalOrders = countryData.reduce((sum, country) => sum + country.orders, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <Globe className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Geographic Analytics</h3>
            <p className="text-sm text-gray-500">Sales performance by geographic regions</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {(['countries', 'regions', 'cities'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                viewMode === mode
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Revenue</p>
              <p className="text-sm font-bold text-blue-900">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-green-600 mr-2" />
            <div>
              <p className="text-xs text-green-600 font-medium">Customers</p>
              <p className="text-sm font-bold text-green-900">
                {formatNumber(totalCustomers)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center">
            <Package className="h-4 w-4 text-purple-600 mr-2" />
            <div>
              <p className="text-xs text-purple-600 font-medium">Orders</p>
              <p className="text-sm font-bold text-purple-900">
                {formatNumber(totalOrders)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center">
            <MapPin className="h-4 w-4 text-orange-600 mr-2" />
            <div>
              <p className="text-xs text-orange-600 font-medium">Markets</p>
              <p className="text-sm font-bold text-orange-900">
                {countryData.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'countries' && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Performance by Country</h4>
          <div className="space-y-3">
            {countryData.map((country, index) => (
              <div key={country.code} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <span className="text-lg">{getCountryFlag(country.code)}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-medium text-gray-900">{country.country}</p>
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{country.customers} customers</span>
                      <span>{country.orders} orders</span>
                      <span>{country.marketShare}% share</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(country.revenue)}</p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">
                      AOV: {formatCurrency(country.avgOrderValue)}
                    </span>
                    <span className={`text-xs flex items-center ${
                      country.growth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-3 w-3 mr-1" />
                      {country.growth.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'regions' && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Performance by Region</h4>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {regionData.map((region, index) => (
              <div key={region.region} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-gray-900">{region.region}</h5>
                  <span className={`text-xs flex items-center ${
                    region.growth >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendingUp className="h-3 w-3 mr-1" />
                    {region.growth.toFixed(1)}%
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Revenue:</span>
                    <span className="font-medium">{formatCurrency(region.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Countries:</span>
                    <span className="font-medium">{region.countries}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customers:</span>
                    <span className="font-medium">{formatNumber(region.customers)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Orders:</span>
                    <span className="font-medium">{formatNumber(region.orders)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Top Market:</span>
                    <span className="font-medium">{region.topCountry}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === 'cities' && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Top Cities by Revenue</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cityData.map((city, index) => (
              <div key={`${city.city}-${city.country}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full">
                    <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{city.city}</p>
                    <p className="text-xs text-gray-500">{city.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{formatCurrency(city.revenue)}</p>
                  <div className="text-xs text-gray-500">
                    {city.customers} customers • {city.orders} orders
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Market Insights */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Market Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p>• <strong>Thailand</strong> represents 42% of total revenue with highest growth</p>
            <p>• <strong>Southeast Asia</strong> dominates with 85% market concentration</p>
          </div>
          <div>
            <p>• <strong>Urban centers</strong> (Bangkok, Manila) drive majority of sales</p>
            <p>• <strong>Emerging markets</strong> show promising 25%+ growth rates</p>
          </div>
        </div>
      </div>
    </div>
  );
}