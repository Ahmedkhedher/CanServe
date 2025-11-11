import { minioConfig, getMinioUrl } from '../config/minio';
import * as Crypto from 'expo-crypto';

/**
 * MinIO Storage Service
 * Provides S3-compatible object storage for the React Native app
 */

/**
 * Initialize the MinIO bucket if it doesn't exist
 * This should be called from your backend or setup script
 */
export async function initializeMinIOBucket(): Promise<void> {
  try {
    // Check if bucket exists by trying to list objects
    const response = await fetch(
      `${minioConfig.endpoint}/${minioConfig.bucketName}?max-keys=1`,
      {
        method: 'GET',
        headers: {
          Authorization: getBasicAuthHeader(),
        },
      }
    );

    if (response.status === 404) {
      // Bucket doesn't exist, create it
      const createResponse = await fetch(
        `${minioConfig.endpoint}/${minioConfig.bucketName}`,
        {
          method: 'PUT',
          headers: {
            Authorization: getBasicAuthHeader(),
          },
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Failed to create bucket: ${createResponse.statusText}`);
      }
      console.log('MinIO bucket created successfully');
    }
  } catch (error) {
    console.error('Error initializing MinIO bucket:', error);
    throw error;
  }
}

/**
 * Upload via proxy server (workaround for CORS)
 * @param uri - Local file URI
 * @param folder - Folder name (e.g., "chat", "users")
 * @param filename - File name
 * @returns Public URL to the uploaded file
 */
export async function uploadViaProxy(uri: string, folder: string, filename: string): Promise<string> {
  try {
    console.log('uploadViaProxy called with:', { uri, folder, filename });
    console.log('MinIO config proxyUrl:', minioConfig.proxyUrl);
    
    // Create FormData
    const formData = new FormData();
    
    // Handle different URI formats (web vs mobile)
    if (uri.startsWith('file://') || uri.startsWith('content://')) {
      // Mobile: file:// or content:// URIs - React Native FormData can handle these directly
      console.log('Using mobile file URI directly in FormData');
      // On React Native, FormData can append file URIs directly
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: filename,
      } as any);
    } else if (uri.startsWith('blob:') || uri.startsWith('http')) {
      // Web: Fetch blob first
      console.log('Fetching blob from URI for web...');
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('Blob created:', { type: blob.type, size: blob.size });
      formData.append('file', blob, filename);
    } else if (uri.startsWith('data:')) {
      // Data URI: convert to blob
      console.log('Converting data URI to blob...');
      const response = await fetch(uri);
      const blob = await response.blob();
      console.log('Blob created:', { type: blob.type, size: blob.size });
      formData.append('file', blob, filename);
    } else {
      throw new Error(`Unsupported URI format: ${uri.substring(0, 20)}...`);
    }
    
    formData.append('folder', folder);
    formData.append('filename', filename);
    
    // Use proxy server from config (detects web vs mobile)
    const proxyUrl = `${minioConfig.proxyUrl}/upload`;
    console.log('Uploading to proxy:', proxyUrl);
    
    const uploadResponse = await fetch(proxyUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header, let browser/RN set it with boundary
    });

    console.log('Proxy response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Proxy error response:', errorText);
      throw new Error(`Upload via proxy failed (${uploadResponse.status}): ${errorText}`);
    }

    const result = await uploadResponse.json();
    console.log('Upload successful via proxy:', result);
    return result.url;
    
  } catch (error: any) {
    console.error('Error uploading via proxy:', error);
    console.error('Error details:', { message: error?.message, stack: error?.stack });
    throw new Error(`Proxy upload failed: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Upload a file to MinIO storage
 * @param uri - Local file URI (from image picker or camera)
 * @param path - Remote path in MinIO bucket (e.g., "users/123/avatar.jpg")
 * @returns Public URL to the uploaded file
 */
export async function uploadToMinIO(uri: string, path: string): Promise<string> {
  try {
    console.log('uploadToMinIO called with:', { uri, path });
    
    // Fetch the file as blob
    const response = await fetch(uri);
    const blob = await response.blob();
    console.log('Blob fetched:', { type: blob.type, size: blob.size });
    
    const uploadUrl = `${minioConfig.endpoint}/${minioConfig.bucketName}/${path}`;
    console.log('Uploading to:', uploadUrl);
    
    // Build SigV4 headers (UNSIGNED-PAYLOAD to avoid hashing large blobs in-browser)
    const baseHeaders: Record<string, string> = {
      'Content-Type': blob.type || 'application/octet-stream',
      'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
    };
    const sigHeaders = await signAwsV4({
      method: 'PUT',
      url: uploadUrl,
      headers: baseHeaders,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    });
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: sigHeaders,
    });

    console.log('Upload response status:', uploadResponse.status);
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Upload error response:', errorText);
      throw new Error(`Upload failed (${uploadResponse.status}): ${uploadResponse.statusText} - ${errorText}`);
    }

    // Return the public URL
    const publicUrl = getMinioUrl(path);
    console.log('Upload successful, public URL:', publicUrl);
    return publicUrl;
  } catch (error: any) {
    console.error('Error uploading to MinIO:', error);
    throw new Error(`MinIO upload failed: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Download/Get a file from MinIO storage
 * @param path - Remote path in MinIO bucket
 * @returns Public URL to access the file
 */
export async function getFromMinIO(path: string): Promise<string> {
  return getMinioUrl(path);
}

/**
 * Delete a file from MinIO storage
 * @param path - Remote path in MinIO bucket
 */
export async function deleteFromMinIO(path: string): Promise<void> {
  try {
    const deleteUrl = `${minioConfig.endpoint}/${minioConfig.bucketName}/${path}`;
    
    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        Authorization: getBasicAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`Delete failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting from MinIO:', error);
    throw error;
  }
}

/**
 * List files in MinIO storage
 * @param prefix - Path prefix to filter by (e.g., "users/123/")
 * @returns Array of file paths
 */
export async function listFromMinIO(prefix: string = ''): Promise<string[]> {
  try {
    const listUrl = `${minioConfig.endpoint}/${minioConfig.bucketName}?prefix=${encodeURIComponent(prefix)}`;
    
    const response = await fetch(listUrl, {
      method: 'GET',
      headers: {
        Authorization: getBasicAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`List failed: ${response.statusText}`);
    }

    const text = await response.text();
    
    // Parse XML response (simple parsing for Keys)
    const keys: string[] = [];
    const keyRegex = /<Key>([^<]+)<\/Key>/g;
    let match;
    
    while ((match = keyRegex.exec(text)) !== null) {
      keys.push(match[1]);
    }
    
    return keys;
  } catch (error) {
    console.error('Error listing from MinIO:', error);
    throw error;
  }
}

/**
 * Generate Basic Auth header for MinIO
 */
function getBasicAuthHeader(): string {
  const credentials = `${minioConfig.accessKey}:${minioConfig.secretKey}`;
  let encoded = '';
  try {
    // Web
    // eslint-disable-next-line no-undef
    encoded = typeof btoa !== 'undefined' ? btoa(credentials) : '';
  } catch {}
  if (!encoded) {
    try {
      // React Native polyfill
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Buffer } = require('buffer');
      encoded = Buffer.from(credentials, 'utf8').toString('base64');
    } catch {}
  }
  if (!encoded) throw new Error('Base64 encoding not available for Basic auth');
  return `Basic ${encoded}`;
}

/**
 * Upload an avatar image for a user
 * @param uri - Local file URI
 * @param userId - User ID
 * @returns Public URL to the uploaded avatar
 */
export async function uploadAvatar(uri: string, userId: string): Promise<string> {
  const filename = 'avatar.jpg';
  const folder = `users/${userId}`;
  return uploadViaProxy(uri, folder, filename);
}

/**
 * Upload a general image
 * @param uri - Local file URI
 * @param folder - Folder name (e.g., "posts", "scans")
 * @param filename - File name
 * @returns Public URL to the uploaded image
 */
export async function uploadImage(
  uri: string,
  folder: string,
  filename: string
): Promise<string> {
  // Always use proxy for uploads (Expo Go doesn't support crypto.subtle for direct uploads)
  return await uploadViaProxy(uri, folder, filename);
}

// ===== AWS SigV4 helpers (S3 compatible) =====
/**
 * Minimal AWS SigV4 signer for S3 compatible endpoints (web only).
 * Uses UNSIGNED-PAYLOAD to avoid hashing body client-side.
 */
async function signAwsV4(params: {
  method: string;
  url: string;
  headers?: Record<string, string>;
  accessKey: string;
  secretKey: string;
  region?: string;
  service?: string;
}): Promise<Record<string, string>> {
  const { method, url, accessKey, secretKey } = params;
  const region = params.region || 'us-east-1';
  const service = params.service || 's3';
  const u = new URL(url);

  const now = new Date();
  const amzDate = toAmzDate(now);
  const shortDate = amzDate.slice(0, 8);

  const headers: Record<string, string> = {
    ...(params.headers || {}),
    host: u.host,
    'x-amz-date': amzDate,
  };

  // Canonical request
  const headerKeys = Object.keys(headers).filter((k) => headers[k as keyof typeof headers] != null);
  const canonicalHeaders = headerKeys
    .map((k) => k.toLowerCase())
    .sort()
    .map((k) => `${k}:${normalizeSpace(headers[k as keyof typeof headers] as string)}`)
    .join('\n') + '\n';
  const signedHeaders = headerKeys
    .map((k) => k.toLowerCase())
    .sort()
    .join(';');

  const canonicalQuery = canonicalQueryString(u.searchParams);
  const canonicalUri = encodeURI(u.pathname).replace(/%2F/g, '/');
  const payloadHash = headers['x-amz-content-sha256'] || 'UNSIGNED-PAYLOAD';
  const canonicalRequest = [
    method.toUpperCase(),
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  // String to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${shortDate}/${region}/${service}/aws4_request`;
  const hashedCanonicalRequest = await sha256Hex(canonicalRequest);
  const stringToSign = [algorithm, amzDate, credentialScope, hashedCanonicalRequest].join('\n');

  // Signature
  const kDate = await hmac(`AWS4${secretKey}`, shortDate);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  const signature = await hmacHex(kSigning, stringToSign);

  const authorization = `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  return { ...headers, Authorization: authorization };
}

function toAmzDate(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    d.getUTCFullYear().toString() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

function normalizeSpace(v?: string): string {
  if (typeof v !== 'string') return '';
  return v.replace(/\s+/g, ' ').trim();
}

function canonicalQueryString(sp: URLSearchParams): string {
  const pairs: string[] = [];
  sp.forEach((value, key) => {
    pairs.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  });
  return pairs.sort().join('&');
}

async function sha256Hex(text: string): Promise<string> {
  try {
    // Try expo-crypto first (React Native)
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      text
    );
    return hash;
  } catch (e) {
    // Fallback to Web Crypto API (web)
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const cryptoObj: any = (globalThis as any).crypto || (globalThis as any).webkitCrypto;
    if (!cryptoObj?.subtle) {
      throw new Error('Crypto not available to compute SHA-256 for SigV4.');
    }
    const hash = await cryptoObj.subtle.digest('SHA-256', data);
    return bufferToHex(hash);
  }
}

async function hmac(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  // For React Native, we need to use a different approach since expo-crypto doesn't support HMAC directly
  // Fall back to Web Crypto API which should work with the polyfill
  const enc = new TextEncoder();
  const cryptoObj: any = (globalThis as any).crypto || (globalThis as any).webkitCrypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Crypto not available to compute HMAC for SigV4. HMAC signing requires Web Crypto API.');
  }
  const cryptoKey = await cryptoObj.subtle.importKey(
    'raw',
    typeof key === 'string' ? enc.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await cryptoObj.subtle.sign('HMAC', cryptoKey, enc.encode(data));
  return sig;
}

async function hmacHex(key: ArrayBuffer, data: string): Promise<string> {
  const sig = await hmac(key, data);
  return bufferToHex(sig);
}

function bufferToHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}
