// MinIO Upload Proxy Server
// This bypasses CORS restrictions by proxying uploads through a Node.js server

const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const cors = require('cors');
const FormData = require('form-data');
const crypto = require('crypto');
const os = require('os');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Get network IP for public URLs
function getNetworkIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const NETWORK_IP = getNetworkIP();

// MinIO configuration
// Use localhost for internal uploads (proxy and MinIO on same machine)
const MINIO_ENDPOINT = 'http://localhost:9000';
// Use network IP for public URLs (accessible from web and mobile)
const MINIO_PUBLIC_ENDPOINT = `http://${NETWORK_IP}:9000`;
const MINIO_BUCKET = 'test-bucket';
const MINIO_ACCESS_KEY = 'minioadmin';
const MINIO_SECRET_KEY = 'minioadmin';
const MINIO_REGION = 'us-east-1';

// Upload endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { folder, filename } = req.body;
    const path = `${folder}/${filename}`;
    
    console.log(`Uploading ${path} to MinIO...`);

    // Upload to MinIO with AWS SigV4
    const url = `${MINIO_ENDPOINT}/${MINIO_BUCKET}/${path}`;
    const contentType = req.file.mimetype || 'application/octet-stream';
    
    // Generate AWS SigV4 signature
    const signedHeaders = await generateAwsV4Signature({
      method: 'PUT',
      url: url,
      headers: {
        'Content-Type': contentType,
        'x-amz-content-sha256': 'UNSIGNED-PAYLOAD',
      },
      body: req.file.buffer,
    });
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: signedHeaders,
      body: req.file.buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('MinIO error:', errorText);
      return res.status(response.status).json({ 
        error: `MinIO upload failed: ${response.statusText}`,
        details: errorText 
      });
    }

    // Return public URL (using network IP so it works from web and mobile)
    const publicUrl = `${MINIO_PUBLIC_ENDPOINT}/${MINIO_BUCKET}/${path}`;
    console.log('Upload successful:', publicUrl);
    
    res.json({ 
      success: true, 
      url: publicUrl,
      path: path 
    });

  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Upload failed', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    minio: MINIO_ENDPOINT,
    public: MINIO_PUBLIC_ENDPOINT,
    network: NETWORK_IP
  });
});

// AWS SigV4 Signature Generator
async function generateAwsV4Signature({ method, url, headers, body }) {
  const urlObj = new URL(url);
  const host = urlObj.host;
  const pathname = urlObj.pathname;
  
  const now = new Date();
  const amzDate = toAmzDate(now);
  const dateStamp = amzDate.slice(0, 8);
  
  // Prepare headers
  const allHeaders = {
    ...headers,
    'host': host,
    'x-amz-date': amzDate,
  };
  
  // Create canonical request
  const headerKeys = Object.keys(allHeaders).sort();
  const canonicalHeaders = headerKeys
    .map(key => `${key.toLowerCase()}:${allHeaders[key].trim()}`)
    .join('\n') + '\n';
  
  const signedHeaders = headerKeys
    .map(key => key.toLowerCase())
    .join(';');
  
  const payloadHash = allHeaders['x-amz-content-sha256'] || 'UNSIGNED-PAYLOAD';
  
  const canonicalRequest = [
    method,
    pathname,
    '', // query string (empty for PUT)
    canonicalHeaders,
    signedHeaders,
    payloadHash
  ].join('\n');
  
  // Create string to sign
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${MINIO_REGION}/s3/aws4_request`;
  const requestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    requestHash
  ].join('\n');
  
  // Calculate signature
  const kDate = hmac(`AWS4${MINIO_SECRET_KEY}`, dateStamp);
  const kRegion = hmac(kDate, MINIO_REGION);
  const kService = hmac(kRegion, 's3');
  const kSigning = hmac(kService, 'aws4_request');
  const signature = hmac(kSigning, stringToSign, 'hex');
  
  // Create authorization header
  const authHeader = `${algorithm} Credential=${MINIO_ACCESS_KEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
  
  return {
    ...allHeaders,
    'Authorization': authHeader,
  };
}

function toAmzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function hmac(key, data, encoding = 'binary') {
  const hmac = crypto.createHmac('sha256', key);
  hmac.update(data);
  return encoding === 'hex' ? hmac.digest('hex') : hmac.digest();
}

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('========================================');
  console.log('  MinIO Upload Proxy Server');
  console.log('========================================');
  console.log(`  Running on: http://localhost:${PORT}`);
  console.log(`  Network:    http://192.168.1.9:${PORT}`);
  console.log(`  MinIO:      ${MINIO_ENDPOINT}`);
  console.log(`  Bucket:     ${MINIO_BUCKET}`);
  console.log('========================================');
  console.log('');
  console.log('Ready to proxy uploads! 🚀');
  console.log('');
});
