'use client';

import React, { useState } from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import OrderManagement from '@/components/orders/OrderManagement';
import NewOrderForm from '@/components/orders/NewOrderForm';

function OrdersPage() {
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);

  const handleNewOrder = (orderData: any) => {
    console.log('New order created:', orderData);
    // Here you would typically save the order to your backend
    setShowNewOrderForm(false);
  };

  return (
    <DashboardLayout>
      <OrderManagement onNewOrder={() => setShowNewOrderForm(true)} />
      
      {showNewOrderForm && (
        <NewOrderForm
          onClose={() => setShowNewOrderForm(false)}
          onSave={handleNewOrder}
        />
      )}
    </DashboardLayout>
  );
}

export default withAuth(OrdersPage, ['editor', 'manager', 'admin']);