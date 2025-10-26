'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { 
  ExternalLink, 
  Package, 
  User, 
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import { formatCurrency, formatDate, getStatusColor, formatStatus } from '@/lib/utils';
import Button from '@/components/ui/Button';

interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  itemCount: number;
  deliveryAddress: {
    city: string;
    state: string;
    country: string;
  };
}

export default function RecentOrders() {
  const { data: recentOrders, isLoading, error } = useQuery({
    queryKey: [...queryKeys.orders, { recent: true, limit: 10 }],
    queryFn: () => apiClient.getOrders({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-sm text-gray-500">Latest order activity</p>
          </div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            <p className="text-sm text-gray-500">Latest order activity</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">Error loading recent orders</p>
          </div>
        </div>
      </div>
    );
  }

  const orders: Order[] = (recentOrders?.items as unknown as Order[]) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
          <p className="text-sm text-gray-500">Latest order activity</p>
        </div>
        <Link href="/dashboard/orders">
          <Button variant="outline" size="sm" icon={<ExternalLink className="h-4 w-4" />}>
            View All
          </Button>
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <div className="text-center">
            <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">No recent orders</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {/* Order Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>

              {/* Order Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    Order #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    <span className="truncate">{order.customerName}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>{formatDate(order.orderDate)}</span>
                  </div>
                </div>
              </div>

              {/* Order Value */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center text-sm font-medium text-gray-900">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatCurrency(order.totalAmount)}
                </div>
                <p className="text-xs text-gray-500">
                  {order.itemCount} item{order.itemCount !== 1 ? 's' : ''}
                </p>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                <Link href={`/dashboard/orders/${order.id}`}>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}