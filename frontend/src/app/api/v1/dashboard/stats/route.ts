import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock dashboard statistics - KPI summary
    const stats = {
      revenue: {
        total: 2847650,
        monthly: 234500,
        weekly: 58625,
        daily: 8375,
        growth_rate: 12.5,
        target_achievement: 87.3
      },
      orders: {
        total: 1247,
        pending: 89,
        completed: 1098,
        cancelled: 60,
        processing_time_avg: 3.2, // days
        fulfillment_rate: 88.1
      },
      customers: {
        total: 156,
        active: 142,
        new_this_month: 12,
        retention_rate: 89.5,
        satisfaction_score: 4.3,
        avg_order_value: 15750
      },
      batches: {
        total: 187,
        active: 142,
        total_population: 12750000,
        survival_rate: 89.5,
        biomass: 38400,
        production_capacity: 92.1
      },
      alerts: {
        critical: 2,
        warnings: 8,
        info: 15,
        total_open: 25
      },
      trends: {
        revenue_trend: 'up',
        order_trend: 'up', 
        customer_trend: 'stable',
        production_trend: 'up'
      }
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}