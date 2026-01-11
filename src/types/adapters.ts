// Platform Adapter Types for Product AI Creator
// Defines the interface for platform integrations (PrestaShop, WooCommerce, etc.)

import type { UnifiedProduct } from './unified-product';

// Supported platforms
export type Platform = 'prestashop' | 'woocommerce' | 'allegro' | 'amazon' | 'baselinker';

// Platform category
export interface PlatformCategory {
  id: string;
  name: string;
  path?: string;        // Full path like "Odzież > Buty > Sneakers"
  parentId?: string;
  level?: number;
}

// Platform attribute/feature
export interface PlatformAttribute {
  id: string;
  name: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean' | 'number';
  values?: string[];    // Possible values for select/multiselect
  required?: boolean;
  groupId?: string;
  groupName?: string;
}

// Platform context - categories, attributes, etc. available on the platform
export interface PlatformContext {
  categories: PlatformCategory[];
  attributes: PlatformAttribute[];
  languages?: { id: string; name: string; isoCode: string }[];
  currencies?: { id: string; name: string; isoCode: string }[];
  taxRules?: { id: string; name: string; rate: number }[];
}

// Publish options
export interface PublishOptions {
  // Category mapping
  categoryId?: string;
  categoryIds?: string[];

  // Attribute mapping (platform attribute ID -> value)
  attributeMapping?: Record<string, string>;

  // Language
  languageId?: string;

  // Stock
  warehouseId?: string;

  // Pricing
  currencyId?: string;
  taxRuleId?: string;

  // Visibility
  active?: boolean;
  visibility?: 'visible' | 'catalog' | 'search' | 'hidden';

  // Platform-specific options
  platformOptions?: Record<string, unknown>;
}

// Publish result
export interface PublishResult {
  success: boolean;
  externalId?: string;     // Product ID on the platform
  externalUrl?: string;    // Product URL on the platform
  error?: string;
  response?: unknown;      // Raw API response
}

// Platform Adapter Interface
export interface PlatformAdapter {
  // Platform identifier
  readonly platform: Platform;

  // Platform display name
  readonly displayName: string;

  // Test connection to the platform
  testConnection(): Promise<{ success: boolean; error?: string }>;

  // Get platform context (categories, attributes, etc.)
  getContext(): Promise<PlatformContext>;

  // Transform UnifiedProduct to platform-specific format
  transformProduct(
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<unknown>;

  // Publish product to the platform
  publishProduct(
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<PublishResult>;

  // Update existing product
  updateProduct(
    externalId: string,
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<PublishResult>;

  // Delete product from platform
  deleteProduct(externalId: string): Promise<{ success: boolean; error?: string }>;

  // Get product by external ID
  getProduct(externalId: string): Promise<unknown>;

  // Upload image to platform
  uploadImage(
    productId: string,
    imageUrl: string,
    position?: number
  ): Promise<{ success: boolean; imageId?: string; error?: string }>;
}

// Platform configuration
export interface PlatformConfig {
  platform: Platform;
  apiUrl: string;
  apiKey: string;
  settings?: Record<string, unknown>;
}

// Adapter factory type
export type AdapterFactory = (config: PlatformConfig) => PlatformAdapter;

// Adapter registry
export interface AdapterRegistry {
  register(platform: Platform, factory: AdapterFactory): void;
  get(platform: Platform, config: PlatformConfig): PlatformAdapter;
  has(platform: Platform): boolean;
  list(): Platform[];
}
