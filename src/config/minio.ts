export const minioConfig = {
  // Base endpoint for MinIO (no trailing slash)
  // Prefer LAN IP if you want to test from physical devices on the same network
  endpoint: (process.env.EXPO_PUBLIC_MINIO_ENDPOINT as string) || 'http://127.0.0.1:9000',
  // Public base URL used by the app to render images
  // Often the same as endpoint + '/' + bucketName
  publicBaseUrl:
    (process.env.EXPO_PUBLIC_MINIO_PUBLIC_BASE as string) || 'http://127.0.0.1:9000',
  // Bucket to store app assets
  bucketName: (process.env.EXPO_PUBLIC_MINIO_BUCKET as string) || 'cancer-app',
  // Dev credentials (use env vars in production)
  accessKey: (process.env.EXPO_PUBLIC_MINIO_ACCESS_KEY as string) || 'minioadmin',
  secretKey: (process.env.EXPO_PUBLIC_MINIO_SECRET_KEY as string) || 'minioadmin',
};

export function getMinioUrl(path: string): string {
  // Compose a public URL for an object key
  // Example: http://127.0.0.1:9000/cancer-app/users/uid/avatar.jpg
  const base = `${minioConfig.publicBaseUrl.replace(/\/$/, '')}/${minioConfig.bucketName}`;
  return `${base}/${path.replace(/^\//, '')}`;
}
