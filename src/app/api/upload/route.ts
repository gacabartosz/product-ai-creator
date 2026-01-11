// POST /api/upload
// Handle image uploads and create a new draft

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { uploadImage } from '@/services/storage';
import { isValidImageMimeType } from '@/lib/utils';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Get uploaded files
    const files = formData.getAll('images') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      );
    }

    if (files.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 images allowed' },
        { status: 400 }
      );
    }

    // Validate file types
    for (const file of files) {
      if (!isValidImageMimeType(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP` },
          { status: 400 }
        );
      }
    }

    // Get optional fields
    const userHint = formData.get('userHint') as string | null;
    const language = formData.get('language') as string | null;
    const rawDataStr = formData.get('rawData') as string | null;
    let rawData: Record<string, unknown> | null = null;

    if (rawDataStr) {
      try {
        rawData = JSON.parse(rawDataStr);
      } catch {
        return NextResponse.json(
          { error: 'Invalid rawData JSON' },
          { status: 400 }
        );
      }
    }

    // Ensure language is in rawData for pipeline
    if (language) {
      rawData = rawData || {};
      rawData.language = language;
    }

    // Create draft first
    const draft = await prisma.draft.create({
      data: {
        status: 'PENDING',
        userHint,
        rawData: rawData as Prisma.InputJsonValue | undefined,
      },
    });

    // Upload images and create image records
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Convert to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to storage
      const uploadResult = await uploadImage(buffer, file.name, file.type);

      if (!uploadResult.success) {
        // Clean up and return error
        await prisma.draft.delete({ where: { id: draft.id } });
        return NextResponse.json(
          { error: `Failed to upload image ${i + 1}: ${uploadResult.error}` },
          { status: 500 }
        );
      }

      // Create image record
      const image = await prisma.image.create({
        data: {
          draftId: draft.id,
          url: uploadResult.url!,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          position: i,
        },
      });

      uploadedImages.push(image);
    }

    // Return draft with images
    const draftWithImages = await prisma.draft.findUnique({
      where: { id: draft.id },
      include: { images: true },
    });

    return NextResponse.json({
      success: true,
      draft: draftWithImages,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
