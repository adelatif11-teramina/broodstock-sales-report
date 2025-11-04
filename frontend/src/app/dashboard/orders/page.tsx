'use client';

import React, { useState } from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderManagement from '@/components/orders/OrderManagement';
import OrderForm from '@/components/orders/OrderForm';

function OrdersPage() {
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  const handleOrderSuccess = (orderId: string) => {
    console.log('Order created successfully:', orderId);
    setShowNewOrderForm(false);
    // TODO: Show success message or redirect to order details
  };

  const handleOrderCancel = () => {
    setShowNewOrderForm(false);
  };

  return (
    <DashboardLayout>
      <OrderManagement onNewOrder={() => setShowNewOrderForm(true)} />
      
      {showNewOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Order</h2>
              <OrderForm
                onSuccess={handleOrderSuccess}
                onCancel={handleOrderCancel}
              />
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(OrdersPage, ['editor', 'manager', 'admin']);