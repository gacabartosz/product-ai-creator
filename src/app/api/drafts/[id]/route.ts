// GET/PUT /api/drafts/[id]
// Get or update a draft

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// GET /api/drafts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const draft = await prisma.draft.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        publishLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!draft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ draft });
  } catch (error) {
    console.error('Get draft error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// PUT /api/drafts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Check if draft exists
    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (body.userHint !== undefined) {
      updateData.userHint = body.userHint;
    }

    if (body.rawData !== undefined) {
      updateData.rawData = body.rawData;
    }

    if (body.product !== undefined) {
      updateData.product = body.product;
    }

    if (body.status !== undefined) {
      // Validate status
      const validStatuses = ['PENDING', 'PROCESSING', 'READY', 'PUBLISHED', 'FAILED'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // Update draft
    const updatedDraft = await prisma.draft.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: { position: 'asc' },
        },
        publishLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({
      success: true,
      draft: updatedDraft,
    });
  } catch (error) {
    console.error('Update draft error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE /api/drafts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if draft exists
    const existingDraft = await prisma.draft.findUnique({
      where: { id },
    });

    if (!existingDraft) {
      return NextResponse.json(
        { error: 'Draft not found' },
        { status: 404 }
      );
    }

    // Delete draft (cascades to images and publish logs)
    await prisma.draft.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Draft deleted',
    });
  } catch (error) {
    console.error('Delete draft error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
