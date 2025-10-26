'use client';

import React, { useState } from 'react';
import { withAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CustomerManagement from '@/components/customers/CustomerManagement';

function CustomersPage() {
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);

  const handleNewCustomer = (customerData: any) => {
    console.log('New customer created:', customerData);
    // Here you would typically save the customer to your backend
    setShowNewCustomerForm(false);
  };

  return (
    <DashboardLayout>
      <CustomerManagement onNewCustomer={() => setShowNewCustomerForm(true)} />
      
      {/* TODO: Add NewCustomerForm component when needed */}
      {showNewCustomerForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-medium mb-4">New Customer Form</h3>
            <p className="text-gray-600 mb-4">Customer form coming soon...</p>
            <button
              onClick={() => setShowNewCustomerForm(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default withAuth(CustomersPage, ['editor', 'manager', 'admin']);