// PrestaShop Adapter
// Implements PlatformAdapter interface for PrestaShop Webservice

import { BasePlatformAdapter } from '../base';
import { PrestaShopApiClient } from './api-client';
import { PrestaShopXmlBuilder } from './xml-builder';
import type {
  Platform,
  PlatformConfig,
  PlatformContext,
  PlatformCategory,
  PlatformAttribute,
  PublishOptions,
  PublishResult,
} from '@/types/adapters';
import type { UnifiedProduct } from '@/types/unified-product';

export class PrestaShopAdapter extends BasePlatformAdapter {
  readonly platform: Platform = 'prestashop';
  readonly displayName = 'PrestaShop';

  private client: PrestaShopApiClient;
  private xmlBuilder: PrestaShopXmlBuilder;

  constructor(config: PlatformConfig) {
    super(config);

    this.client = new PrestaShopApiClient({
      apiUrl: config.apiUrl,
      apiKey: config.apiKey,
      languageId: (config.settings?.languageId as number) || 1,
    });

    this.xmlBuilder = new PrestaShopXmlBuilder({
      languageId: (config.settings?.languageId as number) || 1,
      defaultCategoryId: (config.settings?.defaultCategoryId as number) || 2,
      taxRulesGroupId: (config.settings?.taxRulesGroupId as number) || 1,
    });
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    return this.client.testConnection();
  }

  async getContext(): Promise<PlatformContext> {
    // Fetch categories
    const rawCategories = await this.client.getCategories();
    const categories: PlatformCategory[] = rawCategories.map(cat => ({
      id: String(cat.id),
      name: cat.name,
      parentId: cat.id_parent ? String(cat.id_parent) : undefined,
      level: cat.level_depth,
    }));

    // Fetch features (product attributes)
    const rawFeatures = await this.client.getFeatures();
    const attributes: PlatformAttribute[] = rawFeatures.map(feat => ({
      id: String(feat.id),
      name: feat.name,
      type: 'text',
    }));

    return {
      categories,
      attributes,
    };
  }

  async transformProduct(
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<string> {
    return this.xmlBuilder.buildProductXml(product, options);
  }

  async publishProduct(
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<PublishResult> {
    try {
      // Build product XML
      const productXml = this.xmlBuilder.buildProductXml(product, options);

      // Create product
      const createResult = await this.client.createProduct(productXml);

      if (!createResult.success || !createResult.productId) {
        return {
          success: false,
          error: createResult.error || 'Failed to create product',
        };
      }

      const productId = createResult.productId;

      // Upload images
      for (let i = 0; i < product.images.length; i++) {
        const image = product.images[i];
        const imageResult = await this.client.uploadImageFromUrl(
          productId,
          image.url
        );

        if (!imageResult.success) {
          console.warn(`Failed to upload image ${i + 1}: ${imageResult.error}`);
        }
      }

      // Build external URL
      const shopUrl = this.config.apiUrl.replace('/api', '');
      const externalUrl = `${shopUrl}/index.php?controller=product&id_product=${productId}`;

      return {
        success: true,
        externalId: String(productId),
        externalUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async updateProduct(
    externalId: string,
    product: UnifiedProduct,
    options?: PublishOptions
  ): Promise<PublishResult> {
    try {
      const productId = parseInt(externalId, 10);

      // Build update XML
      const productXml = this.xmlBuilder.buildProductUpdateXml(
        productId,
        product,
        options
      );

      // Update product
      const updateResult = await this.client.updateProduct(productId, productXml);

      if (!updateResult.success) {
        return {
          success: false,
          error: updateResult.error || 'Failed to update product',
        };
      }

      const shopUrl = this.config.apiUrl.replace('/api', '');
      const externalUrl = `${shopUrl}/index.php?controller=product&id_product=${productId}`;

      return {
        success: true,
        externalId,
        externalUrl,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async deleteProduct(
    externalId: string
  ): Promise<{ success: boolean; error?: string }> {
    const productId = parseInt(externalId, 10);
    return this.client.deleteProduct(productId);
  }

  async getProduct(externalId: string): Promise<unknown> {
    const productId = parseInt(externalId, 10);
    return this.client.getProduct(productId);
  }

  async uploadImage(
    productId: string,
    imageUrl: string,
    position?: number
  ): Promise<{ success: boolean; imageId?: string; error?: string }> {
    const result = await this.client.uploadImageFromUrl(
      parseInt(productId, 10),
      imageUrl
    );

    return {
      success: result.success,
      imageId: result.imageId ? String(result.imageId) : undefined,
      error: result.error,
    };
  }
}

// Export factory function
export function createPrestaShopAdapter(config: PlatformConfig): PrestaShopAdapter {
  return new PrestaShopAdapter(config);
}
