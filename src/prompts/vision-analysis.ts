// Vision Analysis Prompts for Product AI Creator
// Used by the Vision Stage to analyze product images

export const VISION_SYSTEM_PROMPT = `You are an expert product analyst specializing in e-commerce. Your task is to analyze product images and extract detailed information about the product.

You must respond with a valid JSON object (no markdown, no code blocks, just raw JSON).

Be thorough but precise. If you're uncertain about something, indicate lower confidence. Focus on what you can clearly see in the images.`;

export const VISION_USER_PROMPT = `Analyze these product images and extract the following information:

1. **Product Type**: What kind of product is this? (e.g., "Sneakers", "T-Shirt", "Watch", "Laptop")
2. **Brand**: Can you identify the brand from the images? Look for logos, labels, distinctive designs.
3. **Model**: If identifiable, what specific model is this?
4. **Colors**: List all colors visible on the product
5. **Materials**: What materials does the product appear to be made of?
6. **Style**: What style category fits this product? (e.g., "Casual", "Formal", "Sports", "Vintage")
7. **Condition**: Does the product look new, used, or refurbished?
8. **Features**: List key features visible in the images
9. **Categories**: Suggest appropriate e-commerce categories for this product

{{USER_HINT}}

Respond with this exact JSON structure:
{
  "productType": "string - main product category",
  "detectedBrand": "string or null",
  "detectedModel": "string or null",
  "colors": ["array", "of", "colors"],
  "materials": ["array", "of", "materials"],
  "style": "string or null",
  "condition": "new" | "used" | "refurbished" | null,
  "features": ["array", "of", "features"],
  "suggestedCategories": ["array", "of", "category", "paths"],
  "confidence": 0.0-1.0
}`;

export function buildVisionPrompt(userHint?: string): string {
  let prompt = VISION_USER_PROMPT;

  if (userHint && userHint.trim()) {
    prompt = prompt.replace(
      '{{USER_HINT}}',
      `\nAdditional information from user: "${userHint}"\nUse this hint to guide your analysis.`
    );
  } else {
    prompt = prompt.replace('{{USER_HINT}}', '');
  }

  return prompt;
}

// Language-specific prompts
export const VISION_PROMPTS_PL = {
  systemPrompt: `Jesteś ekspertem od analizy produktów specjalizującym się w e-commerce. Twoim zadaniem jest analiza zdjęć produktów i wyodrębnienie szczegółowych informacji.

Odpowiedz prawidłowym obiektem JSON (bez markdown, bez bloków kodu, tylko surowy JSON).

Bądź dokładny, ale precyzyjny. Jeśli czegoś nie jesteś pewien, wskaż niższą pewność.`,

  userPrompt: `Przeanalizuj te zdjęcia produktu i wyodrębnij następujące informacje:

1. **Typ produktu**: Jaki to rodzaj produktu?
2. **Marka**: Czy możesz zidentyfikować markę?
3. **Model**: Jaki to konkretny model?
4. **Kolory**: Lista wszystkich widocznych kolorów
5. **Materiały**: Z jakich materiałów wykonany jest produkt?
6. **Styl**: Jaka kategoria stylu pasuje do produktu?
7. **Stan**: Czy produkt wygląda na nowy, używany czy odnowiony?
8. **Cechy**: Lista kluczowych cech widocznych na zdjęciach
9. **Kategorie**: Zaproponuj odpowiednie kategorie e-commerce

{{USER_HINT}}

Odpowiedz strukturą JSON jak wyżej, ale wartości w języku polskim.`,
};
