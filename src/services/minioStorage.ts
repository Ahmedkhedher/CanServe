import { minioConfig, getMinioUrl } from '../config/minio';

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
  const path = `users/${userId}/avatar.jpg`;
  return uploadToMinIO(uri, path);
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
  const path = `${folder}/${filename}`;
  return uploadToMinIO(uri, path);
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
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const cryptoObj: any = (globalThis as any).crypto || (globalThis as any).webkitCrypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto not available to compute SHA-256 for SigV4. Run on web or add a crypto polyfill.');
  }
  const hash = await cryptoObj.subtle.digest('SHA-256', data);
  return bufferToHex(hash);
}

async function hmac(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const cryptoObj: any = (globalThis as any).crypto || (globalThis as any).webkitCrypto;
  if (!cryptoObj?.subtle) {
    throw new Error('Web Crypto not available to compute HMAC for SigV4. Run on web or add a crypto polyfill.');
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
