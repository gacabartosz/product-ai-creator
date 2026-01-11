// API endpoint for fetching PrestaShop languages
// Used by frontend to populate language picker

import { NextResponse } from 'next/server';
import { PrestaShopApiClient } from '@/adapters/prestashop/api-client';

export const revalidate = 300; // Cache for 5 minutes

export async function GET() {
  try {
    const apiUrl = process.env.PRESTASHOP_URL;
    const apiKey = process.env.PRESTASHOP_API_KEY;

    if (!apiUrl || !apiKey) {
      return NextResponse.json(
        { error: 'PrestaShop configuration missing' },
        { status: 500 }
      );
    }

    const client = new PrestaShopApiClient({
      apiUrl,
      apiKey,
    });

    const rawLanguages = await client.getLanguages();

    // Filter active languages and map to simplified format
    const languages = rawLanguages
      .filter(lang => lang.active)
      .map(lang => ({
        id: String(lang.id),
        name: lang.name,
        isoCode: lang.iso_code,
      }));

    return NextResponse.json({ languages });
  } catch (error) {
    console.error('Failed to fetch languages:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}
