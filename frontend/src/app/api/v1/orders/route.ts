import { NextRequest, NextResponse } from 'next/server';

// Mock orders data
const mockOrders = [
  {
    id: '1',
    order_number: 'ORD-2024-001',
    customer_id: 'CUST-001',
    customer_name: 'Pacific Aquaculture Ltd',
    order_date: '2024-01-15',
    species: 'Penaeus vannamei',
    strain: 'SPF',
    quantity: 50000,
    unit: 'pieces',
    unit_price: 0.15,
    total_amount: 7500,
    currency: 'USD',
    status: 'completed',
    shipment_status: 'delivered',
    delivery_address: {
      street: '123 Marine Drive',
      city: 'Vancouver',
      state: 'BC',
      country: 'Canada',
      postal_code: 'V6B 1A1'
    }
  },
  {
    id: '2',
    order_number: 'ORD-2024-002',
    customer_id: 'CUST-002',
    customer_name: 'Bangkok Shrimp Farm',
    order_date: '2024-01-20',
    species: 'Penaeus monodon',
    strain: 'Wild',
    quantity: 25000,
    unit: 'pieces',
    unit_price: 0.18,
    total_amount: 4500,
    currency: 'THB',
    status: 'processing',
    shipment_status: 'pending',
    delivery_address: {
      street: '456 Fishery Road',
      city: 'Bangkok',
      state: 'Bangkok',
      country: 'Thailand',
      postal_code: '10100'
    }
  },
  {
    id: '3',
    order_number: 'ORD-2024-003',
    customer_id: 'CUST-003',
    customer_name: 'Coastal Farms Inc',
    order_date: '2024-01-25',
    species: 'Penaeus vannamei',
    strain: 'High Health',
    quantity: 75000,
    unit: 'pieces',
    unit_price: 0.12,
    total_amount: 9000,
    currency: 'USD',
    status: 'pending',
    shipment_status: 'pending',
    delivery_address: {
      street: '789 Coastal Highway',
      city: 'Miami',
      state: 'FL',
      country: 'USA',
      postal_code: '33101'
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Simple pagination
    const paginatedOrders = mockOrders.slice(offset, offset + limit);
    
    return NextResponse.json({
      success: true,
      data: {
        orders: paginatedOrders,
        pagination: {
          total: mockOrders.length,
          limit,
          offset,
          pages: Math.ceil(mockOrders.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('Orders API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}