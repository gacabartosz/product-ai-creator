// PrestaShop Webservice API Client
// Handles communication with PrestaShop's XML-based REST API

import { XMLParser, XMLBuilder } from 'fast-xml-parser';

export interface PrestaShopApiConfig {
  apiUrl: string;
  apiKey: string;
  languageId?: number;
}

export interface PrestaShopCategory {
  id: number;
  id_parent: number;
  name: string;
  active: boolean;
  level_depth: number;
}

export interface PrestaShopProduct {
  id?: number;
  id_category_default: number;
  price: string;
  active: number;
  name: { language: { '@_id': string; '#text': string } | Array<{ '@_id': string; '#text': string }> };
  description: { language: { '@_id': string; '#text': string } | Array<{ '@_id': string; '#text': string }> };
  description_short: { language: { '@_id': string; '#text': string } | Array<{ '@_id': string; '#text': string }> };
  meta_title?: { language: { '@_id': string; '#text': string } | Array<{ '@_id': string; '#text': string }> };
  meta_description?: { language: { '@_id': string; '#text': string } | Array<{ '@_id': string; '#text': string }> };
  reference?: string;
  ean13?: string;
  weight?: string;
  quantity?: number;
  associations?: {
    categories?: { category: Array<{ id: number }> };
  };
}

export class PrestaShopApiClient {
  private config: PrestaShopApiConfig;
  private parser: XMLParser;
  private builder: XMLBuilder;

  constructor(config: PrestaShopApiConfig) {
    this.config = config;
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
  }

  // Build auth header
  private getAuthHeader(): string {
    return `Basic ${Buffer.from(this.config.apiKey + ':').toString('base64')}`;
  }

  // Make API request
  private async request(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.config.apiUrl}/api/${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.getAuthHeader(),
        ...options.headers,
      },
    });

    return response;
  }

  // Parse XML response
  private parseXml(xml: string): unknown {
    return this.parser.parse(xml);
  }

  // Build XML from object
  private buildXml(obj: unknown): string {
    return this.builder.build(obj);
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request('', { method: 'GET' });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get categories
  async getCategories(): Promise<PrestaShopCategory[]> {
    const response = await this.request(
      'categories?display=[id,id_parent,name,active,level_depth]&output_format=JSON'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch categories: ${response.status}`);
    }

    const data = await response.json();
    return data.categories || [];
  }

  // Get product features (attributes)
  async getFeatures(): Promise<Array<{ id: number; name: string }>> {
    const response = await this.request(
      'product_features?display=[id,name]&output_format=JSON'
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch features: ${response.status}`);
    }

    const data = await response.json();
    return data.product_features || [];
  }

  // Get blank product schema
  async getBlankProduct(): Promise<string> {
    const response = await this.request('products?schema=blank');

    if (!response.ok) {
      throw new Error(`Failed to get product schema: ${response.status}`);
    }

    return response.text();
  }

  // Create product
  async createProduct(productXml: string): Promise<{
    success: boolean;
    productId?: number;
    error?: string;
  }> {
    try {
      const response = await this.request('products', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml',
        },
        body: productXml,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const responseXml = await response.text();
      const parsed = this.parseXml(responseXml) as {
        prestashop?: { product?: { id?: number } };
      };

      const productId = parsed?.prestashop?.product?.id;

      return {
        success: true,
        productId: productId ? Number(productId) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Update product
  async updateProduct(
    productId: number,
    productXml: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request(`products/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/xml',
        },
        body: productXml,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Delete product
  async deleteProduct(
    productId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.request(`products/${productId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Get product by ID
  async getProduct(productId: number): Promise<unknown> {
    const response = await this.request(
      `products/${productId}?output_format=JSON`
    );

    if (!response.ok) {
      throw new Error(`Failed to get product: ${response.status}`);
    }

    return response.json();
  }

  // Upload image to product
  async uploadImage(
    productId: number,
    imageBuffer: Buffer,
    imageName: string = 'image.jpg'
  ): Promise<{
    success: boolean;
    imageId?: number;
    error?: string;
  }> {
    try {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).slice(2);

      const body = Buffer.concat([
        Buffer.from(`--${boundary}\r\n`),
        Buffer.from(`Content-Disposition: form-data; name="image"; filename="${imageName}"\r\n`),
        Buffer.from('Content-Type: image/jpeg\r\n\r\n'),
        imageBuffer,
        Buffer.from(`\r\n--${boundary}--\r\n`),
      ]);

      const response = await this.request(`images/products/${productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const responseXml = await response.text();
      const parsed = this.parseXml(responseXml) as {
        prestashop?: { image?: { id?: number } };
      };

      return {
        success: true,
        imageId: parsed?.prestashop?.image?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Upload image from URL
  async uploadImageFromUrl(
    productId: number,
    imageUrl: string
  ): Promise<{
    success: boolean;
    imageId?: number;
    error?: string;
  }> {
    try {
      // Fetch the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        return {
          success: false,
          error: `Failed to fetch image: ${imageResponse.status}`,
        };
      }

      const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
      const urlParts = imageUrl.split('/');
      const imageName = urlParts[urlParts.length - 1] || 'image.jpg';

      return this.uploadImage(productId, imageBuffer, imageName);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Update stock
  async updateStock(
    stockAvailableId: number,
    quantity: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const xml = this.buildXml({
        prestashop: {
          stock_available: {
            id: stockAvailableId,
            quantity: quantity,
          },
        },
      });

      const response = await this.request(
        `stock_availables/${stockAvailableId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'text/xml',
          },
          body: xml,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
