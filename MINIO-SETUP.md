# MinIO Cloud Storage Setup Guide

## ✅ What You've Already Done

You've successfully:
1. ✅ Started MinIO server at `http://192.168.1.9:9000`
2. ✅ Created an alias `myminio` for the MinIO server
3. ✅ Created the `test-bucket` bucket

## 📦 Current Configuration

Your app is now configured to use:
- **Endpoint**: `http://192.168.1.9:9000`
- **Bucket**: `test-bucket`
- **Credentials**: `minioadmin` / `minioadmin`

## 🔧 Complete Setup

### Step 1: Make Bucket Public (Required)

For images to be accessible on your phone, run this command:

```powershell
.\mc.exe anonymous set download myminio/test-bucket
```

This allows public read access to all files in the bucket.

### Step 2: Verify Setup

Test that the bucket is accessible:

```powershell
# List files in bucket
.\mc.exe ls myminio/test-bucket

# Upload a test file
.\mc.exe cp avatar.jpg myminio/test-bucket/test.jpg

# Test public access (should work without auth)
curl http://192.168.1.9:9000/test-bucket/test.jpg
```

### Step 3: Start the App

1. Make sure MinIO server is running:
   ```powershell
   .\minio.exe server C:\Users\ahmed\CascadeProjects\cloud\data1 C:\Users\ahmed\CascadeProjects\cloud\data2 --console-address ":9001"
   ```

2. Start your React Native app:
   ```powershell
   npm start
   ```

3. Check the console logs - you should see:
   ```
   === MinIO Configuration ===
   Endpoint: http://192.168.1.9:9000
   Public Base: http://192.168.1.9:9000
   Bucket: test-bucket
   Access Key: minioadmin
   ==========================
   ```

## 📱 How It Works

### Avatar Upload Flow

When a user uploads an avatar in the onboarding screen:

1. User selects an image from their phone
2. App uploads to: `http://192.168.1.9:9000/test-bucket/users/{userId}/avatar.jpg`
3. Image is stored in your local MinIO server
4. App displays image from: `http://192.168.1.9:9000/test-bucket/users/{userId}/avatar.jpg`

### File Structure

```
test-bucket/
├── users/
│   ├── {userId1}/
│   │   └── avatar.jpg
│   ├── {userId2}/
│   │   └── avatar.jpg
│   └── ...
├── posts/
│   └── {postId}/
│       └── image.jpg
└── scans/
    └── {scanId}/
        └── scan.jpg
```

## 🔍 Testing Upload

### From the App

1. Go through onboarding and upload an avatar
2. Check MinIO:
   ```powershell
   .\mc.exe ls myminio/test-bucket/users/
   ```

### From MinIO Web UI

Open http://192.168.1.9:9001 in your browser:
- Username: `minioadmin`
- Password: `minioadmin`

You'll see uploaded files in the `test-bucket`.

## 🐛 Troubleshooting

### Images Not Loading on Phone

**Problem**: Avatar uploads work but images don't display on phone

**Solution**: 
1. Ensure your phone and computer are on the same WiFi network
2. Check firewall isn't blocking port 9000
3. Verify bucket is public:
   ```powershell
   .\mc.exe anonymous get myminio/test-bucket
   ```
   Should output: `download`

### Upload Fails

**Problem**: Upload returns 403 Forbidden

**Solution**:
1. Check MinIO server is running
2. Verify credentials in `src/config/minio.ts`
3. Check bucket exists:
   ```powershell
   .\mc.exe ls myminio
   ```

### Can't Connect to MinIO

**Problem**: App shows connection errors

**Solution**:
1. Ping the MinIO server:
   ```powershell
   curl http://192.168.1.9:9000
   ```
2. Check MinIO server logs in the terminal where it's running
3. Try using `127.0.0.1` instead if testing on the same machine

## 🔒 Production Notes

For production deployment:

1. **Change Default Credentials**:
   Set environment variables:
   ```
   MINIO_ROOT_USER=your-username
   MINIO_ROOT_PASSWORD=your-secure-password
   ```

2. **Use HTTPS**:
   Deploy MinIO behind a reverse proxy (nginx/traefik) with SSL

3. **Use Environment Variables**:
   Create `.env` file:
   ```
   EXPO_PUBLIC_MINIO_ENDPOINT=https://your-domain.com
   EXPO_PUBLIC_MINIO_BUCKET=production-bucket
   EXPO_PUBLIC_MINIO_ACCESS_KEY=your-key
   EXPO_PUBLIC_MINIO_SECRET_KEY=your-secret
   ```

## 📚 Useful Commands

```powershell
# List all buckets
.\mc.exe ls myminio

# List files in bucket
.\mc.exe ls myminio/test-bucket

# Upload file
.\mc.exe cp localfile.jpg myminio/test-bucket/path/to/file.jpg

# Download file
.\mc.exe cp myminio/test-bucket/path/to/file.jpg ./localfile.jpg

# Delete file
.\mc.exe rm myminio/test-bucket/path/to/file.jpg

# Get bucket policy
.\mc.exe anonymous get myminio/test-bucket

# Set bucket to public download
.\mc.exe anonymous set download myminio/test-bucket

# Set bucket to private
.\mc.exe anonymous set none myminio/test-bucket
```

## ✅ Verification Checklist

Before testing on phone:

- [ ] MinIO server is running
- [ ] `test-bucket` exists
- [ ] Bucket is set to public download
- [ ] Can access http://192.168.1.9:9000 from your network
- [ ] App shows MinIO configuration in console logs
- [ ] Phone and computer are on same WiFi

## 🎉 Success!

Your local cloud storage is now integrated! Users can:
- Upload profile avatars
- Upload images for posts
- Upload food scans
- All files are stored locally on your MinIO server
