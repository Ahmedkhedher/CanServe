# Start MinIO Upload Proxy Server
# This bypasses CORS restrictions

Write-Host "MinIO Upload Proxy Server" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install express@^4.18.2 multer@^1.4.5-lts.1 node-fetch@^2.7.0 cors@^2.8.5 form-data@^4.0.0
    Write-Host ""
}

Write-Host "Starting proxy server on port 3001..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  Local:   http://localhost:3001" -ForegroundColor White
Write-Host "  Network: http://192.168.1.9:3001" -ForegroundColor White
Write-Host ""
Write-Host "This proxy will forward uploads to MinIO" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host ""

node minio-proxy.js
