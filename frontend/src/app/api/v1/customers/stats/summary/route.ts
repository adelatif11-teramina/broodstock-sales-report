import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock customer statistics
    const stats = {
      total_customers: 156,
      active_customers: 142,
      new_this_month: 12,
      retention_rate: 89.5,
      avg_order_value: 15750,
      top_locations: [
        { city: 'Vancouver', country: 'Canada', customerCount: 25, revenue: 387500 },
        { city: 'Bangkok', country: 'Thailand', customerCount: 32, revenue: 445200 },
        { city: 'Miami', country: 'USA', customerCount: 18, revenue: 298600 },
        { city: 'Singapore', country: 'Singapore', customerCount: 15, revenue: 267800 },
        { city: 'Manila', country: 'Philippines', customerCount: 22, revenue: 334100 }
      ],
      credential_status: {
        valid: 89,
        expiring: 23,
        expired: 12,
        missing: 32
      }
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Customer stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}