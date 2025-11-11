// Detect if running on web vs native
const isWeb = typeof window !== 'undefined' && typeof window.document !== 'undefined';

// Use localhost for web, LAN IP for mobile devices
const NETWORK_IP = '192.168.1.9';
const MINIO_PORT = '9000';
const PROXY_PORT = '3001';

export const minioConfig = {
  // Base endpoint for MinIO (no trailing slash)
  // Using LAN IP to work on physical devices on the same network
  endpoint: (process.env.EXPO_PUBLIC_MINIO_ENDPOINT as string) || 
    (isWeb ? `http://localhost:${MINIO_PORT}` : `http://${NETWORK_IP}:${MINIO_PORT}`),
  // Public base URL used by the app to render images
  // Using LAN IP so phone can access the images
  publicBaseUrl:
    (process.env.EXPO_PUBLIC_MINIO_PUBLIC_BASE as string) || 
    (isWeb ? `http://localhost:${MINIO_PORT}` : `http://${NETWORK_IP}:${MINIO_PORT}`),
  // Proxy URL for uploads (to avoid CORS)
  proxyUrl: (process.env.EXPO_PUBLIC_PROXY_URL as string) || 
    (isWeb ? `http://localhost:${PROXY_PORT}` : `http://${NETWORK_IP}:${PROXY_PORT}`),
  // Bucket to store app assets (created by user)
  bucketName: (process.env.EXPO_PUBLIC_MINIO_BUCKET as string) || 'test-bucket',
  // Dev credentials (default MinIO credentials)
  accessKey: (process.env.EXPO_PUBLIC_MINIO_ACCESS_KEY as string) || 'minioadmin',
  secretKey: (process.env.EXPO_PUBLIC_MINIO_SECRET_KEY as string) || 'minioadmin',
};

export function getMinioUrl(path: string): string {
  // Compose a public URL for an object key
  // Example: http://127.0.0.1:9000/cancer-app/users/uid/avatar.jpg
  const base = `${minioConfig.publicBaseUrl.replace(/\/$/, '')}/${minioConfig.bucketName}`;
  return `${base}/${path.replace(/^\//, '')}`;
}
