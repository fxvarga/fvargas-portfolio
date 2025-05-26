##.\localFrontend.ps1 -ResourceGroupName "fv-lab" -StorageAccountName "stuifvportfolioprodeastu"
param(
    [Parameter(Mandatory=$true)]
    [string]$StorageAccountName,

    [Parameter(Mandatory=$true)]
    [string]$ResourceGroupName
)
# Change working directory to ../frontend/vite/
Set-Location (Join-Path $PSScriptRoot "..\frontend\portfolio-react")

Write-Host "Installing frontend dependencies..."
pnpm install

Write-Host "Building frontend..."
pnpm build

Write-Host "Enabling static website on storage account..."
az storage blob service-properties update `
    --account-name $StorageAccountName `
    --static-website `
    --index-document index.html `
    --404-document index.html

Write-Host "Uploading build output to static website..."
az storage blob upload-batch `
    --account-name $StorageAccountName `
    --destination '$web' `
    --source "./build" `
    --overwrite

Set-Location $PSScriptRoot
Write-Host "Deployment complete. Your static site is now live."