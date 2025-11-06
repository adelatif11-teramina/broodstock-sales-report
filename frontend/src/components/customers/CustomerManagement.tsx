'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  MapPin,
  Phone,
  Mail,
  Building,
  Calendar,
  FileText,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Users,
  DollarSign,
  Package,
  Clock,
  MoreHorizontal,
  Upload,
  Shield,
  Flag,
  Star,
  Target,
  Truck
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import Button from '@/components/ui/Button';
import CustomerInsightPanel from '@/components/customers/CustomerInsightPanel';

interface Credential {
  id: string;
  type: string;
  number: string;
  issuedDate: Date;
  expiryDate: Date;
  fileUrl: string;
  status: 'valid' | 'expiring' | 'expired';
}

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
  credentials: Credential[];
  status: 'active' | 'paused' | 'blacklisted';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  // Business metrics
  totalOrders: number;
  totalValue: number;
  lastOrderDate?: Date;
  averageOrderValue: number;
  paymentHistory: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CustomerManagementProps {
  onNewCustomer?: () => void;
}

export default function CustomerManagement({ onNewCustomer }: CustomerManagementProps = {}) {
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: 'CUST-001',
      name: 'Minh Phu Seafood Corporation',
      primaryContactName: 'Nguyen Van Minh',
      primaryContactPhone: '+84-28-123-4567',
      email: 'minh@minhphu.com',
      addressText: '123 Nguyen Hue Street, Can Tho, Vietnam',
      latitude: 10.0341,
      longitude: 105.7851,
      country: 'Vietnam',
      province: 'Can Tho',
      district: 'Ninh Kieu',
      credentials: [
        {
          id: 'CRED-001',
          type: 'Business License',
          number: 'BL-VN-2024-001',
          issuedDate: new Date('2024-01-15'),
          expiryDate: new Date('2025-01-15'),
          fileUrl: '/docs/minh-phu-license.pdf',
          status: 'valid'
        },
        {
          id: 'CRED-002',
          type: 'Export Permit',
          number: 'EP-VN-2024-005',
          issuedDate: new Date('2024-02-01'),
          expiryDate: new Date('2024-12-31'),
          fileUrl: '/docs/minh-phu-export.pdf',
          status: 'expiring'
        }
      ],
      status: 'active',
      createdBy: 'john.doe@company.com',
      createdAt: new Date('2023-06-15'),
      updatedAt: new Date('2024-02-20'),
      totalOrders: 15,
      totalValue: 125000,
      lastOrderDate: new Date('2024-02-20'),
      averageOrderValue: 8333,
      paymentHistory: 'excellent'
    },
    {
      id: 'CUST-002',
      name: 'Thai Union Aquaculture Ltd',
      primaryContactName: 'Somchai Tanaka',
      primaryContactPhone: '+66-2-555-0123',
      email: 'somchai@thaiunion.com',
      addressText: '456 Silom Road, Bangkok, Thailand',
      latitude: 13.7563,
      longitude: 100.5018,
      country: 'Thailand',
      province: 'Bangkok',
      district: 'Bang Rak',
      credentials: [
        {
          id: 'CRED-003',
          type: 'Aquaculture License',
          number: 'AL-TH-2023-012',
          issuedDate: new Date('2023-12-01'),
          expiryDate: new Date('2025-12-01'),
          fileUrl: '/docs/thai-union-license.pdf',
          status: 'valid'
        }
      ],
      status: 'active',
      createdBy: 'jane.smith@company.com',
      createdAt: new Date('2023-08-20'),
      updatedAt: new Date('2024-01-15'),
      totalOrders: 8,
      totalValue: 67500,
      lastOrderDate: new Date('2024-01-15'),
      averageOrderValue: 8437,
      paymentHistory: 'good'
    },
    {
      id: 'CUST-003',
      name: 'Coastal Aqua Farms Pvt Ltd',
      primaryContactName: 'Raj Patel',
      primaryContactPhone: '+91-22-2345-6789',
      email: 'raj@coastalaqua.in',
      addressText: '789 Marine Drive, Mumbai, India',
      latitude: 19.0760,
      longitude: 72.8777,
      country: 'India',
      province: 'Maharashtra',
      district: 'Mumbai',
      credentials: [
        {
          id: 'CRED-004',
          type: 'Import License',
          number: 'IL-IN-2024-003',
          issuedDate: new Date('2024-01-01'),
          expiryDate: new Date('2024-06-30'),
          fileUrl: '/docs/coastal-import.pdf',
          status: 'expired'
        }
      ],
      status: 'paused',
      createdBy: 'john.doe@company.com',
      createdAt: new Date('2023-11-10'),
      updatedAt: new Date('2024-03-01'),
      totalOrders: 3,
      totalValue: 18000,
      lastOrderDate: new Date('2023-12-15'),
      averageOrderValue: 6000,
      paymentHistory: 'fair'
    },
    {
      id: 'CUST-004',
      name: 'Indonesia Shrimp Holdings',
      primaryContactName: 'Ahmad Susanto',
      primaryContactPhone: '+62-21-555-7890',
      email: 'ahmad@shrimpholdings.id',
      addressText: '321 Jalan Sudirman, Jakarta, Indonesia',
      latitude: -6.2088,
      longitude: 106.8456,
      country: 'Indonesia',
      province: 'Jakarta',
      district: 'Central Jakarta',
      credentials: [
        {
          id: 'CRED-005',
          type: 'Business Registration',
          number: 'BR-ID-2024-007',
          issuedDate: new Date('2024-03-01'),
          expiryDate: new Date('2025-03-01'),
          fileUrl: '/docs/indonesia-registration.pdf',
          status: 'valid'
        }
      ],
      status: 'active',
      createdBy: 'jane.smith@company.com',
      createdAt: new Date('2024-02-28'),
      updatedAt: new Date('2024-03-01'),
      totalOrders: 1,
      totalValue: 2750,
      lastOrderDate: new Date('2024-03-01'),
      averageOrderValue: 2750,
      paymentHistory: 'good'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCredentials, setFilterCredentials] = useState<string>('all');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [insightCustomerId, setInsightCustomerId] = useState<string | null>(null);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(customer => {
      const matchesSearch = 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.primaryContactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.country.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
      const matchesCountry = filterCountry === 'all' || customer.country === filterCountry;
      
      const hasValidCredentials = customer.credentials.some(c => c.status === 'valid');
      const hasExpiringCredentials = customer.credentials.some(c => c.status === 'expiring');
      const hasExpiredCredentials = customer.credentials.some(c => c.status === 'expired');
      
      let matchesCredentials = true;
      if (filterCredentials === 'valid') matchesCredentials = hasValidCredentials;
      else if (filterCredentials === 'expiring') matchesCredentials = hasExpiringCredentials;
      else if (filterCredentials === 'expired') matchesCredentials = hasExpiredCredentials;
      
      return matchesSearch && matchesStatus && matchesCountry && matchesCredentials;
    });
  }, [customers, searchTerm, filterStatus, filterCredentials, filterCountry]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'blacklisted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCredentialStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentHistoryColor = (history: string) => {
    switch (history) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCredentialSummary = (customer: Customer) => {
    const valid = customer.credentials.filter(c => c.status === 'valid').length;
    const expiring = customer.credentials.filter(c => c.status === 'expiring').length;
    const expired = customer.credentials.filter(c => c.status === 'expired').length;
    
    if (expired > 0) return { status: 'expired', icon: XCircle, text: `${expired} expired` };
    if (expiring > 0) return { status: 'expiring', icon: AlertTriangle, text: `${expiring} expiring` };
    if (valid > 0) return { status: 'valid', icon: CheckCircle, text: `${valid} valid` };
    return { status: 'none', icon: AlertTriangle, text: 'No credentials' };
  };

  const toggleCustomerSelection = (customerId: string) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedCustomers(newSelected);
  };

  const selectAllCustomers = () => {
    if (selectedCustomers.size === filteredCustomers.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filteredCustomers.map(customer => customer.id)));
    }
  };

  const exportCustomers = () => {
    console.log('Exporting customers:', Array.from(selectedCustomers));
  };

  const countries = [...new Set(customers.map(c => c.country))].sort();

  const insightCustomer = useMemo(() => {
    if (!insightCustomerId) return null;
    return customers.find(customer => customer.id === insightCustomerId) || null;
  }, [customers, insightCustomerId]);

  useEffect(() => {
    if (insightCustomerId && !insightCustomer) {
      setInsightCustomerId(null);
    }
  }, [insightCustomerId, insightCustomer]);

  const openInsights = (customerId: string) => {
    setInsightCustomerId(customerId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customer Management</h2>
          <p className="text-gray-600">Manage customers and track credentials</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={onNewCustomer}>
            <Plus className="h-4 w-4 mr-2" />
            New Customer
          </Button>
          {selectedCustomers.size > 0 && (
            <Button variant="outline" onClick={exportCustomers}>
              <Download className="h-4 w-4 mr-2" />
              Export ({selectedCustomers.size})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers, contacts, email..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <div>
            <select
              value={filterCredentials}
              onChange={(e) => setFilterCredentials(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Credentials</option>
              <option value="valid">Valid</option>
              <option value="expiring">Expiring</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <select
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex-1"
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="flex-1"
            >
              Cards
            </Button>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCustomers.size > 0 && (
          <div className="mt-4 flex items-center space-x-3 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">{selectedCustomers.size} customers selected</span>
            <Button size="sm" variant="outline">
              <Mail className="h-4 w-4 mr-1" />
              Send Email
            </Button>
            <Button size="sm" variant="outline">
              <FileText className="h-4 w-4 mr-1" />
              Request Documents
            </Button>
            <Button size="sm" variant="outline" onClick={exportCustomers}>
              Export Data
            </Button>
          </div>
        )}
      </div>

      {/* Customers Display */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.size === filteredCustomers.length && filteredCustomers.length > 0}
                      onChange={selectAllCustomers}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credentials</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Business</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const credentialSummary = getCredentialSummary(customer);
                  const CredentialIcon = credentialSummary.icon;
                  
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomers.has(customer.id)}
                          onChange={() => toggleCustomerSelection(customer.id)}
                          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{customer.primaryContactName}</div>
                          <div className="text-sm text-gray-500 flex items-center space-x-3">
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
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {customer.country}
                          </div>
                          <div className="text-sm text-gray-500">{customer.province}, {customer.district}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCredentialStatusColor(credentialSummary.status)}`}>
                          <CredentialIcon className="h-3 w-3 mr-1" />
                          {credentialSummary.text}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                          {customer.status === 'active' && <CheckCircle className="h-3 w-3 mr-1" />}
                          {customer.status === 'paused' && <Clock className="h-3 w-3 mr-1" />}
                          {customer.status === 'blacklisted' && <XCircle className="h-3 w-3 mr-1" />}
                          {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="flex items-center text-gray-900">
                            <Package className="h-3 w-3 mr-1" />
                            {customer.totalOrders} orders
                          </div>
                          <div className="flex items-center text-gray-500">
                            <DollarSign className="h-3 w-3 mr-1" />
                            ${customer.totalValue.toLocaleString()}
                          </div>
                          <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPaymentHistoryColor(customer.paymentHistory)}`}>
                            {customer.paymentHistory}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => openInsights(customer.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No customers found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'Try adjusting your search criteria' : 'Get started by adding your first customer'}
              </p>
              <Button onClick={onNewCustomer}>
                <Plus className="h-4 w-4 mr-2" />
                Add Customer
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCustomers.map((customer) => {
            const credentialSummary = getCredentialSummary(customer);
            const CredentialIcon = credentialSummary.icon;
            
            return (
              <div
                key={customer.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1">{customer.name}</h3>
                    <p className="text-sm text-gray-500">{customer.id}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.has(customer.id)}
                      onChange={() => toggleCustomerSelection(customer.id)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(customer.status)}`}>
                      {customer.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.primaryContactName}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    {customer.country}, {customer.province}
                  </div>

                  <div className="flex items-center text-sm">
                    <CredentialIcon className={`h-4 w-4 mr-2 ${
                      credentialSummary.status === 'valid' ? 'text-green-500' :
                      credentialSummary.status === 'expiring' ? 'text-yellow-500' :
                      'text-red-500'
                    }`} />
                    <span className={`${
                      credentialSummary.status === 'valid' ? 'text-green-700' :
                      credentialSummary.status === 'expiring' ? 'text-yellow-700' :
                      'text-red-700'
                    }`}>
                      {credentialSummary.text}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                    <div>
                      <div className="text-xs text-gray-500">Total Orders</div>
                      <div className="font-medium text-gray-900">{customer.totalOrders}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total Value</div>
                      <div className="font-medium text-gray-900">${customer.totalValue.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getPaymentHistoryColor(customer.paymentHistory)}`}>
                      {customer.paymentHistory} payment
                    </span>
                    <div className="flex space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => openInsights(customer.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{filteredCustomers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCustomers.filter(c => c.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Credentials Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredCustomers.filter(c => c.credentials.some(cred => cred.status !== 'valid')).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredCustomers.reduce((sum, customer) => sum + customer.totalValue, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>
      {insightCustomer && (
        <CustomerInsightPanel
          customer={{
            id: insightCustomer.id,
            name: insightCustomer.name,
            primaryContactName: insightCustomer.primaryContactName,
            primaryContactPhone: insightCustomer.primaryContactPhone,
            email: insightCustomer.email,
            country: insightCustomer.country,
            province: insightCustomer.province,
            district: insightCustomer.district,
            status: insightCustomer.status,
            totalOrders: insightCustomer.totalOrders,
            totalValue: insightCustomer.totalValue,
            lastOrderDate: insightCustomer.lastOrderDate,
            credentials: insightCustomer.credentials,
            paymentHistory: insightCustomer.paymentHistory,
          }}
          onClose={() => setInsightCustomerId(null)}
        />
      )}
    </div>
  );
}
