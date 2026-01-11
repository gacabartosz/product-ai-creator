// Vision Analysis Prompts for Viamall Product Creator
// Optimized for garden products, fences, mats, mattresses, beds

export const VISION_SYSTEM_PROMPT = `You are an expert product analyst specializing in garden and home products for e-commerce.

You analyze products for viamall.pl which sells:
- Wicker/willow mats (Maty wiklinowe) - privacy screens for balconies and gardens
- Wooden fences (Płoty drewniane) - hazel, willow fences and stakes
- Mattresses (Materace) - pocket spring, foam mattresses
- Wooden beds (Łóżka) - solid wood bed frames
- Garden cushions and furniture

Your task is to analyze product images and extract detailed information including:
- Product type and category
- Material (wood type, weave type)
- Dimensions when visible
- Quality indicators
- Features and construction details

You must respond with a valid JSON object (no markdown, no code blocks, just raw JSON).

Be thorough but precise. Focus on what you can clearly see in the images.`;

export const VISION_USER_PROMPT = `Analyze these product images and extract the following information for viamall.pl:

1. **Product Type**: What kind of product is this?
   - Wicker/Willow mat (Mata wiklinowa/wierzbowa)
   - Fence (Płot sztachetowy, leszczynowy, wiklinowy)
   - Mattress (Materac kieszeniowy, piankowy)
   - Bed frame (Łóżko drewniane)
   - Garden cushion (Poduszka ogrodowa)
   - Other garden/home product

2. **Material**: What material is the product made of?
   - Wood types: willow (wiklina), hazel (leszczyna), pine (sosna), oak
   - Mat types: wicker, reed, bamboo
   - Fabric: polyester, cotton, waterproof
   - Foam: polyurethane, latex, memory foam

3. **Dimensions**: Estimate visible dimensions if possible
   - Height, length, width in cm
   - For mats/fences: height x length

4. **Colors**: List all visible colors (natural wood, brown, gray, etc.)

5. **Construction**: How is it constructed?
   - For fences: woven, staked, galvanized wire binding
   - For mattresses: pocket springs, zones, layers
   - For beds: solid wood, assembled, type of slats

6. **Features**: Key features visible
   - Weather resistant, impregnated, natural/untreated
   - Washable cover, zoning, firmness indicators
   - Assembly type, included accessories

7. **Quality indicators**: Signs of quality
   - Wood grain, finish quality, joints
   - Stitching, fabric quality, filling

8. **Brand**: Look for brand names, labels, logos
   - Common brands: Roysson, Furnify, King Matratzen

9. **Categories**: Suggest viamall.pl categories:
   - Maty wiklinowe i akcesoria
   - Płoty sztachetowe i akcesoria
   - Materace
   - Łóżka
   - Poduszki na zewnątrz
   - Meble ogrodowe

{{USER_HINT}}

Respond with this exact JSON structure:
{
  "productType": "string - specific product type",
  "productCategory": "string - viamall category",
  "detectedBrand": "string or null",
  "materials": ["array", "of", "materials"],
  "estimatedDimensions": {
    "height": "number or null (cm)",
    "length": "number or null (cm)",
    "width": "number or null (cm)"
  },
  "colors": ["array", "of", "colors"],
  "construction": ["array", "of", "construction", "details"],
  "features": ["array", "of", "features"],
  "qualityIndicators": ["array", "of", "quality", "notes"],
  "suggestedCategories": ["array", "of", "category", "paths"],
  "confidence": 0.0-1.0,
  "analysisNotes": "string - additional observations"
}`;

export function buildVisionPrompt(userHint?: string): string {
  let prompt = VISION_USER_PROMPT;

  if (userHint && userHint.trim()) {
    prompt = prompt.replace(
      '{{USER_HINT}}',
      `\nAdditional information from user: "${userHint}"\nUse this hint to guide your analysis and confirm product details.`
    );
  } else {
    prompt = prompt.replace('{{USER_HINT}}', '');
  }

  return prompt;
}

// German-specific analysis prompt
export const VISION_PROMPTS_DE = {
  systemPrompt: `Du bist ein Experte für Produktanalyse, spezialisiert auf Garten- und Wohnprodukte für E-Commerce.

Du analysierst Produkte für viamall.pl:
- Weidenmatten - Sichtschutz für Balkon und Garten
- Holzzäune - Haselnuss-, Weiden- und Staketenzäune
- Matratzen - Taschenfederkern- und Schaummatratzen
- Holzbetten - Massivholz-Bettrahmen
- Gartenkissen und -möbel

Antworte mit einem gültigen JSON-Objekt.`,

  productTypes: {
    mat: 'Weidenmatte / Sichtschutzmatte',
    fence: 'Holzzaun / Staketenzaun / Haselnusszaun',
    mattress: 'Matratze / Taschenfederkernmatratze',
    bed: 'Holzbett / Massivholzbett',
    cushion: 'Gartenkissen / Palettenkissen',
  },
};

// Polish-specific prompts
export const VISION_PROMPTS_PL = {
  systemPrompt: `Jesteś ekspertem od analizy produktów specjalizującym się w produktach ogrodowych i domowych dla e-commerce.

Analizujesz produkty dla viamall.pl:
- Maty wiklinowe - osłony na balkony i ogrody
- Płoty drewniane - leszczynowe, wiklinowe, sztachetowe
- Materace - kieszeniowe, piankowe
- Łóżka drewniane - ramy z litego drewna
- Poduszki ogrodowe i meble

Odpowiedz prawidłowym obiektem JSON.`,

  userPrompt: `Przeanalizuj te zdjęcia produktu i wyodrębnij informacje dla viamall.pl:

1. **Typ produktu**: Jaki to rodzaj produktu?
   - Mata wiklinowa/wierzbowa
   - Płot (sztachetowy, leszczynowy, wiklinowy)
   - Materac (kieszeniowy, piankowy)
   - Łóżko drewniane
   - Poduszka ogrodowa

2. **Materiał**: Z czego wykonany?
3. **Wymiary**: Oszacuj widoczne wymiary
4. **Kolory**: Lista kolorów
5. **Konstrukcja**: Sposób wykonania
6. **Cechy**: Kluczowe cechy
7. **Marka**: Widoczne logo/nazwa

{{USER_HINT}}

Odpowiedz strukturą JSON jak wyżej.`,
};

// Product type detection helpers
export const PRODUCT_TYPE_KEYWORDS = {
  mat: ['mata', 'wiklina', 'wierzbowa', 'sichtschutz', 'weidenmatte', 'osłona', 'balkon'],
  fence: ['płot', 'fence', 'zaun', 'leszczyna', 'hazel', 'sztacheta', 'ogrodzenie'],
  mattress: ['materac', 'matratze', 'kieszeniowy', 'piankowy', 'sprężynowy'],
  bed: ['łóżko', 'bett', 'rama', 'bed frame', 'drewniane'],
  cushion: ['poduszka', 'kissen', 'cushion', 'paleta', 'ogrodowa'],
};
