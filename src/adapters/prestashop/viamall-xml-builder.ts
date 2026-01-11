// ViaMall XML Builder for PrestaShop
// Simplified builder focused on MVP fields only
// Supports multi-language content with proper German/Polish character handling

import { XMLBuilder } from 'fast-xml-parser';

export interface ViaMallProductData {
  name: string;
  shortDescription: string;
  longDescription: string;
  slug?: string;
  price: number;
  categoryId: string;
  sku?: string;
  ean?: string;
}

export interface ViaMallLanguageContent {
  languageId: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  slug: string;
}

export interface ViaMallXmlOptions {
  languageId?: string;
  categoryId?: string;
  active?: boolean;
  taxRulesGroupId?: string;
}

export class ViaMallXmlBuilder {
  private builder: XMLBuilder;
  private defaultOptions: Required<ViaMallXmlOptions>;

  constructor(defaultOptions: ViaMallXmlOptions = {}) {
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      format: true,
    });
    this.defaultOptions = {
      languageId: defaultOptions.languageId || '1',
      categoryId: defaultOptions.categoryId || '2',
      active: defaultOptions.active ?? true,
      taxRulesGroupId: defaultOptions.taxRulesGroupId || '1',
    };
  }

  // Build product XML with single language
  buildProductXml(product: ViaMallProductData, options: ViaMallXmlOptions = {}): string {
    const langId = options.languageId || this.defaultOptions.languageId;
    const categoryId = product.categoryId || options.categoryId || this.defaultOptions.categoryId;
    const slug = product.slug || this.slugify(product.name);

    const productData = {
      prestashop: {
        '@_xmlns:xlink': 'http://www.w3.org/1999/xlink',
        product: {
          // Category
          id_category_default: categoryId,
          id_tax_rules_group: options.taxRulesGroupId || this.defaultOptions.taxRulesGroupId,

          // Identifiers
          reference: product.sku ? this.escapeXml(product.sku) : '',
          ean13: product.ean || '',

          // Price (net, without tax)
          price: product.price.toFixed(6),

          // Status
          active: options.active !== false ? '1' : '0',
          state: '1',

          // Visibility
          visibility: 'both',
          available_for_order: '1',
          show_price: '1',
          minimal_quantity: '1',

          // Condition
          condition: 'new',

          // Text content - single language
          name: this.langNode(langId, product.name),
          description: this.langNode(langId, product.longDescription),
          description_short: this.langNode(langId, product.shortDescription),
          link_rewrite: this.langNode(langId, slug),

          // Associations
          associations: {
            categories: {
              category: [{ id: categoryId }],
            },
          },
        },
      },
    };

    return this.builder.build(productData);
  }

  // Build product XML with multiple languages
  buildMultiLanguageProductXml(
    contents: ViaMallLanguageContent[],
    baseProduct: { price: number; categoryId: string; sku?: string; ean?: string },
    options: ViaMallXmlOptions = {}
  ): string {
    const categoryId = baseProduct.categoryId || options.categoryId || this.defaultOptions.categoryId;

    const productData = {
      prestashop: {
        '@_xmlns:xlink': 'http://www.w3.org/1999/xlink',
        product: {
          // Category
          id_category_default: categoryId,
          id_tax_rules_group: options.taxRulesGroupId || this.defaultOptions.taxRulesGroupId,

          // Identifiers
          reference: baseProduct.sku ? this.escapeXml(baseProduct.sku) : '',
          ean13: baseProduct.ean || '',

          // Price (net, without tax)
          price: baseProduct.price.toFixed(6),

          // Status
          active: options.active !== false ? '1' : '0',
          state: '1',

          // Visibility
          visibility: 'both',
          available_for_order: '1',
          show_price: '1',
          minimal_quantity: '1',

          // Condition
          condition: 'new',

          // Text content - multiple languages
          name: this.multiLangNode(contents.map(c => ({ languageId: c.languageId, text: c.name }))),
          description: this.multiLangNode(contents.map(c => ({ languageId: c.languageId, text: c.longDescription }))),
          description_short: this.multiLangNode(contents.map(c => ({ languageId: c.languageId, text: c.shortDescription }))),
          link_rewrite: this.multiLangNode(contents.map(c => ({ languageId: c.languageId, text: c.slug }))),

          // Associations
          associations: {
            categories: {
              category: [{ id: categoryId }],
            },
          },
        },
      },
    };

    return this.builder.build(productData);
  }

  // Helper: Create single language node
  private langNode(languageId: string, text: string) {
    return {
      language: {
        '@_id': languageId,
        '#text': this.escapeXml(text || ''),
      },
    };
  }

  // Helper: Create multi-language node
  private multiLangNode(texts: Array<{ languageId: string; text: string }>) {
    return {
      language: texts.map(t => ({
        '@_id': t.languageId,
        '#text': this.escapeXml(t.text || ''),
      })),
    };
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

  // Create URL-friendly slug with German/Polish character support
  slugify(text: string): string {
    // Character mapping for German and Polish special characters
    const charMap: Record<string, string> = {
      // German
      '\u00e4': 'ae', // ae
      '\u00f6': 'oe', // oe
      '\u00fc': 'ue', // ue
      '\u00c4': 'ae', // Ae
      '\u00d6': 'oe', // Oe
      '\u00dc': 'ue', // Ue
      '\u00df': 'ss', // ss
      // Polish
      '\u0105': 'a',  // a with ogonek
      '\u0107': 'c',  // c with acute
      '\u0119': 'e',  // e with ogonek
      '\u0142': 'l',  // l with stroke
      '\u0144': 'n',  // n with acute
      '\u00f3': 'o',  // o with acute
      '\u015b': 's',  // s with acute
      '\u017a': 'z',  // z with acute
      '\u017c': 'z',  // z with dot
      '\u0104': 'a',  // A with ogonek
      '\u0106': 'c',  // C with acute
      '\u0118': 'e',  // E with ogonek
      '\u0141': 'l',  // L with stroke
      '\u0143': 'n',  // N with acute
      '\u00d3': 'o',  // O with acute
      '\u015a': 's',  // S with acute
      '\u0179': 'z',  // Z with acute
      '\u017b': 'z',  // Z with dot
    };

    let result = text.toString().toLowerCase();

    // Replace mapped characters
    for (const [char, replacement] of Object.entries(charMap)) {
      result = result.replace(new RegExp(char, 'g'), replacement);
    }

    return result
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove remaining diacritics
      .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric with dash
      .replace(/(^-|-$)+/g, '')        // Remove leading/trailing dashes
      .slice(0, 128);                  // PrestaShop limit
  }
}

// Export singleton instance for convenience
export const viamallXmlBuilder = new ViaMallXmlBuilder();
