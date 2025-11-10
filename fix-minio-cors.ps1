# Fix MinIO CORS Issues
# This script configures MinIO to accept requests from your web app

Write-Host "Configuring MinIO CORS settings..." -ForegroundColor Green

# Set CORS configuration using mc admin
Write-Host ""
Write-Host "Step 1: Setting bucket policy for public access..." -ForegroundColor Yellow
.\mc.exe anonymous set download myminio/test-bucket

Write-Host ""
Write-Host "Step 2: Creating CORS configuration..." -ForegroundColor Yellow

# Create a JSON file for CORS configuration
$corsConfig = @"
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-request-id"]
    }
  ]
}
"@

$corsFile = "cors-config.json"
$corsConfig | Out-File -FilePath $corsFile -Encoding UTF8

Write-Host ""
Write-Host "CORS configuration created in $corsFile" -ForegroundColor Cyan

Write-Host ""
Write-Host "To apply CORS, you need to:" -ForegroundColor Yellow
Write-Host "1. Stop your MinIO server (Ctrl+C in the MinIO terminal)" -ForegroundColor White
Write-Host "2. Restart MinIO with CORS enabled:" -ForegroundColor White
Write-Host ""
Write-Host "   Set environment variables:" -ForegroundColor Cyan
Write-Host '   $env:MINIO_API_CORS_ALLOW_ORIGIN="*"' -ForegroundColor White
Write-Host ""
Write-Host "   Then restart MinIO:" -ForegroundColor Cyan
Write-Host '   .\minio.exe server C:\Users\ahmed\CascadeProjects\cloud\data1 C:\Users\ahmed\CascadeProjects\cloud\data2 --console-address ":9001"' -ForegroundColor White

Write-Host ""
Write-Host "OR use this one-liner command:" -ForegroundColor Green
Write-Host ""
Write-Host '$env:MINIO_API_CORS_ALLOW_ORIGIN="*"; .\minio.exe server C:\Users\ahmed\CascadeProjects\cloud\data1 C:\Users\ahmed\CascadeProjects\cloud\data2 --console-address ":9001"' -ForegroundColor Cyan

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
