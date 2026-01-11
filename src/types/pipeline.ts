// Pipeline Types for Product AI Creator
// Defines the stages and data flow of the AI pipeline

import { z } from 'zod';
import type { UnifiedProduct } from './unified-product';

// Pipeline input - what user provides
export const PipelineInputSchema = z.object({
  // Uploaded images (URLs from storage)
  images: z.array(z.object({
    url: z.string().url(),
    mimeType: z.string(),
    filename: z.string(),
  })).min(1),

  // Optional user hint about the product
  userHint: z.string().optional(),

  // Optional raw data (from barcode scan, CSV import, etc.)
  rawData: z.object({
    ean: z.string().optional(),
    sku: z.string().optional(),
    priceGross: z.number().positive().optional(),
    priceNet: z.number().positive().optional(),
    vatRate: z.number().min(0).max(100).optional(),
    brand: z.string().optional(),
    manufacturer: z.string().optional(),
    quantity: z.number().int().min(0).optional(),
    weight: z.number().positive().optional(),
    categories: z.array(z.string()).optional(),
  }).optional(),
});

export type PipelineInput = z.infer<typeof PipelineInputSchema>;

// Vision Analysis Result - output from Stage 1
export const VisionAnalysisSchema = z.object({
  // What the AI sees in the images
  productType: z.string(),           // "Sneakers", "T-Shirt", "Watch", etc.
  detectedBrand: z.string().optional(),
  detectedModel: z.string().optional(),

  // Visual attributes
  colors: z.array(z.string()),
  materials: z.array(z.string()),
  style: z.string().optional(),      // "Casual", "Formal", "Sports", etc.

  // Physical characteristics
  condition: z.enum(['new', 'used', 'refurbished']).optional(),

  // Key features visible in images
  features: z.array(z.string()),

  // Suggested categories based on visual analysis
  suggestedCategories: z.array(z.string()),

  // AI confidence score (0-1)
  confidence: z.number().min(0).max(1),

  // Raw AI response for debugging
  rawResponse: z.string().optional(),
});

export type VisionAnalysis = z.infer<typeof VisionAnalysisSchema>;

// Content Generation Result - output from Stage 2
export const ContentGenerationSchema = z.object({
  // Generated product name
  name: z.string(),

  // Generated descriptions
  shortDescription: z.string(),
  longDescription: z.string(),
  htmlDescription: z.string().optional(),

  // SEO content
  seoTitle: z.string(),
  seoDescription: z.string(),
  keywords: z.array(z.string()),

  // Generated attributes
  attributes: z.record(z.string(), z.string()),

  // Tags for search
  tags: z.array(z.string()),

  // Image alt texts
  imageAlts: z.array(z.string()),

  // Raw AI response for debugging
  rawResponse: z.string().optional(),
});

export type ContentGeneration = z.infer<typeof ContentGenerationSchema>;

// Pipeline Stage Status
export type StageStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

// Pipeline Stage Result
export interface StageResult<T> {
  status: StageStatus;
  data?: T;
  error?: string;
  durationMs: number;
}

// Full Pipeline Output
export interface PipelineOutput {
  // Stage results
  visionAnalysis: StageResult<VisionAnalysis>;
  contentGeneration: StageResult<ContentGeneration>;
  validation: StageResult<{ isValid: boolean; errors?: string[] }>;

  // Final product (if all stages successful)
  product?: UnifiedProduct;

  // Overall status
  status: 'completed' | 'partial' | 'failed';

  // Total processing time
  totalDurationMs: number;

  // Error summary
  errors?: string[];
}

// Pipeline Progress Callback
export type PipelineProgressCallback = (progress: {
  stage: 'vision' | 'content' | 'validation';
  status: StageStatus;
  message?: string;
  progress?: number; // 0-100
}) => void;

// Pipeline Options
export interface PipelineOptions {
  // Skip stages if data already available
  skipVision?: boolean;
  skipContent?: boolean;

  // Override AI models
  visionModel?: string;
  contentModel?: string;

  // Language for content generation
  language?: 'pl' | 'en' | 'de';

  // Progress callback
  onProgress?: PipelineProgressCallback;

  // Custom system prompts
  visionSystemPrompt?: string;
  contentSystemPrompt?: string;
}
