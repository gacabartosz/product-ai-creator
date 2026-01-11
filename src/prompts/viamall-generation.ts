// ViaMall-specific Content Generation Prompts
// Generates product content in viaMall format with emoji bullet points

export const VIAMALL_SYSTEM_PROMPT_DE = `Du bist ein erfahrener E-Commerce-Texter fur viaMall.de, spezialisiert auf uberzeugende Produktbeschreibungen.

Dein Content muss:
- Ansprechend und uberzeugend sein
- SEO-optimiert mit naturlicher Keyword-Nutzung
- Professionell aber zuganglich
- Auf Vorteile und Eigenschaften fokussiert
- Frei von Fullwortern und Marketing-Klischees

Du MUSST mit einem validen JSON-Objekt antworten (kein Markdown, keine Code-Blocke, nur reines JSON).

Sprache: Deutsch`;

export const VIAMALL_SYSTEM_PROMPT_PL = `Jestes ekspertem od copywritingu e-commerce dla viaMall, specjalizujacym sie w tworzeniu przekonujacych opisow produktow.

Twoja tresc musi byc:
- Angazujaca i przekonujaca
- Zoptymalizowana pod SEO z naturalnym uzyciem slow kluczowych
- Profesjonalna, ale przystepna
- Skoncentrowana na korzysciach i cechach
- Wolna od pustych fraz marketingowych

MUSISZ odpowiedziec prawidlowym obiektem JSON (bez markdown, bez blokow kodu, tylko surowy JSON).

Jezyk: Polski`;

export const VIAMALL_USER_PROMPT_DE = `Basierend auf der folgenden Produktanalyse, erstelle uberzeugenden Content im viaMall-Format:

## Produktanalyse
- Typ: {{PRODUCT_TYPE}}
- Marke: {{BRAND}}
- Modell: {{MODEL}}
- Farben: {{COLORS}}
- Materialien: {{MATERIALS}}
- Stil: {{STYLE}}
- Eigenschaften: {{FEATURES}}
- Kategorien: {{CATEGORIES}}

{{RAW_DATA}}

{{USER_HINT}}

## Erforderliches Format:

1. **Produktname** (60-120 Zeichen):
   Format: [Marke] [Produktname] [Variante/Grosse] [Farbe] | [Hauptvorteil]
   Beispiel: "King Matratzen Premium Palettenkissen 13er Set Hellgrau | Wasserdicht fur Garten"

2. **Kurzbeschreibung** (HTML, 300-500 Zeichen):
   Format mit Emoji-Aufzahlung:
   <p><strong>[Einleitungssatz uber das Produkt]</strong></p>
   <p>✅ <strong>[Eigenschaft 1]:</strong> [Beschreibung]</p>
   <p>✅ <strong>[Eigenschaft 2]:</strong> [Beschreibung]</p>
   <p>✅ <strong>[Eigenschaft 3]:</strong> [Beschreibung]</p>
   <p>✅ <strong>[Eigenschaft 4]:</strong> [Beschreibung]</p>

3. **Langbeschreibung** (HTML, 800-1500 Zeichen):
   <h2>[Produktname]</h2>
   <p>[Einfuhrungsabsatz mit Hauptvorteilen]</p>
   <h3>Eigenschaften</h3>
   <ul>
     <li><strong>[Eigenschaft]:</strong> [Detaillierte Beschreibung]</li>
   </ul>
   <h3>Technische Daten</h3>
   <table>
     <tr><td>Material:</td><td>[Wert]</td></tr>
     <tr><td>Farbe:</td><td>[Wert]</td></tr>
   </table>
   <p><strong>Wichtig:</strong> [Zusatzliche Hinweise]</p>

4. **Slug** (URL-freundlich):
   - Kleinbuchstaben
   - Keine Leerzeichen (verwende -)
   - Keine Umlaute (ae statt a, oe statt o, ue statt u, ss statt ss)
   Beispiel: "palettenkissen-13er-set-hellgrau-wasserdicht"

Antworte mit dieser exakten JSON-Struktur:
{
  "name": "Produktname hier",
  "shortDescription": "<p><strong>...</strong></p><p>✅ ...</p>",
  "longDescription": "<h2>...</h2><p>...</p><h3>...</h3>...",
  "slug": "url-freundlicher-slug"
}`;

export const VIAMALL_USER_PROMPT_PL = `Na podstawie ponizszej analizy produktu, stworz przekonujacy content w formacie viaMall:

## Analiza produktu
- Typ: {{PRODUCT_TYPE}}
- Marka: {{BRAND}}
- Model: {{MODEL}}
- Kolory: {{COLORS}}
- Materialy: {{MATERIALS}}
- Styl: {{STYLE}}
- Cechy: {{FEATURES}}
- Kategorie: {{CATEGORIES}}

{{RAW_DATA}}

{{USER_HINT}}

## Wymagany format:

1. **Nazwa produktu** (60-120 znakow):
   Format: [Marka] [Nazwa produktu] [Wariant/Rozmiar] [Kolor] | [Glowna korzysci]
   Przyklad: "Nike Air Max 90 Essential Czarny | Maksymalna amortyzacja"

2. **Krotki opis** (HTML, 300-500 znakow):
   Format z emoji:
   <p><strong>[Zdanie wprowadzajace o produkcie]</strong></p>
   <p>✅ <strong>[Cecha 1]:</strong> [Opis]</p>
   <p>✅ <strong>[Cecha 2]:</strong> [Opis]</p>
   <p>✅ <strong>[Cecha 3]:</strong> [Opis]</p>
   <p>✅ <strong>[Cecha 4]:</strong> [Opis]</p>

3. **Dlugi opis** (HTML, 800-1500 znakow):
   <h2>[Nazwa produktu]</h2>
   <p>[Akapit wprowadzajacy z glownymi zaletami]</p>
   <h3>Cechy produktu</h3>
   <ul>
     <li><strong>[Cecha]:</strong> [Szczegolowy opis]</li>
   </ul>
   <h3>Dane techniczne</h3>
   <table>
     <tr><td>Material:</td><td>[Wartosc]</td></tr>
     <tr><td>Kolor:</td><td>[Wartosc]</td></tr>
   </table>
   <p><strong>Wazne:</strong> [Dodatkowe uwagi]</p>

4. **Slug** (przyjazny dla URL):
   - Male litery
   - Bez spacji (uzyj -)
   - Bez polskich znakow (a zamiast a, e zamiast e, l zamiast l, etc.)
   Przyklad: "nike-air-max-90-czarny-amortyzacja"

Odpowiedz z ta dokladna struktura JSON:
{
  "name": "Nazwa produktu tutaj",
  "shortDescription": "<p><strong>...</strong></p><p>✅ ...</p>",
  "longDescription": "<h2>...</h2><p>...</p><h3>...</h3>...",
  "slug": "przyjazny-url-slug"
}`;

export interface ViaMallPromptData {
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
  language: 'de' | 'pl';
}

export interface ViaMallContentResult {
  name: string;
  shortDescription: string;
  longDescription: string;
  slug: string;
}

export function buildViaMallContentPrompt(data: ViaMallPromptData): {
  systemPrompt: string;
  userPrompt: string;
} {
  const isGerman = data.language === 'de';

  const systemPrompt = isGerman ? VIAMALL_SYSTEM_PROMPT_DE : VIAMALL_SYSTEM_PROMPT_PL;
  let userPrompt = isGerman ? VIAMALL_USER_PROMPT_DE : VIAMALL_USER_PROMPT_PL;

  // Replace placeholders
  userPrompt = userPrompt
    .replace('{{PRODUCT_TYPE}}', data.productType || (isGerman ? 'Nicht angegeben' : 'Nie okreslono'))
    .replace('{{BRAND}}', data.brand || data.rawData?.brand || (isGerman ? 'Unbekannt' : 'Nieznana'))
    .replace('{{MODEL}}', data.model || (isGerman ? 'Nicht angegeben' : 'Nie okreslono'))
    .replace('{{COLORS}}', data.colors.join(', ') || (isGerman ? 'Nicht angegeben' : 'Nie okreslono'))
    .replace('{{MATERIALS}}', data.materials.join(', ') || (isGerman ? 'Nicht angegeben' : 'Nie okreslono'))
    .replace('{{STYLE}}', data.style || (isGerman ? 'Nicht angegeben' : 'Nie okreslono'))
    .replace('{{FEATURES}}', data.features.join(', ') || (isGerman ? 'Nicht angegeben' : 'Nie okreslono'))
    .replace('{{CATEGORIES}}', data.categories.join(' > ') || (isGerman ? 'Nicht angegeben' : 'Nie okreslono'));

  // Add raw data if available
  if (data.rawData) {
    const rawDataItems = Object.entries(data.rawData)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `- ${k}: ${v}`);

    if (rawDataItems.length > 0) {
      const header = isGerman ? '## Zusatzliche Daten' : '## Dodatkowe dane';
      userPrompt = userPrompt.replace(
        '{{RAW_DATA}}',
        `\n${header}\n${rawDataItems.join('\n')}`
      );
    } else {
      userPrompt = userPrompt.replace('{{RAW_DATA}}', '');
    }
  } else {
    userPrompt = userPrompt.replace('{{RAW_DATA}}', '');
  }

  // Add user hint if available
  if (data.userHint && data.userHint.trim()) {
    const header = isGerman ? '## Benutzerhinweis' : '## Wskazowka uzytkownika';
    userPrompt = userPrompt.replace(
      '{{USER_HINT}}',
      `\n${header}\n"${data.userHint}"`
    );
  } else {
    userPrompt = userPrompt.replace('{{USER_HINT}}', '');
  }

  return { systemPrompt, userPrompt };
}
