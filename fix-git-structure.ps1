# Fix Git Repository Structure
# This script will reinitialize the repository in FRONTEND-PROXOMA
# and remove the Desktop/PROXOMA/FRONTEND-PROXOMA path prefix

Write-Host "🔧 Fixing Git repository structure..." -ForegroundColor Yellow

# Get the remote URL before we lose it
$remoteUrl = git remote get-url origin
Write-Host "Remote URL: $remoteUrl" -ForegroundColor Cyan

# Navigate to FRONTEND-PROXOMA directory
Set-Location "C:\Users\MASTER PC\Desktop\PROXOMA\FRONTEND-PROXOMA"

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Are you in the right directory?" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found package.json - we're in the right directory" -ForegroundColor Green

# Create a backup branch first (from Desktop directory)
Write-Host "`n📦 Creating backup branch..." -ForegroundColor Yellow
Set-Location "C:\Users\MASTER PC"
git branch backup-before-fix 2>$null
Set-Location "C:\Users\MASTER PC\Desktop\PROXOMA\FRONTEND-PROXOMA"

# Initialize new repository in FRONTEND-PROXOMA
Write-Host "`n🔄 Initializing new repository in FRONTEND-PROXOMA..." -ForegroundColor Yellow
if (Test-Path ".git") {
    Write-Host "⚠️  .git folder already exists. Removing it..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force .git
}

git init
Write-Host "✅ Repository initialized" -ForegroundColor Green

# Add remote
Write-Host "`n🔗 Adding remote..." -ForegroundColor Yellow
git remote add origin $remoteUrl
Write-Host "✅ Remote added" -ForegroundColor Green

# Add all files from current directory
Write-Host "`n📝 Adding all files..." -ForegroundColor Yellow
git add .
Write-Host "✅ Files added" -ForegroundColor Green

# Create initial commit
Write-Host "`n💾 Creating commit..." -ForegroundColor Yellow
git commit -m "Fix: Restructure repository - files now at root level"
Write-Host "✅ Commit created" -ForegroundColor Green

# Force push to replace the old structure
Write-Host "`n🚀 Ready to push!" -ForegroundColor Green
Write-Host "⚠️  WARNING: This will replace the repository structure on GitHub" -ForegroundColor Yellow
Write-Host ""
Write-Host "To push, run:" -ForegroundColor Cyan
Write-Host "  git push -f origin main" -ForegroundColor White
