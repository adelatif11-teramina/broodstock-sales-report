'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit, 
  MoreHorizontal,
  Package,
  AlertCircle,
  DollarSign,
  Calendar,
  User
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { 
  formatCurrency, 
  formatDate, 
  getStatusColor, 
  formatStatus,
  truncateText 
} from '@/lib/utils';
import Button from '@/components/ui/Button';

interface OrderFilters {
  search: string;
  status: string;
  dateRange: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface OrdersTableProps {
  filters: OrderFilters;
}

interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  status: string;
  species: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  currency: string;
  shipmentStatus: string;
  deliveryAddress: {
    city: string;
    state: string;
    country: string;
  };
  notes?: string;
}

const ITEMS_PER_PAGE = 20;

export default function OrdersTable({ filters }: OrdersTableProps) {
  const [page, setPage] = React.useState(1);

  // Build query parameters
  const queryParams = React.useMemo(() => {
    const params: any = {
      page,
      limit: ITEMS_PER_PAGE,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    };

    if (filters.search) {
      params.search = filters.search;
    }
    if (filters.status) {
      params.status = filters.status;
    }
    if (filters.dateRange && filters.dateRange !== 'custom') {
      params.dateRange = filters.dateRange;
    }

    return params;
  }, [filters, page]);

  // Fetch orders
  const { data: ordersData, isLoading, error } = useQuery({
    queryKey: [...queryKeys.orders, queryParams],
    queryFn: () => apiClient.getOrders(queryParams),
  });

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [filters]);

  const orders: Order[] = (ordersData?.items as any) || [];
  const totalOrders = ordersData?.pagination?.total || 0;
  const totalPages = Math.ceil(totalOrders / ITEMS_PER_PAGE);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading orders</p>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No orders found</p>
            <p className="text-sm text-gray-400 mt-1">
              {filters.search || filters.status || filters.dateRange 
                ? 'Try adjusting your filters' 
                : 'Create your first order to get started'
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
            Orders ({totalOrders.toLocaleString()})
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
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-blue-600">
                    #{order.id.slice(-8).toUpperCase()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">
                        {truncateText(order.customerName, 20)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.deliveryAddress.city}, {order.deliveryAddress.country}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(order.orderDate)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-medium">{order.species}</div>
                  <div className="text-sm text-gray-500">
                    {order.quantity} {order.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(order.totalAmount, order.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatCurrency(order.unitPrice, order.currency)}/{order.unit}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    Ship: {formatStatus(order.shipmentStatus)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/orders/${order.id}`}>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/orders/${order.id}/edit`}>
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
        {orders.map((order) => (
          <div key={order.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-blue-600">
                #{order.id.slice(-8).toUpperCase()}
              </div>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                {formatStatus(order.status)}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <User className="h-3 w-3 mr-1" />
                  Customer
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {truncateText(order.customerName, 20)}
                </div>
                <div className="text-xs text-gray-500">
                  {order.deliveryAddress.city}, {order.deliveryAddress.country}
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  Order Date
                </div>
                <div className="text-sm text-gray-900">{formatDate(order.orderDate)}</div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <Package className="h-3 w-3 mr-1" />
                  Product
                </div>
                <div className="text-sm font-medium text-gray-900">{order.species}</div>
                <div className="text-xs text-gray-500">
                  {order.quantity} {order.unit}
                </div>
              </div>
              
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Amount
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {formatCurrency(order.totalAmount, order.currency)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(order.unitPrice, order.currency)}/{order.unit}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 mt-4">
              <Link href={`/dashboard/orders/${order.id}`}>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </Link>
              <Link href={`/dashboard/orders/${order.id}/edit`}>
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
              Showing {((page - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(page * ITEMS_PER_PAGE, totalOrders)} of {totalOrders} orders
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