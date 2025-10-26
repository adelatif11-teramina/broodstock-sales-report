'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Truck,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  MapPin,
  User,
  FileText,
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  Copy,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import Button from '@/components/ui/Button';

interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCountry: string;
  orderDate: Date;
  species: string;
  strain: string;
  broodstockBatchId?: string;
  quantity: number;
  unitPrice: number;
  currency: string;
  totalValue: number;
  packaging: string;
  shipmentDate: Date;
  shippedDate?: Date;
  shipmentStatus: 'pending' | 'shipped' | 'delivered' | 'problem';
  qualityFlag: 'ok' | 'minor_issue' | 'critical_issue';
  mortalityReported?: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderManagementProps {
  onNewOrder?: () => void;
}

export default function OrderManagement({ onNewOrder }: OrderManagementProps = {}) {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: 'ORD-2024-001',
      orderNumber: 'PO-VN-2024-001',
      customerId: 'CUST-001',
      customerName: 'Minh Phu Seafood Corp',
      customerCountry: 'Vietnam',
      orderDate: new Date('2024-01-15'),
      species: 'Penaeus vannamei',
      strain: 'SPF Line A',
      broodstockBatchId: 'BST-2023-087',
      quantity: 5000,
      unitPrice: 0.85,
      currency: 'USD',
      totalValue: 4250,
      packaging: 'Standard Transport Bags',
      shipmentDate: new Date('2024-01-25'),
      shippedDate: new Date('2024-01-24'),
      shipmentStatus: 'delivered',
      qualityFlag: 'ok',
      paymentStatus: 'paid',
      notes: 'Repeat customer - priority handling',
      createdBy: 'john.doe@company.com',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-24')
    },
    {
      id: 'ORD-2024-002',
      orderNumber: 'PO-TH-2024-002',
      customerId: 'CUST-002',
      customerName: 'Thai Union Aquaculture',
      customerCountry: 'Thailand',
      orderDate: new Date('2024-02-01'),
      species: 'Penaeus monodon',
      strain: 'Black Tiger Premium',
      broodstockBatchId: 'BST-2023-089',
      quantity: 3000,
      unitPrice: 1.25,
      currency: 'USD',
      totalValue: 3750,
      packaging: 'Insulated Containers',
      shipmentDate: new Date('2024-02-10'),
      shipmentStatus: 'shipped',
      qualityFlag: 'ok',
      paymentStatus: 'pending',
      notes: 'First-time customer - ensure quality documentation',
      createdBy: 'jane.smith@company.com',
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-08')
    },
    {
      id: 'ORD-2024-003',
      orderNumber: 'PO-IN-2024-003',
      customerId: 'CUST-003',
      customerName: 'Coastal Aqua Farms',
      customerCountry: 'India',
      orderDate: new Date('2024-02-15'),
      species: 'Penaeus vannamei',
      strain: 'Fast Growth Line',
      quantity: 8000,
      unitPrice: 0.75,
      currency: 'USD',
      totalValue: 6000,
      packaging: 'Oxygenated Transport Bags',
      shipmentDate: new Date('2024-02-28'),
      shipmentStatus: 'pending',
      qualityFlag: 'minor_issue',
      mortalityReported: 150,
      paymentStatus: 'partial',
      notes: 'Large order - coordinate with logistics team',
      createdBy: 'john.doe@company.com',
      createdAt: new Date('2024-02-15'),
      updatedAt: new Date('2024-02-20')
    },
    {
      id: 'ORD-2024-004',
      orderNumber: 'PO-ID-2024-004',
      customerId: 'CUST-004',
      customerName: 'Indonesia Shrimp Holdings',
      customerCountry: 'Indonesia',
      orderDate: new Date('2024-03-01'),
      species: 'Penaeus monodon',
      strain: 'Disease Resistant',
      quantity: 2500,
      unitPrice: 1.10,
      currency: 'USD',
      totalValue: 2750,
      packaging: 'Climate Controlled Containers',
      shipmentDate: new Date('2024-03-15'),
      shipmentStatus: 'pending',
      qualityFlag: 'ok',
      paymentStatus: 'pending',
      notes: 'Requires special handling due to import regulations',
      createdBy: 'jane.smith@company.com',
      createdAt: new Date('2024-03-01'),
      updatedAt: new Date('2024-03-01')
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.strain.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || order.shipmentStatus === filterStatus;
      const matchesQuality = filterQuality === 'all' || order.qualityFlag === filterQuality;
      const matchesPayment = filterPayment === 'all' || order.paymentStatus === filterPayment;
      
      return matchesSearch && matchesStatus && matchesQuality && matchesPayment;
    });
  }, [orders, searchTerm, filterStatus, filterQuality, filterPayment]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'problem': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'minor_issue': return 'bg-yellow-100 text-yellow-800';
      case 'critical_issue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentColor = (payment: string) => {
    switch (payment) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleOrderExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  const toggleOrderSelection = (orderId: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };

  const selectAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)));
    }
  };

  const exportOrders = () => {
    console.log('Exporting orders:', Array.from(selectedOrders));
    // Implementation for export functionality
  };

  const bulkUpdateStatus = (status: string) => {
    console.log('Bulk updating status to:', status, 'for orders:', Array.from(selectedOrders));
    // Implementation for bulk status update
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
          <p className="text-gray-600">Manage broodstock orders and track shipments</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={onNewOrder || (() => setShowNewOrderForm(true))}>
            <Plus className="h-4 w-4 mr-2" />
            New Order
          </Button>
          {selectedOrders.size > 0 && (
            <Button variant="outline" onClick={exportOrders}>
              <Download className="h-4 w-4 mr-2" />
              Export ({selectedOrders.size})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders, customers, species..."
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
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="problem">Problem</option>
            </select>
          </div>

          <div>
            <select
              value={filterQuality}
              onChange={(e) => setFilterQuality(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Quality</option>
              <option value="ok">OK</option>
              <option value="minor_issue">Minor Issue</option>
              <option value="critical_issue">Critical Issue</option>
            </select>
          </div>

          <div>
            <select
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="mt-4 flex items-center space-x-3 pt-4 border-t border-gray-200">
            <span className="text-sm text-gray-600">{selectedOrders.size} orders selected</span>
            <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('shipped')}>
              Mark Shipped
            </Button>
            <Button size="sm" variant="outline" onClick={() => bulkUpdateStatus('delivered')}>
              Mark Delivered
            </Button>
            <Button size="sm" variant="outline" onClick={exportOrders}>
              Export CSV
            </Button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={selectAllOrders}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Species</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quality</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleOrderExpansion(order.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {expandedOrders.has(order.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                        <div>
                          <div className="font-medium text-gray-900">{order.orderNumber}</div>
                          <div className="text-sm text-gray-500">{format(order.orderDate, 'MMM dd, yyyy')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {order.customerCountry}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{order.species}</div>
                        <div className="text-sm text-gray-500">{order.strain}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{order.quantity.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">{order.packaging}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        ${order.totalValue.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        ${order.unitPrice} per unit
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.shipmentStatus)}`}>
                        {order.shipmentStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                        {order.shipmentStatus === 'shipped' && <Truck className="h-3 w-3 mr-1" />}
                        {order.shipmentStatus === 'delivered' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {order.shipmentStatus === 'problem' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {order.shipmentStatus.charAt(0).toUpperCase() + order.shipmentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getQualityColor(order.qualityFlag)}`}>
                        {order.qualityFlag === 'ok' && <CheckCircle className="h-3 w-3 mr-1" />}
                        {order.qualityFlag !== 'ok' && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {order.qualityFlag.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentColor(order.paymentStatus)}`}>
                        <DollarSign className="h-3 w-3 mr-1" />
                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost">
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

                  {/* Expanded Row */}
                  {expandedOrders.has(order.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={10} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Shipment Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Planned Date:</span>
                                <span>{format(order.shipmentDate, 'MMM dd, yyyy')}</span>
                              </div>
                              {order.shippedDate && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Shipped Date:</span>
                                  <span>{format(order.shippedDate, 'MMM dd, yyyy')}</span>
                                </div>
                              )}
                              {order.broodstockBatchId && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Batch ID:</span>
                                  <span className="font-mono">{order.broodstockBatchId}</span>
                                </div>
                              )}
                              {order.mortalityReported && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Mortality:</span>
                                  <span className="text-red-600">{order.mortalityReported} units</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Order Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Created By:</span>
                                <span>{order.createdBy}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Created:</span>
                                <span>{format(order.createdAt, 'MMM dd, yyyy')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Last Updated:</span>
                                <span>{format(order.updatedAt, 'MMM dd, yyyy')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Currency:</span>
                                <span>{order.currency}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-3">Notes & Actions</h4>
                            <p className="text-sm text-gray-600 mb-3">{order.notes}</p>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <FileText className="h-4 w-4 mr-1" />
                                Invoice
                              </Button>
                              <Button size="sm" variant="outline">
                                <Copy className="h-4 w-4 mr-1" />
                                Duplicate
                              </Button>
                              <Button size="sm" variant="outline">
                                <Package className="h-4 w-4 mr-1" />
                                Track
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating your first order'}
            </p>
            <Button onClick={onNewOrder || (() => setShowNewOrderForm(true))}>
              <Plus className="h-4 w-4 mr-2" />
              Create Order
            </Button>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{filteredOrders.length}</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredOrders.reduce((sum, order) => sum + order.totalValue, 0).toLocaleString()}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Shipments</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredOrders.filter(o => o.shipmentStatus === 'pending').length}
              </p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Quality Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredOrders.filter(o => o.qualityFlag !== 'ok').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>
    </div>
  );
}