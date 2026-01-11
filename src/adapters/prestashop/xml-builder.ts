// PrestaShop XML Builder
// Builds XML structures for PrestaShop Webservice API

import { XMLBuilder } from 'fast-xml-parser';
import type { UnifiedProduct } from '@/types/unified-product';
import type { PublishOptions } from '@/types/adapters';

export interface PrestaShopProductOptions {
  languageId?: number;
  defaultCategoryId?: number;
  taxRulesGroupId?: number;
  active?: boolean;
}

export class PrestaShopXmlBuilder {
  private builder: XMLBuilder;
  private defaultOptions: PrestaShopProductOptions;

  constructor(defaultOptions: PrestaShopProductOptions = {}) {
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });
    this.defaultOptions = {
      languageId: 1,
      defaultCategoryId: 2, // Usually "Home" category
      taxRulesGroupId: 1,
      active: true,
      ...defaultOptions,
    };
  }

  // Build product XML from UnifiedProduct
  buildProductXml(
    product: UnifiedProduct,
    options: PublishOptions = {}
  ): string {
    const langId = options.languageId || String(this.defaultOptions.languageId);
    const categoryId = options.categoryId
      || String(this.defaultOptions.defaultCategoryId);

    // Helper to create language node
    const langNode = (text: string) => ({
      language: {
        '@_id': langId,
        '#text': this.escapeXml(text || ''),
      },
    });

    // Build associations (categories)
    const categories: Array<{ id: string }> = [];
    if (categoryId) {
      categories.push({ id: categoryId });
    }
    if (options.categoryIds) {
      options.categoryIds.forEach(id => {
        if (id !== categoryId) {
          categories.push({ id });
        }
      });
    }

    // Build product structure
    const productData = {
      prestashop: {
        '@_xmlns:xlink': 'http://www.w3.org/1999/xlink',
        product: {
          // Basic info
          id_category_default: categoryId,
          id_tax_rules_group: options.taxRuleId
            || String(this.defaultOptions.taxRulesGroupId),

          // Reference/identifiers
          reference: product.identifiers?.sku || '',
          ean13: product.identifiers?.ean || '',

          // Pricing (net price, without tax)
          price: product.pricing.net.toFixed(6),

          // Status
          active: options.active !== false ? '1' : '0',

          // Physical attributes
          weight: product.weight?.toFixed(6) || '0.000000',
          width: product.dimensions?.width?.toFixed(6) || '0.000000',
          height: product.dimensions?.height?.toFixed(6) || '0.000000',
          depth: product.dimensions?.depth?.toFixed(6) || '0.000000',

          // Condition
          condition: product.condition || 'new',

          // Visibility
          visibility: options.visibility || 'both',
          available_for_order: '1',
          show_price: '1',

          // Minimal quantity
          minimal_quantity: '1',

          // Text content
          name: langNode(product.name),
          description: langNode(product.description.html || product.description.long),
          description_short: langNode(product.description.short),
          meta_title: langNode(product.seo.title),
          meta_description: langNode(product.seo.description),
          meta_keywords: langNode(product.seo.keywords.join(', ')),
          link_rewrite: langNode(this.slugify(product.name)),

          // Associations
          associations: {
            categories: {
              category: categories,
            },
          },
        },
      },
    };

    return this.builder.build(productData);
  }

  // Build product update XML (includes ID)
  buildProductUpdateXml(
    productId: number,
    product: UnifiedProduct,
    options: PublishOptions = {}
  ): string {
    const langId = options.languageId || String(this.defaultOptions.languageId);

    const langNode = (text: string) => ({
      language: {
        '@_id': langId,
        '#text': this.escapeXml(text || ''),
      },
    });

    const productData = {
      prestashop: {
        '@_xmlns:xlink': 'http://www.w3.org/1999/xlink',
        product: {
          id: productId,
          reference: product.identifiers?.sku || '',
          ean13: product.identifiers?.ean || '',
          price: product.pricing.net.toFixed(6),
          weight: product.weight?.toFixed(6) || '0.000000',
          name: langNode(product.name),
          description: langNode(product.description.html || product.description.long),
          description_short: langNode(product.description.short),
          meta_title: langNode(product.seo.title),
          meta_description: langNode(product.seo.description),
          meta_keywords: langNode(product.seo.keywords.join(', ')),
        },
      },
    };

    return this.builder.build(productData);
  }

  // Build stock update XML
  buildStockXml(stockAvailableId: number, quantity: number): string {
    const stockData = {
      prestashop: {
        stock_available: {
          id: stockAvailableId,
          quantity: quantity,
        },
      },
    };

    return this.builder.build(stockData);
  }

  // Escape special XML characters
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Create URL-friendly slug
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric
      .replace(/(^-|-$)+/g, '') // Remove leading/trailing
      .slice(0, 128); // PrestaShop limit
  }
}
