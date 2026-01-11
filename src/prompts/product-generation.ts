// Product Content Generation Prompts for Viamall Product Creator
// Optimized for garden products, fences, mats, mattresses, beds

export const CONTENT_SYSTEM_PROMPT = `You are an expert e-commerce copywriter specializing in creating compelling product listings for garden and home products.

You write content for viamall.pl - a German e-commerce store selling:
- Wicker mats (Weidenmatte, Sichtschutzmatte)
- Wooden fences (Haselnusszaun, Staketenzaun)
- Mattresses (Matratze, Taschenfederkernmatratze)
- Wooden beds (Holzbett, Massivholzbett)
- Garden cushions and furniture

Your content should be:
- Professional and detailed with technical specifications
- SEO-optimized for German market
- Focused on quality, durability and natural materials
- Include practical usage information (installation, care)
- Emphasize eco-friendly and natural aspects
- Use proper German product naming conventions

You must respond with a valid JSON object (no markdown, no code blocks, just raw JSON).

Language: {{LANGUAGE}}
Currency: {{CURRENCY}}`;

export const CONTENT_USER_PROMPT = `Based on the following product analysis, create compelling product content for viamall.pl:

## Product Analysis
- Type: {{PRODUCT_TYPE}}
- Category: {{CATEGORY}}
- Brand: {{BRAND}}
- Materials: {{MATERIALS}}
- Dimensions: {{DIMENSIONS}}
- Features: {{FEATURES}}

{{RAW_DATA}}

{{USER_HINT}}

## Content Requirements

Generate the following content in {{LANGUAGE_NAME}}:

1. **Product Name**: Clear, searchable German product name following pattern:
   - For mats: "[Material]matte [Dimensions] | [Use case]"
   - For fences: "[Material]zaun [Length]m | [Height]cm [Feature]"
   - For mattresses: "[Type] Matratze [Height]cm | [Features]"
   - For beds: "[Material]bett [Dimensions] | [Features]"

2. **Short Description**: Brief summary highlighting key features and benefits (max 400 chars)
   - Focus on material quality, dimensions, usage

3. **Long Description**: Detailed description including:
   - Main features and benefits
   - Material quality and origin (e.g., "aus polnischer Weide")
   - Usage scenarios (balcony, garden, terrace)
   - Installation/assembly info if relevant
   - Care instructions if applicable

4. **HTML Description**: Formatted with:
   - <h3> for section headers
   - <p> for paragraphs
   - <ul><li> for feature lists
   - <strong> for emphasis
   Include sections: Eigenschaften, Material, Anwendung, Lieferumfang

5. **SEO Title**: German-optimized title (max 70 chars)
6. **SEO Description**: Meta description for German search (max 160 chars)
7. **Keywords**: 8-12 German search keywords
8. **Attributes**: Product specifications as key-value pairs (German keys)
   - Mandatory: Material, Höhe, Länge/Breite, Farbe
   - Optional: Gewicht, Befestigung, Pflege

9. **Tags**: 10-15 German tags for filtering
10. **Image Alt Texts**: Descriptive German alt texts

Respond with this exact JSON structure:
{
  "name": "Product Name Here",
  "shortDescription": "Short description here...",
  "longDescription": "Detailed description here...",
  "htmlDescription": "<h3>Eigenschaften</h3><p>...</p><ul><li>...</li></ul>",
  "seoTitle": "SEO Title | viamall.de",
  "seoDescription": "Meta description for search results...",
  "keywords": ["keyword1", "keyword2", ...],
  "attributes": {
    "Material": "Weide",
    "Höhe": "120 cm",
    "Länge": "500 cm",
    ...
  },
  "tags": ["Sichtschutz", "Balkon", "Garten", ...],
  "imageAlts": ["Alt text for image 1", "Alt text for image 2", ...]
}`;

// German product content system prompt
export const CONTENT_SYSTEM_PROMPT_DE = `Du bist ein Experte für E-Commerce-Copywriting, spezialisiert auf überzeugende Produktbeschreibungen für Garten- und Wohnprodukte.

Du schreibst Inhalte für viamall.pl - einen deutschen Online-Shop für:
- Weidenmatten und Sichtschutz
- Holzzäune (Haselnuss, Staketenzäune)
- Matratzen und Betten
- Gartenmöbel und Kissen

Deine Texte sollten:
- Professionell und detailliert mit technischen Spezifikationen sein
- SEO-optimiert für den deutschen Markt sein
- Qualität, Langlebigkeit und natürliche Materialien betonen
- Praktische Informationen zur Nutzung enthalten
- Umweltfreundliche und natürliche Aspekte hervorheben

Antworte mit einem gültigen JSON-Objekt (kein Markdown, keine Code-Blöcke, nur rohes JSON).

Sprache: Deutsch
Währung: EUR`;

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
    category?: string;
    material?: string;
    height?: string;
    length?: string;
    width?: string;
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

  const languageNameMap = {
    pl: 'Polish',
    en: 'English',
    de: 'German',
  };

  const currencyMap = {
    pl: 'PLN',
    en: 'EUR',
    de: 'EUR',
  };

  const lang = data.language || 'de';

  // Use German-specific prompt for German
  const systemPrompt = lang === 'de'
    ? CONTENT_SYSTEM_PROMPT_DE
    : CONTENT_SYSTEM_PROMPT
        .replace('{{LANGUAGE}}', languageMap[lang])
        .replace('{{CURRENCY}}', currencyMap[lang]);

  // Build dimensions string
  const dimensions: string[] = [];
  if (data.rawData?.height) dimensions.push(`Höhe: ${data.rawData.height} cm`);
  if (data.rawData?.length) dimensions.push(`Länge: ${data.rawData.length}`);
  if (data.rawData?.width) dimensions.push(`Breite: ${data.rawData.width} cm`);
  const dimensionsStr = dimensions.length > 0 ? dimensions.join(', ') : 'Not specified';

  let userPrompt = CONTENT_USER_PROMPT
    .replace('{{PRODUCT_TYPE}}', data.productType)
    .replace('{{CATEGORY}}', data.rawData?.category || data.categories.join(' > ') || 'Not specified')
    .replace('{{BRAND}}', data.brand || data.rawData?.brand || 'Not specified')
    .replace('{{MATERIALS}}', data.rawData?.material || data.materials.join(', ') || 'Not specified')
    .replace('{{DIMENSIONS}}', dimensionsStr)
    .replace('{{FEATURES}}', data.features.join(', ') || 'Not specified')
    .replace('{{LANGUAGE_NAME}}', languageNameMap[lang]);

  // Add raw data if available
  if (data.rawData) {
    const rawDataEntries = Object.entries(data.rawData)
      .filter(([key, v]) => v !== undefined && !['category', 'material', 'height', 'length', 'width'].includes(key))
      .map(([k, v]) => {
        const labelMap: Record<string, string> = {
          ean: 'EAN Code',
          priceGross: 'Price (gross)',
          brand: 'Brand',
        };
        return `- ${labelMap[k] || k}: ${v}`;
      });

    userPrompt = userPrompt.replace(
      '{{RAW_DATA}}',
      rawDataEntries.length > 0 ? `\n## Additional Data\n${rawDataEntries.join('\n')}` : ''
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

// German product naming patterns
export const GERMAN_NAMING_PATTERNS = {
  'maty-wiklinowe': {
    pattern: '{material}matte {height}cm x {length}m | Sichtschutz {useCase}',
    examples: [
      'Weidenmatte 120cm x 5m | Sichtschutz für Balkon',
      'Schilfmatte 180cm x 3m | Natürlicher Sichtschutz',
    ],
  },
  'ploty-sztachetowe': {
    pattern: '{material}zaun {length}m | Höhe {height}cm {feature}',
    examples: [
      'Haselnusszaun 5m | Höhe 120cm imprägniert',
      'Staketenzaun 3m | Höhe 80cm naturbelassen',
    ],
  },
  'materace': {
    pattern: '{zones}-Zonen {type}matratze {height}cm | {features}',
    examples: [
      '7-Zonen Taschenfederkernmatratze 19cm | H3 mit waschbarem Bezug',
      'Kaltschaummatratze 15cm | H2 atmungsaktiv',
    ],
  },
  'lozka': {
    pattern: '{material}bett {width}x{length}cm | {features}',
    examples: [
      'Massivholzbett 140x200cm | Kiefernholz mit Lattenrost',
      'Futonbett 160x200cm | Eiche massiv',
    ],
  },
};

// Polish-specific content generation (fallback)
export const CONTENT_PROMPTS_PL = {
  systemPrompt: `Jesteś ekspertem od copywritingu e-commerce dla viamall.pl.

Twoja treść powinna być:
- Profesjonalna z danymi technicznymi
- Zoptymalizowana pod SEO
- Skoncentrowana na jakości i naturalnych materiałach
- Zawierać praktyczne informacje o użytkowaniu

Odpowiedz prawidłowym obiektem JSON (bez markdown, bez bloków kodu, tylko surowy JSON).

Język: Polski
Waluta: PLN`,

  tips: {
    nameFormat: 'Format: [Typ] [Materiał] [Wymiary] | [Zastosowanie]',
    seoTips: 'SEO: Użyj polskich słów kluczowych, uwzględnij wymiary i materiał',
    descriptionTips: 'Opis: Podkreśl jakość materiałów, wymiary, zastosowanie',
  },
};
