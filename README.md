# Product AI Creator

Inteligentna platforma do automatycznego tworzenia opisow produktow e-commerce przy uzyciu sztucznej inteligencji. Wgraj zdjecia produktu, a AI wygeneruje opisy, SEO, atrybuty i wszystko czego potrzebujesz do sprzedazy online.

**Demo:** [https://bartoszgaca.pl/product-ai-creator](https://bartoszgaca.pl/product-ai-creator)

## Kluczowe funkcjonalnosci

- **Upload zdjec** - Przeciagnij lub wybierz 1-10 zdjec produktu (JPEG, PNG, GIF, WebP)
- **AI Vision Analysis** - Automatyczna analiza obrazow produktu (Google Gemma 3 27B)
- **Content Generation** - Pelne opisy, SEO, atrybuty produktowe (Multi-Provider LLM)
- **Multi-Language** - Obsluga niemieckiego (EUR) i polskiego (PLN)
- **One-Click Publish** - Publikacja bezposrednio na PrestaShop (WooCommerce, Allegro w planach)
- **Unified Product Schema** - Jeden format danych dla wszystkich platform e-commerce

## Stack technologiczny

| Kategoria | Technologia |
|-----------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Tailwind CSS, Framer Motion |
| **Backend** | Next.js API Routes, Prisma ORM |
| **Baza danych** | PostgreSQL |
| **AI - Vision** | Google AI Studio (Gemma 3 27B) |
| **AI - Text** | G.A.C.A. Multi-Provider Failover (6 providerow) |
| **Walidacja** | Zod Schema Validation |
| **Storage** | Cloudflare R2 / AWS S3 |
| **E-commerce** | PrestaShop Webservice API |

## G.A.C.A. Multi-Provider AI Failover

System automatycznie przelacza miedzy providerami AI gdy jeden osiagnie limit rate lub zwroci blad:

| Provider | Tier | Vision | Modele |
|----------|------|--------|--------|
| **Groq** | Free | - | Llama 3.3 70B, Mixtral 8x7B |
| **Cerebras** | Free | - | Llama 3.3 70B |
| **Google AI** | Free | Vision | Gemma 3 27B |
| **Mistral** | Free | - | Mistral Large, Codestral |
| **DeepSeek** | Paid | - | DeepSeek V3, Coder |
| **OpenRouter** | Paid | - | 100+ modeli |

```
Groq (429) -> Cerebras (429) -> Mistral (429) -> DeepSeek -> OpenRouter
     |              |              |              |            |
   Free          Free           Free           Paid        Fallback
```

## Architektura Pipeline

```
Upload zdjec -> Vision AI -> Content AI -> Walidacja -> Publikacja
     |              |             |            |            |
  1-10 img    Google Gemma   Multi-LLM      Zod        PrestaShop
              (rozpoznanie) (generowanie)  Schema      WooCommerce
                                                       Allegro
```

### 3-Stage AI Pipeline

| Stage | Cel | Model |
|-------|-----|-------|
| **1. Vision** | Analiza obrazow: typ, marka, kolory, materialy, cechy | Google Gemma 3 27B |
| **2. Content** | Generowanie: nazwa, opisy, SEO, atrybuty, tagi | G.A.C.A. Failover |
| **3. Validation** | Walidacja wygenerowanych danych | Zod UnifiedProductSchema |

## Unified Product Schema

Jeden format danych kompatybilny z wszystkimi platformami e-commerce:

```typescript
UnifiedProduct {
  name: string              // Nazwa produktu
  description: {
    short: string           // Krotki opis (max 500 znakow)
    long: string            // Pelny opis HTML
  }
  seo: {
    title: string           // SEO title (max 70 znakow)
    description: string     // Meta description (max 160 znakow)
    keywords: string[]      // Slowa kluczowe
  }
  pricing: {
    gross: number           // Cena brutto
    net: number             // Cena netto
    currency: 'PLN' | 'EUR' // Waluta
    vatRate: number         // Stawka VAT
  }
  attributes: Record<string, string>  // Atrybuty (Kolor: Czerwony, Rozmiar: XL)
  categories: string[]      // Kategorie produktu
  images: ProductImage[]    // Zdjecia z URL i alt
  identifiers: {
    ean?: string            // EAN
    sku?: string            // SKU
    mpn?: string            // MPN
  }
  stock: {
    quantity: number        // Ilosc
    availability: 'in_stock' | 'out_of_stock' | 'preorder'
  }
  brand?: string            // Marka
  weight?: number           // Waga (kg)
  dimensions?: {            // Wymiary
    width: number
    height: number
    depth: number
    unit: 'cm' | 'mm'
  }
  tags: string[]            // Tagi do wyszukiwania
}
```

## Instalacja

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/gacabartosz/product-ai-creator.git
cd product-ai-creator
```

### 2. Instalacja zaleznosci

```bash
npm install
```

### 3. Konfiguracja srodowiska

```bash
cp .env.example .env
```

Uzupelnij plik `.env`:

```env
# Baza danych PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/product_ai_creator"

# Google AI Studio (Vision - wymagane)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# Opcjonalne providery AI (G.A.C.A. Failover)
GROQ_API_KEY="your-groq-api-key"
CEREBRAS_API_KEY="your-cerebras-api-key"
MISTRAL_API_KEY="your-mistral-api-key"
DEEPSEEK_API_KEY="your-deepseek-api-key"
OPENROUTER_API_KEY="sk-or-your-openrouter-key"

# Cloudflare R2 Storage
STORAGE_PROVIDER="r2"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="product-ai-uploads"
R2_PUBLIC_URL="https://uploads.yourdomain.com"

# PrestaShop (opcjonalne)
PRESTASHOP_URL="https://your-shop.com"
PRESTASHOP_API_KEY="your-prestashop-webservice-key"
```

### 4. Inicjalizacja bazy danych

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Uruchomienie

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/upload` | POST | Upload zdjec, tworzenie draftu |
| `/api/pipeline` | POST | Uruchomienie 3-stage AI pipeline |
| `/api/drafts` | GET | Lista wszystkich draftow |
| `/api/drafts/[id]` | GET | Pobranie draftu |
| `/api/drafts/[id]` | PATCH | Aktualizacja draftu |
| `/api/publish/[id]` | POST | Publikacja na platforme e-commerce |

## Struktura projektu

```
product-ai-creator/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── upload/        # Upload zdjec
│   │   │   ├── pipeline/      # AI pipeline
│   │   │   ├── drafts/        # CRUD draftow
│   │   │   └── publish/       # Publikacja
│   │   ├── draft/[id]/        # Strona edycji draftu
│   │   ├── drafts/            # Lista draftow
│   │   └── page.tsx           # Strona glowna (upload)
│   │
│   ├── components/            # Komponenty React
│   │   └── ui/               # Komponenty UI (glassmorphism)
│   │
│   ├── services/              # Logika biznesowa
│   │   ├── ai/               # G.A.C.A. Multi-Provider AI
│   │   │   ├── adapters/     # Adaptery providerow
│   │   │   │   ├── GroqAdapter.ts
│   │   │   │   ├── CerebrasAdapter.ts
│   │   │   │   ├── GoogleAIAdapter.ts
│   │   │   │   ├── MistralAdapter.ts
│   │   │   │   ├── DeepSeekAdapter.ts
│   │   │   │   └── OpenRouterAdapter.ts
│   │   │   └── index.ts      # Failover orchestrator
│   │   ├── pipeline/         # 3-stage pipeline
│   │   │   ├── vision-stage.ts
│   │   │   ├── content-stage.ts
│   │   │   └── validation-stage.ts
│   │   └── storage/          # Storage (R2, S3, local)
│   │
│   ├── adapters/              # Adaptery platform e-commerce
│   │   └── prestashop/       # Integracja PrestaShop
│   │
│   ├── types/                 # Typy TypeScript
│   │   └── unified-product.ts # Unified Product Schema (Zod)
│   │
│   ├── prompts/               # Szablony promptow AI
│   └── lib/                   # Utilities
│
├── prisma/
│   └── schema.prisma          # Schema bazy danych
│
├── public/
│   └── uploads/               # Lokalne zdjecia (dev)
│
└── test-images/               # Zdjecia testowe
```

## Deployment (PM2 + nginx)

### PM2

```bash
# Build
npm run build

# Start z PM2
pm2 start npm --name "product-ai-creator" -- start -- -p 3400
pm2 save
pm2 startup
```

### nginx

```nginx
# Uploads (pliki statyczne)
location ^~ /product-ai-creator/uploads/ {
    alias /path/to/product-ai-creator/public/uploads/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Aplikacja
location ^~ /product-ai-creator {
    client_max_body_size 50M;
    proxy_pass http://127.0.0.1:3400;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 120s;
}
```

## Kategorie produktow

Dedykowane dla branzy home & garden:
- Maty wiklinowe i akcesoria
- Ploty sztachetowe i akcesoria
- Materace
- Lozka
- Poduszki
- i wiele innych...

## Roadmap

- [x] Upload zdjec z drag & drop
- [x] Google AI Vision (Gemma 3 27B)
- [x] G.A.C.A. Multi-Provider Failover
- [x] Unified Product Schema (Zod)
- [x] PrestaShop integration
- [ ] WooCommerce integration
- [ ] Allegro integration
- [ ] Batch processing (wiele produktow)
- [ ] Historia generowania
- [ ] Szablony promptow per kategoria

## Licencja

MIT

## Autor

**Bartosz Gaca**
- Web: [bartoszgaca.pl](https://bartoszgaca.pl)
- Email: gaca.bartosz@gmail.com
- GitHub: [github.com/gacabartosz](https://github.com/gacabartosz)
- LinkedIn: [linkedin.com/in/bartoszgaca](https://linkedin.com/in/bartoszgaca)
