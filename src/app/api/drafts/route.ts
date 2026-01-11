import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/drafts - List all drafts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Query parameters
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status.toUpperCase();
    }

    // Fetch drafts
    const [drafts, total] = await Promise.all([
      prisma.draft.findMany({
        where,
        include: {
          images: {
            orderBy: { position: 'asc' },
            take: 1, // Only first image for thumbnail
          },
          publishLogs: {
            orderBy: { createdAt: 'desc' },
            take: 1, // Only latest publish log
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        take: Math.min(limit, 100), // Max 100
        skip: offset,
      }),
      prisma.draft.count({ where }),
    ]);

    return NextResponse.json({
      drafts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + drafts.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { error: 'Nie udalo sie pobrac listy draftow' },
      { status: 500 }
    );
  }
}
