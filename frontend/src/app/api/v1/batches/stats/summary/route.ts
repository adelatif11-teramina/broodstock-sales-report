import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock batch statistics
    const stats = {
      total_batches: 187,
      active_batches: 142,
      completed_batches: 35,
      quarantine_batches: 10,
      total_population: 12750000,
      average_survival_rate: 89.5,
      total_biomass: 38400, // kg
      monthly_production: 4200, // kg
      species_distribution: [
        { species: 'Penaeus vannamei', batches: 124, population: 8950000, survival_rate: 91.2 },
        { species: 'Penaeus monodon', batches: 43, population: 2890000, survival_rate: 86.8 },
        { species: 'Penaeus stylirostris', batches: 20, population: 910000, survival_rate: 88.4 }
      ],
      health_status: {
        excellent: 89,
        good: 53,
        fair: 35,
        poor: 8,
        critical: 2
      },
      recent_activities: [
        { id: 1, type: 'spawning', batch_id: 'BTH-2024-089', date: '2024-01-25', notes: 'Successful spawning cycle completed' },
        { id: 2, type: 'harvest', batch_id: 'BTH-2024-067', date: '2024-01-24', notes: 'Partial harvest - 25kg biomass' },
        { id: 3, type: 'quality_check', batch_id: 'BTH-2024-091', date: '2024-01-23', notes: 'Health assessment completed' }
      ]
    };
    
    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Batch stats API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}