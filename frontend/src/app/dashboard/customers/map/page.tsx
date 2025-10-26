'use client';

import React from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CustomerMap from '@/components/customers/CustomerMap';

function CustomerMapPage() {
  const handleNewOrder = (customerId: string) => {
    console.log('Creating new order for customer:', customerId);
    // Here you would navigate to order creation with pre-filled customer
  };

  const handleViewProfile = (customerId: string) => {
    console.log('Viewing profile for customer:', customerId);
    // Here you would navigate to customer profile page
  };

  const handleSendMessage = (customerId: string) => {
    console.log('Sending message to customer:', customerId);
    // Here you would open messaging interface
  };

  return (
    <DashboardLayout>
      <CustomerMap 
        onNewOrder={handleNewOrder}
        onViewProfile={handleViewProfile}
        onSendMessage={handleSendMessage}
      />
    </DashboardLayout>
  );
}

export default withAuth(CustomerMapPage);