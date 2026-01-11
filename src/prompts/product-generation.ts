// Product Content Generation Prompts for Product AI Creator
// Used by the Content Stage to generate product descriptions, SEO, etc.

export const CONTENT_SYSTEM_PROMPT = `You are an expert e-commerce copywriter specializing in creating compelling product listings.

Your content should be:
- Engaging and persuasive
- SEO-optimized with natural keyword usage
- Professional yet approachable
- Focused on benefits and features
- Free of filler words and marketing clichés

You must respond with a valid JSON object (no markdown, no code blocks, just raw JSON).

Language: {{LANGUAGE}}`;

export const CONTENT_USER_PROMPT = `Based on the following product analysis, create compelling product content:

## Product Analysis
- Type: {{PRODUCT_TYPE}}
- Brand: {{BRAND}}
- Model: {{MODEL}}
- Colors: {{COLORS}}
- Materials: {{MATERIALS}}
- Style: {{STYLE}}
- Features: {{FEATURES}}
- Categories: {{CATEGORIES}}

{{RAW_DATA}}

{{USER_HINT}}

Generate the following content:

1. **Product Name**: A clear, searchable product name (max 255 chars)
2. **Short Description**: A brief summary for product listings (max 500 chars)
3. **Long Description**: A detailed description highlighting benefits and features
4. **HTML Description**: The long description formatted with HTML (use <p>, <ul>, <li>, <strong>)
5. **SEO Title**: Optimized title for search engines (max 70 chars)
6. **SEO Description**: Meta description for search results (max 160 chars)
7. **Keywords**: 5-10 relevant search keywords
8. **Attributes**: Key product attributes as key-value pairs
9. **Tags**: 5-15 tags for filtering and search
10. **Image Alt Texts**: SEO-friendly alt texts for each image

Respond with this exact JSON structure:
{
  "name": "Product Name Here",
  "shortDescription": "Short description here...",
  "longDescription": "Detailed description here...",
  "htmlDescription": "<p>HTML formatted description...</p>",
  "seoTitle": "SEO Title | Brand",
  "seoDescription": "Meta description for search results...",
  "keywords": ["keyword1", "keyword2", ...],
  "attributes": {
    "Color": "Black",
    "Material": "Leather",
    ...
  },
  "tags": ["tag1", "tag2", ...],
  "imageAlts": ["Alt text for image 1", "Alt text for image 2", ...]
}`;

export interface ContentPromptData {
  productType: string;
  brand?: string;
  model?: string;
  colors: string[];
  materials: string[];
  style?: string;
  features: string[];
  categories: string[];
  userHint?: string;
  rawData?: {
    ean?: string;
    priceGross?: number;
    brand?: string;
  };
  language?: 'pl' | 'en' | 'de';
  imageCount?: number;
}

export function buildContentPrompt(data: ContentPromptData): {
  systemPrompt: string;
  userPrompt: string;
} {
  const languageMap = {
    pl: 'Polish (Polski)',
    en: 'English',
    de: 'German (Deutsch)',
  };

  const systemPrompt = CONTENT_SYSTEM_PROMPT.replace(
    '{{LANGUAGE}}',
    languageMap[data.language || 'pl']
  );

  let userPrompt = CONTENT_USER_PROMPT
    .replace('{{PRODUCT_TYPE}}', data.productType)
    .replace('{{BRAND}}', data.brand || 'Unknown')
    .replace('{{MODEL}}', data.model || 'Not specified')
    .replace('{{COLORS}}', data.colors.join(', ') || 'Not specified')
    .replace('{{MATERIALS}}', data.materials.join(', ') || 'Not specified')
    .replace('{{STYLE}}', data.style || 'Not specified')
    .replace('{{FEATURES}}', data.features.join(', ') || 'Not specified')
    .replace('{{CATEGORIES}}', data.categories.join(' > ') || 'Not specified');

  // Add raw data if available
  if (data.rawData) {
    const rawDataStr = Object.entries(data.rawData)
      .filter(([_, v]) => v !== undefined)
      .map(([k, v]) => `- ${k}: ${v}`)
      .join('\n');

    userPrompt = userPrompt.replace(
      '{{RAW_DATA}}',
      rawDataStr ? `\n## Additional Data\n${rawDataStr}` : ''
    );
  } else {
    userPrompt = userPrompt.replace('{{RAW_DATA}}', '');
  }

  // Add user hint if available
  if (data.userHint && data.userHint.trim()) {
    userPrompt = userPrompt.replace(
      '{{USER_HINT}}',
      `\n## User Note\n"${data.userHint}"`
    );
  } else {
    userPrompt = userPrompt.replace('{{USER_HINT}}', '');
  }

  return { systemPrompt, userPrompt };
}

// Polish-specific content generation
export const CONTENT_PROMPTS_PL = {
  systemPrompt: `Jesteś ekspertem od copywritingu e-commerce, specjalizującym się w tworzeniu atrakcyjnych opisów produktów.

Twoja treść powinna być:
- Angażująca i przekonująca
- Zoptymalizowana pod SEO z naturalnym użyciem słów kluczowych
- Profesjonalna, ale przystępna
- Skoncentrowana na korzyściach i cechach
- Wolna od pustych fraz marketingowych

Odpowiedz prawidłowym obiektem JSON (bez markdown, bez bloków kodu, tylko surowy JSON).

Język: Polski`,

  tips: {
    nameFormat: 'Format nazwy: [Marka] [Typ produktu] [Model] [Główna cecha]',
    seoTips: 'SEO: Użyj polskich słów kluczowych, uwzględnij markę i typ produktu',
    descriptionTips: 'Opis: Skup się na korzyściach dla klienta, użyj polskich zwrotów',
  },
};
