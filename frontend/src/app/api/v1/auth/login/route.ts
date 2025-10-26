import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Demo accounts for testing
    const demoAccounts = [
      {
        email: 'admin@shrimpfarm.com',
        password: 'admin123',
        user: {
          id: '1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@shrimpfarm.com',
          role: 'admin',
          permissions: ['read', 'write', 'delete', 'manage']
        }
      },
      {
        email: 'manager@shrimpfarm.com',
        password: 'manager123',
        user: {
          id: '2',
          firstName: 'Farm',
          lastName: 'Manager',
          email: 'manager@shrimpfarm.com',
          role: 'manager',
          permissions: ['read', 'write']
        }
      },
      {
        email: 'demo@shrimpfarm.com',
        password: 'demo123',
        user: {
          id: '3',
          firstName: 'Demo',
          lastName: 'User',
          email: 'demo@shrimpfarm.com',
          role: 'editor',
          permissions: ['read']
        }
      }
    ];

    // Find matching account
    const account = demoAccounts.find(acc => 
      acc.email === email && acc.password === password
    );

    if (!account) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid credentials',
          message: 'Available demo accounts:\n- admin@shrimpfarm.com / admin123\n- manager@shrimpfarm.com / manager123\n- demo@shrimpfarm.com / demo123'
        }, 
        { status: 401 }
      );
    }

    // Generate mock tokens
    const accessToken = `mock-jwt-token-${account.user.id}-${Date.now()}`;
    const refreshToken = `mock-refresh-token-${account.user.id}-${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        user: account.user,
        tokens: {
          accessToken,
          refreshToken,
          expiresIn: 3600 // 1 hour
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}