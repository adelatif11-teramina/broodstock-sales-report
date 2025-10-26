import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No authorization token provided' }, 
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Mock user data based on token
    let user;
    if (token.includes('-1-')) {
      user = {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@shrimpfarm.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage']
      };
    } else if (token.includes('-2-')) {
      user = {
        id: '2',
        firstName: 'Farm',
        lastName: 'Manager',
        email: 'manager@shrimpfarm.com',
        role: 'manager',
        permissions: ['read', 'write']
      };
    } else if (token.includes('-3-')) {
      user = {
        id: '3',
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@shrimpfarm.com',
        role: 'editor',
        permissions: ['read']
      };
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid token' }, 
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        user: user
      }
    });

  } catch (error) {
    console.error('Current user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}