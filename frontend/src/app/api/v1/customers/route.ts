import { NextRequest, NextResponse } from 'next/server';

// Mock customers data
const mockCustomers = [
  {
    id: 'CUST-001',
    name: 'Pacific Aquaculture Ltd',
    email: 'contact@pacificaqua.com',
    phone: '+1-604-555-0123',
    address: {
      street: '123 Marine Drive',
      city: 'Vancouver',
      state: 'BC',
      country: 'Canada',
      postal_code: 'V6B 1A1'
    },
    coordinates: { lat: 49.2827, lng: -123.1207 },
    status: 'active',
    created_at: '2023-06-15T10:00:00Z',
    updated_at: '2024-01-15T14:30:00Z',
    total_orders: 12,
    total_value: 45000,
    last_order_date: '2024-01-15',
    credential_status: 'valid'
  },
  {
    id: 'CUST-002',
    name: 'Bangkok Shrimp Farm',
    email: 'info@bangkokshrimp.th',
    phone: '+66-2-555-0456',
    address: {
      street: '456 Fishery Road',
      city: 'Bangkok',
      state: 'Bangkok',
      country: 'Thailand',
      postal_code: '10100'
    },
    coordinates: { lat: 13.7563, lng: 100.5018 },
    status: 'active',
    created_at: '2023-08-20T09:15:00Z',
    updated_at: '2024-01-20T11:45:00Z',
    total_orders: 8,
    total_value: 28000,
    last_order_date: '2024-01-20',
    credential_status: 'expiring'
  },
  {
    id: 'CUST-003',
    name: 'Coastal Farms Inc',
    email: 'orders@coastalfarms.com',
    phone: '+1-305-555-0789',
    address: {
      street: '789 Coastal Highway',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      postal_code: '33101'
    },
    coordinates: { lat: 25.7617, lng: -80.1918 },
    status: 'active',
    created_at: '2023-09-10T16:20:00Z',
    updated_at: '2024-01-25T13:15:00Z',
    total_orders: 15,
    total_value: 67500,
    last_order_date: '2024-01-25',
    credential_status: 'valid'
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Simple pagination
    const paginatedCustomers = mockCustomers.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        customers: paginatedCustomers,
        pagination: {
          total: mockCustomers.length,
          limit,
          offset,
          pages: Math.ceil(mockCustomers.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Customers API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}