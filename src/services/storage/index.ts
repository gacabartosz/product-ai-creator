// Storage Service for Product AI Creator
// S3-compatible storage (works with Cloudflare R2, AWS S3, MinIO)
// Also supports local filesystem storage

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { getFileExtension } from '@/lib/utils';
import * as fs from 'fs';
import * as path from 'path';

// Storage provider type
type StorageProvider = 'r2' | 's3' | 'local';

// Get storage configuration from environment
function getStorageConfig() {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as StorageProvider;

  if (provider === 'r2') {
    return {
      provider: 'r2' as const,
      accountId: process.env.R2_ACCOUNT_ID!,
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      bucket: process.env.R2_BUCKET_NAME || 'product-ai-uploads',
      publicUrl: process.env.R2_PUBLIC_URL,
    };
  }

  if (provider === 's3') {
    return {
      provider: 's3' as const,
      region: process.env.S3_REGION || 'us-east-1',
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
      bucket: process.env.S3_BUCKET_NAME!,
      publicUrl: process.env.S3_PUBLIC_URL,
    };
  }

  // Local storage (for development)
  return {
    provider: 'local' as const,
    publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
  };
}

// Create S3 client
function createS3Client() {
  const config = getStorageConfig();

  if (config.provider === 'r2') {
    return new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  if (config.provider === 's3') {
    return new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return null;
}

// Generate unique filename
function generateFilename(originalName: string, mimeType: string): string {
  const ext = getFileExtension(originalName) || getFileExtension(mimeType) || 'bin';
  const uuid = uuidv4();
  const timestamp = Date.now();
  return `products/${timestamp}-${uuid}.${ext}`;
}

// Upload image to storage
export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<{
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}> {
  const config = getStorageConfig();

  if (config.provider === 'local') {
    try {
      const key = generateFilename(filename, mimeType);
      const fileName = key.split('/').pop()!;
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      const filePath = path.join(uploadsDir, fileName);

      // Ensure uploads directory exists
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Write file to disk
      fs.writeFileSync(filePath, buffer);

      const localPath = `/uploads/${fileName}`;
      return {
        success: true,
        url: `${config.publicUrl}${localPath}`,
        key: localPath,
      };
    } catch (error) {
      console.error('Local storage error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Local storage failed',
      };
    }
  }

  try {
    const client = createS3Client();
    if (!client) {
      return { success: false, error: 'Storage client not configured' };
    }

    const key = generateFilename(filename, mimeType);
    const bucket = config.provider === 'r2' ? config.bucket : (config as { bucket: string }).bucket;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        // Make publicly readable
        ACL: 'public-read',
      })
    );

    // Build public URL
    let url: string;
    if (config.publicUrl) {
      url = `${config.publicUrl}/${key}`;
    } else if (config.provider === 'r2') {
      // R2 doesn't have a default public URL - must use custom domain or Workers
      url = `https://${bucket}.${config.accountId}.r2.cloudflarestorage.com/${key}`;
    } else {
      url = `https://${bucket}.s3.${(config as { region: string }).region}.amazonaws.com/${key}`;
    }

    return {
      success: true,
      url,
      key,
    };
  } catch (error) {
    console.error('Storage upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

// Delete image from storage
export async function deleteImage(key: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const config = getStorageConfig();

  if (config.provider === 'local') {
    try {
      const fileName = key.split('/').pop()!;
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (error) {
      console.error('Local delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }

  try {
    const client = createS3Client();
    if (!client) {
      return { success: false, error: 'Storage client not configured' };
    }

    const bucket = config.provider === 'r2' ? config.bucket : (config as { bucket: string }).bucket;

    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    return { success: true };
  } catch (error) {
    console.error('Storage delete error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    };
  }
}

// Get image from storage (for processing)
export async function getImage(key: string): Promise<{
  success: boolean;
  buffer?: Buffer;
  mimeType?: string;
  error?: string;
}> {
  const config = getStorageConfig();

  if (config.provider === 'local') {
    try {
      const fileName = key.split('/').pop()!;
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(fileName).toLowerCase();
      const mimeTypes: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      return {
        success: true,
        buffer,
        mimeType: mimeTypes[ext] || 'application/octet-stream',
      };
    } catch (error) {
      console.error('Local get error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Get failed',
      };
    }
  }

  try {
    const client = createS3Client();
    if (!client) {
      return { success: false, error: 'Storage client not configured' };
    }

    const bucket = config.provider === 'r2' ? config.bucket : (config as { bucket: string }).bucket;

    const response = await client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const bodyBytes = await response.Body?.transformToByteArray();
    if (!bodyBytes) {
      return { success: false, error: 'Empty response body' };
    }

    return {
      success: true,
      buffer: Buffer.from(bodyBytes),
      mimeType: response.ContentType,
    };
  } catch (error) {
    console.error('Storage get error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Get failed',
    };
  }
}

// Get public URL for a key
export function getPublicUrl(key: string): string {
  const config = getStorageConfig();

  if (config.publicUrl) {
    return `${config.publicUrl}/${key}`;
  }

  if (config.provider === 'r2') {
    return `https://${config.bucket}.${config.accountId}.r2.cloudflarestorage.com/${key}`;
  }

  if (config.provider === 's3') {
    const s3Config = config as { bucket: string; region: string };
    return `https://${s3Config.bucket}.s3.${s3Config.region}.amazonaws.com/${key}`;
  }

  // Local
  return `${config.publicUrl}/uploads/${key}`;
}
