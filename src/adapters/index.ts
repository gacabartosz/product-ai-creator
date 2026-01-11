// Platform Adapters Index
// Export all adapters and provide a registry

import type { Platform, PlatformConfig, PlatformAdapter, AdapterFactory } from '@/types/adapters';
import { PrestaShopAdapter, createPrestaShopAdapter } from './prestashop';

export { BasePlatformAdapter } from './base';
export { PrestaShopAdapter, createPrestaShopAdapter };

// Adapter registry
const adapterFactories: Map<Platform, AdapterFactory> = new Map();

// Register default adapters
adapterFactories.set('prestashop', createPrestaShopAdapter);

/**
 * Register a new adapter factory
 */
export function registerAdapter(platform: Platform, factory: AdapterFactory): void {
  adapterFactories.set(platform, factory);
}

/**
 * Create an adapter instance
 */
export function createAdapter(config: PlatformConfig): PlatformAdapter {
  const factory = adapterFactories.get(config.platform);

  if (!factory) {
    throw new Error(`No adapter registered for platform: ${config.platform}`);
  }

  return factory(config);
}

/**
 * Check if adapter exists for platform
 */
export function hasAdapter(platform: Platform): boolean {
  return adapterFactories.has(platform);
}

/**
 * Get list of supported platforms
 */
export function getSupportedPlatforms(): Platform[] {
  return Array.from(adapterFactories.keys());
}

// Re-export types
export type {
  Platform,
  PlatformConfig,
  PlatformAdapter,
  PlatformContext,
  PlatformCategory,
  PlatformAttribute,
  PublishOptions,
  PublishResult,
} from '@/types/adapters';
