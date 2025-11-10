# MinIO Setup Script
# Run this script to configure the test-bucket for public read access

Write-Host "Setting up MinIO bucket for public read access..." -ForegroundColor Green

# Set bucket policy to allow public read access
$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::test-bucket/*"]
    }
  ]
}
"@

# Save policy to temp file
$policyFile = "bucket-policy.json"
$policy | Out-File -FilePath $policyFile -Encoding UTF8

Write-Host "Setting bucket policy..." -ForegroundColor Yellow
.\mc.exe policy set-json $policyFile myminio/test-bucket

# Alternative: Set bucket to download (public read)
Write-Host "Setting bucket to public download access..." -ForegroundColor Yellow
.\mc.exe anonymous set download myminio/test-bucket

Write-Host "MinIO setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your MinIO is now configured:" -ForegroundColor Cyan
Write-Host "  - Endpoint: http://192.168.1.9:9000" -ForegroundColor White
Write-Host "  - Bucket: test-bucket" -ForegroundColor White
Write-Host "  - Public read access enabled" -ForegroundColor White
Write-Host ""
Write-Host "Test your setup:" -ForegroundColor Cyan
Write-Host "  .\mc.exe ls myminio/test-bucket" -ForegroundColor White

# Clean up
Remove-Item $policyFile -ErrorAction SilentlyContinue
