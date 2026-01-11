# Product AI Creator

Platforma do automatycznego tworzenia opisow produktow e-commerce przy uzyciu sztucznej inteligencji.

**Demo:** https://bartoszgaca.pl/product-ai-creator

## Funkcjonalnosci

- **Upload zdjec** - Przeciagnij lub wybierz 1-10 zdjec produktu
- **AI Vision** - Automatyczna analiza obrazow (Google Gemma 3 27B)
- **Generowanie tresci** - Opisy, SEO, atrybuty produktu (OpenRouter Llama 3.3 70B)
- **Publikacja** - Jednym kliknieciem na PrestaShop (WooCommerce, Allegro w planach)

## Stack technologiczny

| Kategoria | Technologia |
|-----------|-------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes, Prisma ORM |
| Baza danych | PostgreSQL |
| AI - Vision | Google AI Studio (Gemma 3 27B) |
| AI - Tekst | OpenRouter (Llama 3.3 70B) |
| Storage | Cloudflare R2 / AWS S3 |
| E-commerce | PrestaShop Webservice API |

## Architektura

```
Upload zdjec -> Vision AI -> Content AI -> Walidacja -> Publikacja
     |              |             |            |            |
  Obrazy      Analiza       Generowanie    Schemat     PrestaShop
             produktu        opisow        Zod         WooCommerce
                                                       Allegro
```

## Instalacja

### 1. Klonowanie repozytorium

```bash
git clone https://github.com/BartoszGaca/product-ai-creator.git
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

# Google AI Studio (Gemma 3)
GOOGLE_AI_API_KEY="your-google-ai-api-key"

# OpenRouter (Llama 3.3)
OPENROUTER_API_KEY="sk-or-your-openrouter-key"

# Cloudflare R2 Storage
STORAGE_PROVIDER="r2"
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="product-ai-uploads"
R2_PUBLIC_URL="https://uploads.yourdomain.com"

# PrestaShop
PRESTASHOP_URL="https://your-shop.com"
PRESTASHOP_API_KEY="your-prestashop-webservice-key"
```

### 4. Inicjalizacja bazy danych

```bash
npx prisma migrate dev
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
| `/api/pipeline` | POST | Uruchomienie pipeline AI |
| `/api/drafts/[id]` | GET | Pobranie draftu |
| `/api/drafts/[id]` | PATCH | Aktualizacja draftu |
| `/api/publish/[id]` | POST | Publikacja na platforme |

## Struktura projektu

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API endpoints
│   ├── draft/[id]/        # Strona edycji draftu
│   └── page.tsx           # Strona glowna (upload)
├── components/            # Komponenty React
│   └── ui/               # Komponenty UI
├── services/              # Logika biznesowa
│   ├── ai/               # Adaptery AI (Google, OpenRouter)
│   ├── pipeline/         # 3-etapowy pipeline
│   └── storage/          # Storage (R2, S3, local)
├── adapters/              # Adaptery platform e-commerce
│   └── prestashop/       # Integracja PrestaShop
├── types/                 # Typy TypeScript
│   └── unified-product.ts # Schemat produktu (Zod)
└── prompts/               # Szablony promptow AI
```

## Pipeline AI

### 1. Vision Stage
- Analiza obrazow produktu
- Rozpoznanie: typ, marka, kolory, materialy, cechy
- Model: Google Gemma 3 27B

### 2. Content Stage
- Generowanie pelnych opisow
- SEO: tytul, opis, slowa kluczowe
- Atrybuty produktowe
- Model: Llama 3.3 70B (OpenRouter)

### 3. Validation Stage
- Walidacja wygenerowanych danych
- Schemat: Zod UnifiedProductSchema
- Obsluga bledow i retry

## Deployment (PM2 + nginx)

```bash
# Build
npm run build

# PM2
pm2 start npm --name "product-ai-creator" --cwd /path/to/project -- start -- -p 3400
pm2 save

# nginx (dodaj do konfiguracji)
location ^~ /product-ai-creator {
    proxy_pass http://127.0.0.1:3400;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## Licencja

MIT

## Autor

Bartosz Gaca - [bartoszgaca.pl](https://bartoszgaca.pl)
