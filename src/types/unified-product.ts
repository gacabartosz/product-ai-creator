// Unified Product Schema - Core data model for Product AI Creator
// This is the "lingua franca" between the AI pipeline and platform adapters

import { z } from 'zod';

// Zod schemas for validation
export const ProductImageSchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  position: z.number().int().min(0).default(0),
});

export const ProductDescriptionSchema = z.object({
  short: z.string().min(1).max(500),
  long: z.string().min(1),
  html: z.string().optional(),
});

export const ProductSEOSchema = z.object({
  title: z.string().min(1).max(70),
  description: z.string().min(1).max(160),
  keywords: z.array(z.string()).default([]),
});

export const ProductPricingSchema = z.object({
  gross: z.number().positive(),
  net: z.number().positive(),
  currency: z.string().length(3).default('PLN'),
  vatRate: z.number().min(0).max(100).default(23),
});

export const ProductIdentifiersSchema = z.object({
  ean: z.string().optional(),
  sku: z.string().optional(),
  mpn: z.string().optional(),
  isbn: z.string().optional(),
});

export const ProductStockSchema = z.object({
  quantity: z.number().int().min(0).default(1),
  availability: z.enum(['in_stock', 'out_of_stock', 'preorder']).default('in_stock'),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export const ProductDimensionsSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  unit: z.enum(['cm', 'mm', 'in']).default('cm'),
});

// Main UnifiedProduct schema
export const UnifiedProductSchema = z.object({
  // Basic info
  name: z.string().min(1).max(255),
  description: ProductDescriptionSchema,
  seo: ProductSEOSchema,

  // Pricing
  pricing: ProductPricingSchema,

  // Attributes (key-value pairs like Color: Red, Size: XL)
  attributes: z.record(z.string(), z.string()).default({}),

  // Categories (array of category names/paths)
  categories: z.array(z.string()).default([]),

  // Images
  images: z.array(ProductImageSchema).min(1),

  // Product identifiers
  identifiers: ProductIdentifiersSchema.optional(),

  // Stock info
  stock: ProductStockSchema,

  // Additional info
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  condition: z.enum(['new', 'used', 'refurbished']).default('new'),
  weight: z.number().positive().optional(), // in kg
  dimensions: ProductDimensionsSchema.optional(),

  // Tags for search/filtering
  tags: z.array(z.string()).default([]),

  // Platform-specific metadata
  metadata: z.record(z.string(), z.unknown()).default({}),
});

// TypeScript types inferred from Zod schemas
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type ProductDescription = z.infer<typeof ProductDescriptionSchema>;
export type ProductSEO = z.infer<typeof ProductSEOSchema>;
export type ProductPricing = z.infer<typeof ProductPricingSchema>;
export type ProductIdentifiers = z.infer<typeof ProductIdentifiersSchema>;
export type ProductStock = z.infer<typeof ProductStockSchema>;
export type ProductDimensions = z.infer<typeof ProductDimensionsSchema>;
export type UnifiedProduct = z.infer<typeof UnifiedProductSchema>;

// Partial version for drafts/updates
export type PartialUnifiedProduct = Partial<UnifiedProduct>;

// Create a default empty product
export function createEmptyProduct(): Partial<UnifiedProduct> {
  return {
    name: '',
    description: {
      short: '',
      long: '',
    },
    seo: {
      title: '',
      description: '',
      keywords: [],
    },
    pricing: {
      gross: 0,
      net: 0,
      currency: 'PLN',
      vatRate: 23,
    },
    attributes: {},
    categories: [],
    images: [],
    stock: {
      quantity: 1,
      availability: 'in_stock',
    },
    condition: 'new',
    tags: [],
    metadata: {},
  };
}

// Validate product data
export function validateProduct(data: unknown): {
  success: boolean;
  data?: UnifiedProduct;
  errors?: z.ZodError;
} {
  const result = UnifiedProductSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

// Helper to calculate net from gross
export function calculateNetPrice(gross: number, vatRate: number = 23): number {
  return gross / (1 + vatRate / 100);
}

// Helper to calculate gross from net
export function calculateGrossPrice(net: number, vatRate: number = 23): number {
  return net * (1 + vatRate / 100);
}
