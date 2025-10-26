'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Users, AlertCircle, Map } from 'lucide-react';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { getCountryFlag, formatNumber } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface CustomerLocation {
  id: string;
  city: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  customerCount: number;
  totalRevenue: number;
}

export default function CustomerMap() {
  const { data: customerLocations, isLoading, error } = useQuery({
    queryKey: queryKeys.customerLocations,
    queryFn: () => apiClient.getCustomerStats(),
  });

  // For now, we'll show a simple list instead of a full map
  // MapLibre implementation can be added later
  const topLocations = React.useMemo(() => {
    if (!customerLocations?.data) return [];
    
    return customerLocations.data
      .sort((a: CustomerLocation, b: CustomerLocation) => b.customerCount - a.customerCount)
      .slice(0, 10);
  }, [customerLocations]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Distribution</h3>
            <p className="text-sm text-gray-500">Geographic spread of customers</p>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Customer Distribution</h3>
            <p className="text-sm text-gray-500">Geographic spread of customers</p>
          </div>
        </div>
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading customer data</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Customer Distribution</h3>
          <p className="text-sm text-gray-500">Top locations by customer count</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-sm text-gray-500">
            <MapPin className="h-4 w-4 mr-1" />
            <span>{formatNumber(topLocations.length)} locations</span>
          </div>
          <Link href="/dashboard/analytics">
            <Button variant="outline" size="sm" icon={<Map className="h-4 w-4" />}>
              View Map
            </Button>
          </Link>
        </div>
      </div>

      <div className="space-y-4 h-80 overflow-y-auto">
        {topLocations.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">No customer data available</p>
            </div>
          </div>
        ) : (
          topLocations.map((location: CustomerLocation, index: number) => (
            <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center">
                <div className="flex-shrink-0 text-2xl mr-3">
                  {getCountryFlag(location.country)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {location.city}, {location.state}
                  </p>
                  <p className="text-sm text-gray-500">{location.country}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium text-gray-900">
                  {formatNumber(location.customerCount)} customers
                </p>
                <p className="text-sm text-gray-500">
                  Rank #{index + 1}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {topLocations.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Total customers: {formatNumber(topLocations.reduce((sum: number, loc: any) => sum + loc.customerCount, 0))}</span>
            <span>Across {formatNumber(topLocations.length)} locations</span>
          </div>
        </div>
      )}
    </div>
  );
}