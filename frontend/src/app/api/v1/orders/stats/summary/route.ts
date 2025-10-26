import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock order statistics
    const stats = {
      total_orders: 1247,
      pending_orders: 89,
      completed_orders: 1098,
      cancelled_orders: 60,
      total_revenue: 2847650,
      monthly_revenue: 234500,
      average_order_value: 2285,
      order_growth_rate: 12.5,
      top_species: [
        { species: 'Penaeus vannamei', count: 834, revenue: 1923400 },
        { species: 'Penaeus monodon', count: 267, revenue: 578920 },
        { species: 'Penaeus stylirostris', count: 146, revenue: 345330 }
      ],
      monthly_trends: [
        { month: 'Jan', orders: 98, revenue: 245600 },
        { month: 'Feb', orders: 112, revenue: 267800 },
        { month: 'Mar', orders: 105, revenue: 234500 },
        { month: 'Apr', orders: 128, revenue: 289400 },
        { month: 'May', orders: 134, revenue: 298750 },
        { month: 'Jun', orders: 142, revenue: 315600 }
      ],
      regional_distribution: [
        { region: 'North America', orders: 456, revenue: 1245800 },
        { region: 'Southeast Asia', orders: 523, revenue: 1089650 },
        { region: 'Europe', orders: 189, revenue: 378900 },
        { region: 'Australia', orders: 79, revenue: 133300 }
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Order stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}