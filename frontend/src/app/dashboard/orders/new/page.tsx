'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderForm from '@/components/orders/OrderForm';
import { ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

function NewOrderPage() {
  const router = useRouter();

  const handleOrderCreated = (orderId: string) => {
    router.push(`/dashboard/orders/${orderId}`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/orders">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Orders
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Order</h1>
            <p className="text-gray-600">Add a new customer order to the system</p>
          </div>
        </div>

        {/* Order Form */}
        <div className="max-w-4xl">
          <OrderForm 
            onSuccess={handleOrderCreated}
            onCancel={() => router.push('/dashboard/orders')}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default withAuth(NewOrderPage, ['editor', 'manager', 'admin']);