'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import {
  Filter,
  MapPin,
  Users,
  Calendar,
  DollarSign,
  Package,
  Phone,
  Mail,
  MessageSquare,
  Eye,
  Plus,
  Layers,
  Target,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Shield
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';

// Dynamic imports for Leaflet components
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Memoized Map Component to prevent re-renders
const MemoizedMapContainer = React.memo(function MemoizedMapContainer({ 
  customers, 
  onNewOrder, 
  onViewProfile, 
  onSendMessage 
}: { 
  customers: Customer[];
  onNewOrder?: (customerId: string) => void;
  onViewProfile?: (customerId: string) => void;
  onSendMessage?: (customerId: string) => void;
}) {
  return (
    <MapContainer
      center={[-2.5, 118]} // Center on Indonesia
      zoom={5}
      scrollWheelZoom={false}
      style={{ height: '600px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />
      
      {customers.map((customer) => {
        try {
          return (
            <Marker
              key={customer.id}
              position={[customer.latitude, customer.longitude]}
            >
            <Popup className="customer-popup">
              <div className="p-2 min-w-[300px]">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{customer.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {customer.country}, {customer.province}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    customer.status === 'active' ? 'bg-green-100 text-green-800' :
                    customer.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {customer.status}
                  </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="flex items-center">
                    <Package className="h-3 w-3 text-blue-500 mr-1" />
                    <span className="text-xs text-gray-600">{customer.totalOrders} orders</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 text-green-500 mr-1" />
                    <span className="text-xs text-gray-600">${customer.totalValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 text-purple-500 mr-1" />
                    <span className="text-xs text-gray-600">
                      {customer.lastOrderDate ? format(customer.lastOrderDate, 'MMM dd') : 'No orders'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {customer.credentials.length > 0 && customer.credentials[0].status === 'valid' ? (
                      <CheckCircle className="h-3 w-3 text-green-500 mr-1" />
                    ) : customer.credentials.length > 0 && customer.credentials[0].status === 'expiring' ? (
                      <AlertTriangle className="h-3 w-3 text-yellow-500 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 text-red-500 mr-1" />
                    )}
                    <span className="text-xs text-gray-600">
                      {customer.credentials.length > 0 ? customer.credentials[0].status : 'No creds'}
                    </span>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="border-t pt-3 mb-3">
                  <div className="flex items-center mb-1">
                    <Users className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-600">{customer.primaryContactName}</span>
                  </div>
                  {customer.primaryContactPhone && (
                    <div className="flex items-center mb-1">
                      <Phone className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-600">{customer.primaryContactPhone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 text-gray-400 mr-1" />
                      <span className="text-xs text-gray-600">{customer.email}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => onNewOrder?.(customer.id)}
                    className="text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Order
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewProfile?.(customer.id)}
                    className="text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Profile
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onSendMessage?.(customer.id)}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
          );
        } catch (error) {
          console.error('Error rendering marker for customer:', customer.id, error);
          return null;
        }
      })}
    </MapContainer>
  );
});

// Helper function moved outside component to prevent re-definition
const getCredentialSummary = (customer: Customer) => {
  const valid = customer.credentials.filter(c => c.status === 'valid').length;
  const expiring = customer.credentials.filter(c => c.status === 'expiring').length;
  const expired = customer.credentials.filter(c => c.status === 'expired').length;
  
  if (expired > 0) return `${expired} expired`;
  if (expiring > 0) return `${expiring} expiring`;
  if (valid > 0) return `${valid} valid`;
  return 'No credentials';
};

interface Customer {
  id: string;
  name: string;
  primaryContactName: string;
  primaryContactPhone: string;
  email: string;
  addressText: string;
  latitude: number;
  longitude: number;
  country: string;
  province: string;
  district: string;
  credentials: Array<{
    id: string;
    type: string;
    status: 'valid' | 'expiring' | 'expired';
  }>;
  status: 'active' | 'paused' | 'blacklisted';
  totalOrders: number;
  totalValue: number;
  lastOrderDate?: Date;
  averageOrderValue: number;
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
  recentSpecies: string[];
}

interface CustomerMapProps {
  onNewOrder?: (customerId: string) => void;
  onViewProfile?: (customerId: string) => void;
  onSendMessage?: (customerId: string) => void;
}

const CustomerMap = React.memo(function CustomerMap({ onNewOrder, onViewProfile, onSendMessage }: CustomerMapProps) {
  const [filters, setFilters] = useState({
    dateRange: 'all',
    customerStatus: 'all',
    credentialStatus: 'all',
    country: 'all',
    species: 'all'
  });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Ensure we're on client side before rendering map  
  useEffect(() => {
    setIsClient(true);
    
    // Fix Leaflet default icons on client side
    if (typeof window !== 'undefined') {
      import('leaflet').then((L) => {
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        });
      });
    }
  }, []);

  // Fetch customer locations from API
  const { data: customerLocationData, isLoading, error } = useQuery({
    queryKey: ['customer-locations'],
    queryFn: () => apiClient.getCustomerLocations({ limit: 100 }),
  });

  // Transform API data to match component interface
  const customers: Customer[] = useMemo(() => {
    if (!customerLocationData?.locations) return [];
    
    return customerLocationData.locations.map((location: any) => ({
      id: location.id,
      name: location.name,
      primaryContactName: 'Contact', // API doesn't return this field
      primaryContactPhone: '', // API doesn't return this field
      email: '', // API doesn't return this field
      addressText: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      country: location.country,
      province: '', // API doesn't return this field
      district: '', // API doesn't return this field
      credentials: location.credentialStatus === 'valid' 
        ? [{ id: '1', type: 'Business License', status: 'valid' as const }]
        : location.credentialStatus === 'expiring'
        ? [{ id: '1', type: 'Business License', status: 'expiring' as const }]
        : [{ id: '1', type: 'Business License', status: 'expired' as const }],
      status: location.status,
      totalOrders: location.orderCount || 0,
      totalValue: location.revenue || 0,
      lastOrderDate: location.lastOrderDate ? new Date(location.lastOrderDate) : undefined,
      averageOrderValue: location.orderCount > 0 ? (location.revenue || 0) / location.orderCount : 0,
      paymentHistory: location.revenue > 50000 ? 'excellent' as const : 
                     location.revenue > 20000 ? 'good' as const :
                     location.revenue > 5000 ? 'fair' as const : 'poor' as const,
      recentSpecies: ['Penaeus vannamei', 'Penaeus monodon'], // Default species
    }));
  }, [customerLocationData]);

  // Filter customers based on current filters
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      // Date range filter
      if (filters.dateRange !== 'all' && customer.lastOrderDate) {
        const daysSince = Math.floor((Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24));
        if (filters.dateRange === '30' && daysSince > 30) return false;
        if (filters.dateRange === '90' && daysSince > 90) return false;
        if (filters.dateRange === '365' && daysSince > 365) return false;
      }

      // Customer status filter
      if (filters.customerStatus !== 'all' && customer.status !== filters.customerStatus) {
        return false;
      }

      // Credential status filter
      if (filters.credentialStatus !== 'all') {
        const hasStatus = customer.credentials.some(c => c.status === filters.credentialStatus);
        if (!hasStatus) return false;
      }

      // Country filter
      if (filters.country !== 'all' && customer.country !== filters.country) {
        return false;
      }

      // Species filter
      if (filters.species !== 'all') {
        const hasSpecies = customer.recentSpecies.includes(filters.species);
        if (!hasSpecies) return false;
      }

      return true;
    });
  }, [customers, filters]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const total = filteredCustomers.length;
    const active = filteredCustomers.filter(c => c.status === 'active').length;
    const credentialIssues = filteredCustomers.filter(c => 
      c.credentials.some(cred => cred.status === 'expired' || cred.status === 'expiring')
    ).length;
    const totalValue = filteredCustomers.reduce((sum, c) => sum + c.totalValue, 0);
    const countries = [...new Set(filteredCustomers.map(c => c.country))];

    return {
      totalCustomers: total,
      activeCustomers: active,
      credentialIssues,
      totalValue,
      topCountries: countries.slice(0, 3),
    };
  }, [filteredCustomers]);

  // Show loading or error states AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading customer locations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load customer locations</p>
          <p className="text-gray-500 text-sm">{error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }

  if (!isClient) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Map</h1>
            <p className="text-gray-600">Geographic distribution and customer insights</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={showHeatmap ? 'primary' : 'outline'}
            onClick={() => setShowHeatmap(!showHeatmap)}
            icon={<Layers className="h-4 w-4" />}
          >
            {showHeatmap ? 'Hide' : 'Show'} Heatmap
          </Button>
          <Button
            variant="outline"
            icon={<Target className="h-4 w-4" />}
          >
            Center Map
          </Button>
        </div>
      </div>

      {/* Filters Panel - Moved to top */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Filters</h3>
          <Filter className="h-4 w-4 text-gray-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last Quarter</option>
              <option value="365">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Status</label>
            <select
              value={filters.customerStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, customerStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credentials</label>
            <select
              value={filters.credentialStatus}
              onChange={(e) => setFilters(prev => ({ ...prev, credentialStatus: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Credentials</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <select
              value={filters.country}
              onChange={(e) => setFilters(prev => ({ ...prev, country: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Countries</option>
              <option value="Indonesia">Indonesia</option>
              <option value="Thailand">Thailand</option>
              <option value="Vietnam">Vietnam</option>
              <option value="Philippines">Philippines</option>
              <option value="Malaysia">Malaysia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Species</label>
            <select
              value={filters.species}
              onChange={(e) => setFilters(prev => ({ ...prev, species: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Species</option>
              <option value="Penaeus vannamei">Penaeus vannamei</option>
              <option value="Penaeus monodon">Penaeus monodon</option>
              <option value="Penaeus japonicus">Penaeus japonicus</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with Legend and Stats */}
        <div className="lg:col-span-1">
          {/* Legend */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="font-medium text-gray-900 mb-4">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-600">Valid Credentials</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                <span className="text-sm text-gray-600">Expiring Credentials</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                <span className="text-sm text-gray-600">Expired/Missing Credentials</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Customers</span>
                <span className="text-sm font-medium text-gray-900">{summary.totalCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-sm font-medium text-gray-900">{summary.activeCustomers}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Credential Issues</span>
                <span className="text-sm font-medium text-gray-900">{summary.credentialIssues}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Value</span>
                <span className="text-sm font-medium text-gray-900">${summary.totalValue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h3 className="font-medium text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-2">
              {summary.topCountries.map((country, index) => {
                const countryCustomers = filteredCustomers.filter(c => c.country === country).length;
                const countryValue = filteredCustomers
                  .filter(c => c.country === country)
                  .reduce((sum, c) => sum + c.totalValue, 0);
                
                return (
                  <div key={country} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{country}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{countryCustomers}</div>
                      <div className="text-xs text-gray-500">${countryValue.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <MemoizedMapContainer 
              customers={filteredCustomers}
              onNewOrder={onNewOrder}
              onViewProfile={onViewProfile}
              onSendMessage={onSendMessage}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomerMap;