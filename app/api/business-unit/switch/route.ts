// app/api/business-unit/switch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { businessUnitId } = body;

    if (!businessUnitId) {
      return NextResponse.json(
        { error: 'Business unit ID is required' },
        { status: 400 }
      );
    }

    // Verify the business unit exists and is active
    const businessUnit = await prisma.businessUnit.findFirst({
      where: {
        id: businessUnitId,
        isActive: true,
      },
    });

    if (!businessUnit) {
      return NextResponse.json(
        { error: 'Business unit not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user has access to this business unit
    const userHasAccess = session.user.availableBusinessUnits?.some(
      (bu) => bu.id === businessUnitId
    );

    if (!userHasAccess) {
      return NextResponse.json(
        { error: 'Access denied to this business unit' },
        { status: 403 }
      );
    }

    // Store the active business unit in a cookie
    const cookieStore = await cookies();
    cookieStore.set('active-business-unit', businessUnitId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      businessUnit: {
        id: businessUnit.id,
        name: businessUnit.name,
        code: businessUnit.code,
        description: businessUnit.description,
        isActive: businessUnit.isActive,
      },
    });
  } catch (error) {
    console.error('Business unit switch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}