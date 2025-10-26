'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
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

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
                  <div>
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      Last Order
                    </div>
                    <div className="font-medium">
                      {customer.lastOrderDate ? format(customer.lastOrderDate, 'MMM dd, yyyy') : 'Never'}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-600">
                      <DollarSign className="h-3 w-3 mr-1" />
                      Total Value
                    </div>
                    <div className="font-medium">${customer.totalValue.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-600">
                      <Package className="h-3 w-3 mr-1" />
                      Orders
                    </div>
                    <div className="font-medium">{customer.totalOrders}</div>
                  </div>
                  <div>
                    <div className="flex items-center text-gray-600">
                      <Shield className="h-3 w-3 mr-1" />
                      Credentials
                    </div>
                    <div className="font-medium">{getCredentialSummary(customer)}</div>
                  </div>
                </div>

                {/* Contact */}
                <div className="mb-3 text-sm">
                  <div className="font-medium text-gray-900 mb-1">{customer.primaryContactName}</div>
                  <div className="flex items-center space-x-3 text-gray-600">
                    <span className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {customer.primaryContactPhone}
                    </span>
                    <span className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {customer.email}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => onNewOrder?.(customer.id)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Order
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => onViewProfile?.(customer.id)}
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

  // Indonesian aquaculture customers data
  const customers: Customer[] = useMemo(() => [
    {
      id: 'CUST-001',
      name: 'PT Aquafarm Nusantara',
      primaryContactName: 'Budi Santoso',
      primaryContactPhone: '+62-21-8520-3456',
      email: 'budi@aquafarmnusantara.id',
      addressText: 'Jl. Gatot Subroto No. 45, Jakarta Selatan',
      latitude: -6.2088,
      longitude: 106.8456,
      country: 'Indonesia',
      province: 'DKI Jakarta',
      district: 'Jakarta Selatan',
      credentials: [
        { id: 'C1', type: 'Surat Izin Usaha Perikanan', status: 'valid' },
        { id: 'C2', type: 'AMDAL Certificate', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 18,
      totalValue: 245000,
      lastOrderDate: new Date('2024-03-15'),
      averageOrderValue: 13611,
      paymentHistory: 'excellent',
      recentSpecies: ['Penaeus vannamei', 'Penaeus monodon']
    },
    {
      id: 'CUST-002',
      name: 'CV Udang Jaya Surabaya',
      primaryContactName: 'Siti Rahayu',
      primaryContactPhone: '+62-31-567-8901',
      email: 'siti@udangjaya.co.id',
      addressText: 'Jl. Raya Kenjeran No. 123, Surabaya',
      latitude: -7.2575,
      longitude: 112.7521,
      country: 'Indonesia',
      province: 'Jawa Timur',
      district: 'Surabaya',
      credentials: [
        { id: 'C3', type: 'Izin Usaha Mikro Kecil', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 12,
      totalValue: 89500,
      lastOrderDate: new Date('2024-03-08'),
      averageOrderValue: 7458,
      paymentHistory: 'good',
      recentSpecies: ['Penaeus vannamei']
    },
    {
      id: 'CUST-003',
      name: 'PT Shrimp Indonesia Sejahtera',
      primaryContactName: 'Agus Wijaya',
      primaryContactPhone: '+62-361-234-5678',
      email: 'agus@shrimpindonesia.id',
      addressText: 'Jl. Bypass Ngurah Rai, Denpasar, Bali',
      latitude: -8.6500,
      longitude: 115.2167,
      country: 'Indonesia',
      province: 'Bali',
      district: 'Denpasar',
      credentials: [
        { id: 'C4', type: 'Surat Izin Usaha Perikanan', status: 'expiring' },
        { id: 'C5', type: 'Halal Certificate', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 15,
      totalValue: 156000,
      lastOrderDate: new Date('2024-02-28'),
      averageOrderValue: 10400,
      paymentHistory: 'excellent',
      recentSpecies: ['Penaeus monodon', 'Penaeus vannamei']
    },
    {
      id: 'CUST-004',
      name: 'Tambak Windu Lampung',
      primaryContactName: 'Dedi Kurniawan',
      primaryContactPhone: '+62-721-456-7890',
      email: 'dedi@tambakwindu.id',
      addressText: 'Jl. Soekarno-Hatta KM 15, Bandar Lampung',
      latitude: -5.3971,
      longitude: 105.2668,
      country: 'Indonesia',
      province: 'Lampung',
      district: 'Bandar Lampung',
      credentials: [
        { id: 'C6', type: 'SIUP Perikanan', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 8,
      totalValue: 67500,
      lastOrderDate: new Date('2024-03-12'),
      averageOrderValue: 8437,
      paymentHistory: 'good',
      recentSpecies: ['Penaeus monodon']
    },
    {
      id: 'CUST-005',
      name: 'PT Aqua Marine Medan',
      primaryContactName: 'Rahman Hakim',
      primaryContactPhone: '+62-61-789-0123',
      email: 'rahman@aquamarine-medan.co.id',
      addressText: 'Jl. Sisingamangaraja No. 88, Medan',
      latitude: 3.5952,
      longitude: 98.6722,
      country: 'Indonesia',
      province: 'Sumatera Utara',
      district: 'Medan',
      credentials: [
        { id: 'C7', type: 'Izin Lingkungan', status: 'expired' }
      ],
      status: 'paused',
      totalOrders: 5,
      totalValue: 38000,
      lastOrderDate: new Date('2023-11-20'),
      averageOrderValue: 7600,
      paymentHistory: 'fair',
      recentSpecies: ['Penaeus vannamei']
    },
    {
      id: 'CUST-006',
      name: 'Koperasi Udang Makassar',
      primaryContactName: 'Andi Mappaseng',
      primaryContactPhone: '+62-411-345-6789',
      email: 'andi@kopeudang-makassar.id',
      addressText: 'Jl. AP Pettarani No. 67, Makassar',
      latitude: -5.1477,
      longitude: 119.4327,
      country: 'Indonesia',
      province: 'Sulawesi Selatan',
      district: 'Makassar',
      credentials: [
        { id: 'C8', type: 'Akta Koperasi', status: 'valid' },
        { id: 'C9', type: 'SIUP Koperasi', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 10,
      totalValue: 92000,
      lastOrderDate: new Date('2024-03-05'),
      averageOrderValue: 9200,
      paymentHistory: 'excellent',
      recentSpecies: ['Penaeus japonicus', 'Penaeus vannamei']
    },
    {
      id: 'CUST-007',
      name: 'PT Bahari Sejahtera Pontianak',
      primaryContactName: 'Yusuf Hartono',
      primaryContactPhone: '+62-561-234-5678',
      email: 'yusuf@baharisejahtera.id',
      addressText: 'Jl. Ahmad Yani No. 156, Pontianak',
      latitude: -0.0263,
      longitude: 109.3425,
      country: 'Indonesia',
      province: 'Kalimantan Barat',
      district: 'Pontianak',
      credentials: [
        { id: 'C10', type: 'Izin Usaha Perikanan', status: 'expiring' }
      ],
      status: 'active',
      totalOrders: 6,
      totalValue: 45000,
      lastOrderDate: new Date('2024-01-18'),
      averageOrderValue: 7500,
      paymentHistory: 'good',
      recentSpecies: ['Penaeus monodon']
    },
    {
      id: 'CUST-008',
      name: 'Tambak Benur Aceh',
      primaryContactName: 'Cut Nyak Dien',
      primaryContactPhone: '+62-651-567-8901',
      email: 'cutnyak@tambakbenur-aceh.id',
      addressText: 'Jl. Teuku Umar No. 234, Banda Aceh',
      latitude: 5.5577,
      longitude: 95.3222,
      country: 'Indonesia',
      province: 'Aceh',
      district: 'Banda Aceh',
      credentials: [
        { id: 'C11', type: 'Surat Izin Khusus', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 4,
      totalValue: 28000,
      lastOrderDate: new Date('2024-02-14'),
      averageOrderValue: 7000,
      paymentHistory: 'good',
      recentSpecies: ['Penaeus vannamei']
    },
    {
      id: 'CUST-009',
      name: 'PT Laut Biru Balikpapan',
      primaryContactName: 'Irfan Maulana',
      primaryContactPhone: '+62-542-789-0123',
      email: 'irfan@lautbiru.co.id',
      addressText: 'Jl. Jenderal Sudirman No. 45, Balikpapan',
      latitude: -1.2379,
      longitude: 116.8531,
      country: 'Indonesia',
      province: 'Kalimantan Timur',
      district: 'Balikpapan',
      credentials: [
        { id: 'C12', type: 'AMDAL Laut', status: 'valid' },
        { id: 'C13', type: 'Izin Lokasi', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 14,
      totalValue: 118000,
      lastOrderDate: new Date('2024-03-10'),
      averageOrderValue: 8428,
      paymentHistory: 'excellent',
      recentSpecies: ['Penaeus monodon', 'Penaeus vannamei']
    },
    {
      id: 'CUST-010',
      name: 'CV Udang Organik Jogja',
      primaryContactName: 'Dewi Kartini',
      primaryContactPhone: '+62-274-345-6789',
      email: 'dewi@udangorganik-jogja.id',
      addressText: 'Jl. Malioboro No. 189, Yogyakarta',
      latitude: -7.7956,
      longitude: 110.3695,
      country: 'Indonesia',
      province: 'DI Yogyakarta',
      district: 'Yogyakarta',
      credentials: [
        { id: 'C14', type: 'Sertifikat Organik', status: 'valid' },
        { id: 'C15', type: 'Izin Usaha Kecil', status: 'expiring' }
      ],
      status: 'active',
      totalOrders: 7,
      totalValue: 52500,
      lastOrderDate: new Date('2024-02-25'),
      averageOrderValue: 7500,
      paymentHistory: 'good',
      recentSpecies: ['Penaeus vannamei']
    },
    {
      id: 'CUST-011',
      name: 'PT Indo Shrimp Export',
      primaryContactName: 'Tommy Wijaya',
      primaryContactPhone: '+62-22-678-9012',
      email: 'tommy@indoshrimpexport.id',
      addressText: 'Jl. Asia Afrika No. 78, Bandung',
      latitude: -6.9175,
      longitude: 107.6191,
      country: 'Indonesia',
      province: 'Jawa Barat',
      district: 'Bandung',
      credentials: [
        { id: 'C16', type: 'Izin Ekspor', status: 'valid' },
        { id: 'C17', type: 'HACCP Certificate', status: 'valid' }
      ],
      status: 'active',
      totalOrders: 22,
      totalValue: 198000,
      lastOrderDate: new Date('2024-03-18'),
      averageOrderValue: 9000,
      paymentHistory: 'excellent',
      recentSpecies: ['Penaeus monodon', 'Penaeus vannamei', 'Penaeus japonicus']
    }
  ], []);

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
      if (filters.customerStatus !== 'all' && customer.status !== filters.customerStatus) return false;

      // Credential status filter
      if (filters.credentialStatus !== 'all') {
        const hasValid = customer.credentials.some(c => c.status === 'valid');
        const hasExpiring = customer.credentials.some(c => c.status === 'expiring');
        const hasExpired = customer.credentials.some(c => c.status === 'expired');
        
        if (filters.credentialStatus === 'valid' && !hasValid) return false;
        if (filters.credentialStatus === 'expiring' && !hasExpiring) return false;
        if (filters.credentialStatus === 'expired' && !hasExpired) return false;
      }

      // Country filter
      if (filters.country !== 'all' && customer.country !== filters.country) return false;

      // Species filter
      if (filters.species !== 'all' && !customer.recentSpecies.includes(filters.species)) return false;

      return true;
    });
  }, [customers, filters]);

  // Get marker color based on customer status and credentials
  const getMarkerColor = (customer: Customer) => {
    if (customer.status === 'blacklisted') return '#DC2626'; // Red
    
    const hasValidCredentials = customer.credentials.some(c => c.status === 'valid');
    const hasExpiringCredentials = customer.credentials.some(c => c.status === 'expiring');
    const hasExpiredCredentials = customer.credentials.some(c => c.status === 'expired');
    
    if (hasExpiredCredentials || customer.credentials.length === 0) return '#DC2626'; // Red
    if (hasExpiringCredentials) return '#F59E0B'; // Yellow
    if (hasValidCredentials) return '#10B981'; // Green
    
    return '#6B7280'; // Gray
  };


  // Using default Leaflet markers for simplicity and reliability

  const countries = [...new Set(customers.map(c => c.country))].sort();
  const species = [...new Set(customers.flatMap(c => c.recentSpecies))].sort();

  return (
    <div className="w-full h-full space-y-6" style={{ minHeight: 'calc(100vh - 3rem)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Map</h2>
          <p className="text-gray-600">Geographic view of customers with credential status</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={showHeatmap ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            <Layers className="h-4 w-4 mr-2" />
            {showHeatmap ? 'Hide' : 'Show'} Heatmap
          </Button>
          <Button variant="outline" size="sm">
            <Target className="h-4 w-4 mr-2" />
            Center Map
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
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
              {species.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setFilters({
                dateRange: 'all',
                customerStatus: 'all',
                credentialStatus: 'all',
                country: 'all',
                species: 'all'
              })}
            >
              <Filter className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Map and Legend */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full h-full">
        {/* Map Container */}
        <div className="lg:col-span-3 bg-white rounded-lg border border-gray-200 overflow-hidden w-full h-full">
          <div className="w-full relative" style={{ height: '600px' }}>
            {isClient ? (
              <MemoizedMapContainer
                customers={filteredCustomers}
                onNewOrder={onNewOrder}
                onViewProfile={onViewProfile}
                onSendMessage={onSendMessage}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600">Loading map...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend and Stats */}
        <div className="space-y-6">
          {/* Legend */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Legend</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-600">Valid Credentials</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-sm text-gray-600">Expiring Credentials</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-600">Expired/Missing Credentials</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Customers</span>
                  <span className="font-medium">{filteredCustomers.length}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Active</span>
                  <span className="font-medium text-green-600">
                    {filteredCustomers.filter(c => c.status === 'active').length}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Credential Issues</span>
                  <span className="font-medium text-yellow-600">
                    {filteredCustomers.filter(c => 
                      c.credentials.some(cred => cred.status === 'expiring' || cred.status === 'expired')
                    ).length}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Value</span>
                  <span className="font-medium">
                    ${filteredCustomers.reduce((sum, c) => sum + c.totalValue, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Countries */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-900 mb-4">Top Countries</h3>
            <div className="space-y-2">
              {countries.slice(0, 5).map(country => {
                const countryCustomers = filteredCustomers.filter(c => c.country === country);
                const countryValue = countryCustomers.reduce((sum, c) => sum + c.totalValue, 0);
                
                return (
                  <div key={country} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{country}</span>
                    <div className="text-right">
                      <div className="font-medium">{countryCustomers.length}</div>
                      <div className="text-xs text-gray-500">${countryValue.toLocaleString()}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomerMap;